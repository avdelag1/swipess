/** Vercel serverless — serves the Mapbox public token at request time (no rebuild needed). */
function pickMapboxToken(): string {
  const raw = (
    process.env.VITE_MAPBOX_ACCESS_TOKEN
    || process.env.VITE_MAPBOX_TOKEN
    || process.env.MAPBOX_ACCESS_TOKEN
    || process.env.MAPBOX_TOKEN
    || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    || ''
  ).trim().replace(/^['"]|['"]$/g, '');

  if (raw.length > 8 && (raw.startsWith('pk.') || raw.startsWith('sk.'))) {
    return raw.startsWith('pk.') ? raw : '';
  }
  return '';
}

export default function handler(_req: unknown, res: { setHeader: (k: string, v: string) => void; status: (n: number) => { json: (b: object) => void } }) {
  const token = pickMapboxToken();
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ token, configured: token.length > 0 });
}