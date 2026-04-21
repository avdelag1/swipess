/**
 * Network-Aware Adaptation Utility
 * 
 * Detects connection quality and device capabilities to dynamically
 * scale prefetch depth, image quality, and video preloading.
 * Inspired by Meta's 2026 adaptive preload strategies.
 */

export interface NetworkProfile {
  /** How many cards ahead to prefetch (1-5) */
  prefetchDepth: number;
  /** Image quality tier */
  imageQuality: 'high' | 'medium' | 'low';
  /** Whether to preload video content */
  enableVideoPrefetch: boolean;
  /** Whether to pre-decode images to GPU */
  enablePreDecode: boolean;
  /** Connection type label for logging */
  connectionType: string;
}

// Extend Navigator for connection API (not in all TS libs)
interface NetworkInformation {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

function getConnection(): NetworkInformation | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection || null;
}

function getDeviceMemory(): number {
  if (typeof navigator === 'undefined') return 4;
  return (navigator as any).deviceMemory ?? 4; // default assume mid-range
}

/**
 * Returns a network profile describing current device + connection capabilities.
 * Call this before prefetching to dynamically scale resource loading.
 */
export function getNetworkProfile(): NetworkProfile {
  const conn = getConnection();
  const memory = getDeviceMemory();
  const effectiveType = conn?.effectiveType ?? '4g';
  const saveData = conn?.saveData ?? false;

  // Data saver mode — minimal everything
  if (saveData) {
    return {
      prefetchDepth: 1,
      imageQuality: 'low',
      enableVideoPrefetch: false,
      enablePreDecode: false,
      connectionType: `${effectiveType} (save-data)`,
    };
  }

  // Slow connections (2g, slow-2g)
  if (effectiveType === '2g' || effectiveType === 'slow-2g' || memory < 2) {
    return {
      prefetchDepth: 1,
      imageQuality: 'low',
      enableVideoPrefetch: false,
      enablePreDecode: false,
      connectionType: effectiveType,
    };
  }

  // Medium connections (3g) or low memory
  if (effectiveType === '3g' || memory < 4) {
    return {
      prefetchDepth: 2,
      imageQuality: 'medium',
      enableVideoPrefetch: false,
      enablePreDecode: true,
      connectionType: effectiveType,
    };
  }

  // Fast connections (4g+) with good hardware
  return {
    prefetchDepth: 5,
    imageQuality: 'high',
    enableVideoPrefetch: true,
    enablePreDecode: true,
    connectionType: effectiveType,
  };
}

/**
 * Subscribe to network changes. Returns cleanup function.
 */
export function onNetworkChange(callback: (profile: NetworkProfile) => void): () => void {
  const conn = getConnection();
  if (!conn?.addEventListener) return () => {};
  
  const handler = () => callback(getNetworkProfile());
  conn.addEventListener('change', handler);
  return () => conn.removeEventListener?.('change', handler);
}

