/**
 * Listing save with live-schema adaptation.
 * Retries the insert/update, stripping any column the live schema rejects,
 * so a stale generated-types file or a renamed column never blocks a publish.
 * Shared by UnifiedListingForm (manual flow) and AIListingWizard (direct AI publish).
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from './prodLogger';

const getMissingSchemaColumn = (message?: string | null) => {
  if (!message) return null;
  const quoted = message.match(/['"]([^'"]+)['"]\s+column|column\s+['"]([^'"]+)['"]|find the ['"]([^'"]+)['"] column/i);
  return quoted?.[1] || quoted?.[2] || quoted?.[3] || null;
};

export const saveListingWithSchemaRetry = async (
  payload: Record<string, any>,
  editingId: string | null
) => {
  let safeData = { ...payload };
  if (editingId) {
    delete safeData.user_id;
  }
  const removedColumns = new Set<string>();
  const withTimeout = async <T,>(promise: PromiseLike<T>, label: string): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after 20s. Please try again.`)), 20000)
    );
    return Promise.race([Promise.resolve(promise), timeout]);
  };

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const result = await withTimeout(
      editingId
        ? supabase.from('listings').update(safeData as any).eq('id', editingId).select().single()
        : supabase.from('listings').insert(safeData as any).select().single(),
      editingId ? 'Listing update' : 'Listing publish'
    );

    if (!result.error) return result.data;

    const errorMsg = result.error.message?.toLowerCase() || '';
    const isSchemaError = errorMsg.includes('could not find') || errorMsg.includes('schema cache') || errorMsg.includes('column');
    const missingColumn = getMissingSchemaColumn(result.error.message);

    if (!isSchemaError || !missingColumn || safeData[missingColumn] === undefined || removedColumns.has(missingColumn)) {
      throw result.error;
    }

    removedColumns.add(missingColumn);
    const { [missingColumn]: _removed, ...nextData } = safeData;
    safeData = nextData;
    logger.warn(`Live listing schema rejected "${missingColumn}" — retrying without it.`);
  }

  throw new Error('Listing save failed after adapting to the live schema.');
};
