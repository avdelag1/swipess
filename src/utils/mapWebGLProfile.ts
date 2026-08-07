/**
 * Adaptive Mapbox rendering profile.
 *
 * Chrome / modern GPUs → full cinematic Mapbox GL JS v3.
 * Safari + weak WebGL (UBO size 0, old iPhones) → lighter options and/or
 * Mapbox GL JS v2 (WebGL1) so the map still paints.
 */

export type MapRenderTier = 'full' | 'lite' | 'legacy';

export interface MapWebGLProfile {
  tier: MapRenderTier;
  /** Use mapbox-gl@2 (WebGL1) instead of v3 */
  useLegacyGl: boolean;
  /** Map style URL */
  style: string;
  pitch: number;
  maxPitch: number;
  bearing: number;
  pixelRatio: number;
  powerPreference: WebGLPowerPreference;
  antialias: boolean;
  /** Mapbox fog (often blanks Safari) */
  enableFog: boolean;
  /** 3D extruded buildings */
  enable3dBuildings: boolean;
  /** Pitch / rotate gestures */
  enablePitchRotate: boolean;
  /** Human label for debug UI */
  reason: string;
  maxUniformBlockSize: number;
  hasWebGL2: boolean;
}

let cached: MapWebGLProfile | null = null;
/** Set after a live WebGL failure so the next init always uses Mapbox v2. */
let forceLegacy = false;

function isAppleWebKit(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.getPlatform?.() === 'ios') return true;
  if (cap?.isNativePlatform?.() && /iPhone|iPad|iPod/i.test(ua)) return true;
  if (/AppleWebKit/i.test(ua) && !/Chrome|CriOS|Chromium|Edg|FxiOS|OPR|Android/i.test(ua)) return true;
  return /^((?!chrome|android).)*safari/i.test(ua);
}

/** Rough old-device detection (iPhone 8 / SE1 class and similar). */
function isLegacyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPhone 8 / 7 / 6s era often still report as iPhone OS 16+ with limited GPU
  if (/iPhone\s*OS\s*(1[0-5]|[1-9])_/i.test(ua)) return true;
  // Hardware concurrency is a weak signal but helps flag very old SoCs
  if (/iPhone|iPad|iPod/i.test(ua) && typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) {
    // A11 and earlier often ≤6 cores; keep conservative and combine with WebGL probe
    return navigator.hardwareConcurrency <= 2;
  }
  return false;
}

function probeWebGL(): { hasWebGL2: boolean; maxUniformBlockSize: number; renderer: string } {
  if (typeof document === 'undefined') {
    return { hasWebGL2: false, maxUniformBlockSize: 0, renderer: '' };
  }
  // Prefer UA heuristics over creating WebGL probe contexts on Safari —
  // probing with getContext + loseContext was itself spamming "context lost"
  // and counting toward the browser's WebGL context limit.
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    const apple =
      /AppleWebKit/i.test(ua) && !/Chrome|CriOS|Chromium|Edg|FxiOS|OPR|Android/i.test(ua);
    const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
    const isIos = cap?.getPlatform?.() === 'ios' || /iPhone|iPad|iPod/i.test(ua);
    // Safari / iOS: treat as broken UBO unless we later prove otherwise — Mapbox v3
    // was blanking maps with "UBO size 16384 exceeds device limit 0".
    if (apple || isIos) {
      return { hasWebGL2: true, maxUniformBlockSize: 0, renderer: 'apple-webgl-assume-weak' };
    }
  }

  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    gl = canvas.getContext('webgl2', {
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'default',
      antialias: false,
      depth: false,
      stencil: false,
    }) as WebGL2RenderingContext | null;

    if (gl && 'MAX_UNIFORM_BLOCK_SIZE' in gl) {
      const gl2 = gl as WebGL2RenderingContext;
      const maxUbo = Number(gl2.getParameter(gl2.MAX_UNIFORM_BLOCK_SIZE)) || 0;
      const dbg = gl2.getExtension('WEBGL_debug_renderer_info');
      const renderer = dbg
        ? String(gl2.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
        : String(gl2.getParameter(gl2.RENDERER) || '');
      // Detach canvas; avoid loseContext() noise on Safari
      canvas.width = 0;
      canvas.height = 0;
      return { hasWebGL2: true, maxUniformBlockSize: maxUbo, renderer };
    }

    gl = (canvas.getContext('webgl', { antialias: false, depth: false })
      || canvas.getContext('experimental-webgl', { antialias: false, depth: false })) as WebGLRenderingContext | null;
    if (gl) {
      canvas.width = 0;
      canvas.height = 0;
      return { hasWebGL2: false, maxUniformBlockSize: 0, renderer: 'webgl1' };
    }
  } catch {
    /* empty */
  }
  return { hasWebGL2: false, maxUniformBlockSize: 0, renderer: '' };
}

/**
 * Compute (and cache) the adaptive map profile for this browser/device.
 */
export function getMapWebGLProfile(): MapWebGLProfile {
  if (cached) return cached;

  const apple = isAppleWebKit();
  const oldMobile = isLegacyMobileDevice();
  const { hasWebGL2, maxUniformBlockSize, renderer } = probeWebGL();

  // Mapbox GL v3 needs WebGL2 + real UBO size. "exceeds device limit 0" = maxUbo 0.
  const uboBroken = !hasWebGL2 || maxUniformBlockSize < 16384;
  const weakGpu =
    uboBroken
    || /SwiftShader|llvmpipe|Software/i.test(renderer)
    || (apple && oldMobile);

  let tier: MapRenderTier;
  if (forceLegacy || uboBroken || !hasWebGL2) {
    tier = 'legacy'; // Mapbox v2 / WebGL1 — required when UBO size is 0
  } else if (apple || weakGpu) {
    // Safari / older iPhones: keep v3 if UBO is healthy, but flat + no fog/3d
    tier = 'lite';
  } else {
    tier = 'full';
  }

  const profile: MapWebGLProfile = {
    tier,
    useLegacyGl: tier === 'legacy',
    // streets is lighter than outdoors on weak GPUs; still looks good
    style: tier === 'full'
      ? 'mapbox://styles/mapbox/outdoors-v12'
      : 'mapbox://styles/mapbox/streets-v12',
    pitch: tier === 'full' ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 52 : 60) : 0,
    maxPitch: tier === 'full' ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 65) : 0,
    bearing: tier === 'full' ? 25 : 0,
    pixelRatio: tier === 'full'
      ? Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
      : 1,
    powerPreference: 'default',
    antialias: false,
    enableFog: tier === 'full',
    enable3dBuildings: tier === 'full' && typeof window !== 'undefined' && window.innerWidth >= 768,
    enablePitchRotate: tier === 'full',
    reason: `tier=${tier}; apple=${apple}; webgl2=${hasWebGL2}; maxUBO=${maxUniformBlockSize}; renderer=${renderer.slice(0, 40)}`,
    maxUniformBlockSize,
    hasWebGL2,
  };

  cached = profile;
  // Dev-only diagnostics — avoid noisy console on production Safari/WKWebView
  if (typeof console !== 'undefined' && import.meta.env.DEV) {
    console.debug('[MapWebGL]', profile.reason);
  }
  return profile;
}

/** Force re-probe (e.g. after webglcontextlost recovery). */
export function resetMapWebGLProfile(): void {
  cached = null;
}

/** Next init must use Mapbox GL v2 (call after live WebGL/UBO failure). */
export function forceLegacyMapProfile(): void {
  forceLegacy = true;
  cached = null;
}
