import { logger } from '@/utils/prodLogger';

export function logSupabaseError(op: string, error: unknown) {
  if (!error) return;
  logger.error(`[supabase:${op}]`, error);
}


