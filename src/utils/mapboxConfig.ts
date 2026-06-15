/** Resolve Mapbox token — Vite build-time env + common Vercel naming + HTML meta fallback. */
export function getMapboxAccessToken(): string {
  const candidates: string[] = [];

  const fromVite = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (typeof fromVite === 'string') candidates.push(fromVite);

  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="swipess-mapbox-token"]')?.getAttribute('content');
    if (meta) candidates.push(meta);
  }

  for (const raw of candidates) {
    const trimmed = raw.trim().replace(/^['"]|['"]$/g, '');
    if (
      trimmed.length > 8
      && trimmed.startsWith('pk.')
      && !trimmed.includes('your-mapbox')
      && trimmed !== 'undefined'
    ) {
      return trimmed;
    }
  }

  return '';
}

export function isMapboxConfigured(): boolean {
  return getMapboxAccessToken().length > 0;
}