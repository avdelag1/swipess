export function logSupabaseError(op: string, error: unknown) {
  if (!error) return;
  console.error(`[supabase:${op}]`, error);
}

