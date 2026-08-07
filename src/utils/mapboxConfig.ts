function normalizeMapboxToken(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '');
  if (
    trimmed.length > 8
    && (trimmed.startsWith('pk.') || trimmed.startsWith('sk.'))
    && !trimmed.includes('your-mapbox')
    && trimmed !== 'undefined'
  ) {
    return trimmed;
  }
  return '';
}

function readBuildTimeToken(): string {
  return normalizeMapboxToken(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN);
}

function readMetaToken(): string {
  if (typeof document === 'undefined') return '';
  const meta = document.querySelector('meta[name="swipess-mapbox-token"]')?.getAttribute('content');
  return normalizeMapboxToken(meta ?? '');
}

let runtimeToken: string | null = null;
let fetchPromise: Promise<string> | null = null;

/** Sync token — build-time bundle value + HTML meta tag. */
export function getMapboxAccessToken(): string {
  if (runtimeToken) return runtimeToken;

  const fromBuild = readBuildTimeToken();
  if (fromBuild) return fromBuild;

  const fromMeta = readMetaToken();
  if (fromMeta) return fromMeta;

  return '';
}

/** Last-resort public token so the map never hangs when env/API is missing. */
function fallbackMapboxToken(): string {
  try {
    return atob(
      'cGsuZXlKMUlqb2ljM2RwY0dWemN5SXNJbUVpT2lKamJUQnlaM3AxY1d3d2MzSnBNbXh2Ym5wcU1tb3dNMlkwaW4wLlg4LXZYLTEtOGFOOEs5UVd3LXEtUlE=',
    );
  } catch {
    return '';
  }
}

/**
 * Async token — falls back to /api/mapbox-token so a Vercel env change can work
 * without users being stuck on a stale service-worker bundle.
 * On Capacitor (no /api), falls back immediately to the embedded public token.
 */
export async function resolveMapboxAccessToken(): Promise<string> {
  const sync = getMapboxAccessToken();
  if (sync) {
    runtimeToken = sync;
    return sync;
  }

  if (!fetchPromise) {
    const isNative =
      typeof window !== 'undefined'
      && !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

    if (isNative) {
      // Native shell has no Vercel /api route — use bundled/fallback token only.
      const token = fallbackMapboxToken();
      if (token) runtimeToken = token;
      fetchPromise = Promise.resolve(token);
      return fetchPromise;
    }

    fetchPromise = fetch('/api/mapbox-token', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { token: '' }))
      .then((data: { token?: string }) => {
        let token = normalizeMapboxToken(data?.token ?? '');
        if (!token) token = fallbackMapboxToken();
        if (token) runtimeToken = token;
        return token;
      })
      .catch(() => {
        const token = fallbackMapboxToken();
        if (token) runtimeToken = token;
        return token;
      });
  }

  return fetchPromise;
}

export function isMapboxConfigured(): boolean {
  return getMapboxAccessToken().length > 0;
}

export async function isMapboxConfiguredAsync(): Promise<boolean> {
  return (await resolveMapboxAccessToken()).length > 0;
}