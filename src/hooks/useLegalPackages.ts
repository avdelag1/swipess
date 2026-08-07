import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { LegalPackage } from '@/data/legalPackages';

// `legal_service_packages` / `legal_package_requests` are shared with the
// Lawyer Portal and aren't part of this app's generated Supabase types, so we
// access them through a loosely-typed client handle.
const db = supabase as unknown as {
  from: (table: string) => any;
};

function normalizeFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((f) => String(f));
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((f) => String(f)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Loads the live legal-service catalogue from the shared Supabase project.
 * No synthetic packages are shown when the catalogue is empty or unavailable.
 */
export function useLegalPackages() {
  return useQuery<LegalPackage[]>({
    queryKey: ['legal_service_packages'],
    queryFn: async () => {
      try {
        const { data, error } = await db
          .from('legal_service_packages')
          .select('id, name, category, description, price, duration_days, features, is_active')
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) return [];

        return (data as any[]).map((row) => ({
          id: String(row.id),
          name: String(row.name),
          category: String(row.category),
          description: row.description ?? null,
          price: Number(row.price) || 0,
          duration_days: row.duration_days ?? null,
          features: normalizeFeatures(row.features),
          is_active: row.is_active ?? true,
        }));
      } catch (err) {
        logger.error('Failed to load legal packages', err);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export interface LegalRequestPayload {
  packageId: string | null;
  packageName: string;
  packageCategory: string;
  quotedPrice: number | null;
  situation: string;
  fullName: string;
  email: string;
  phone: string;
  preferredContact: string;
  requestType: 'request' | 'custom_quote';
}

/**
 * Submits a package request to the shared DB. The Lawyer Portal reads
 * `legal_package_requests` and continues the conversation / quoting there.
 */
export async function submitLegalPackageRequest(
  userId: string,
  payload: LegalRequestPayload,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await db.from('legal_package_requests').insert({
      requested_by: userId,
      package_id: payload.packageId && !payload.packageId.startsWith('seed-') ? payload.packageId : null,
      package_name: payload.packageName,
      package_category: payload.packageCategory,
      quoted_price: payload.quotedPrice,
      situation: payload.situation,
      full_name: payload.fullName || null,
      email: payload.email || null,
      phone: payload.phone || null,
      preferred_contact: payload.preferredContact,
      request_type: payload.requestType,
      status: 'pending',
      source: 'swipess_app',
    });

    if (error) {
      logger.error('Failed to submit legal package request', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    logger.error('Unexpected error submitting legal package request', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export interface ProfilePrefill {
  fullName: string;
  email: string;
  phone: string;
}

/** Best-effort prefill of the request form from the user's profile. */
export async function fetchProfilePrefill(userId: string, userEmail?: string | null): Promise<ProfilePrefill> {
  const result: ProfilePrefill = { fullName: '', email: userEmail ?? '', phone: '' };
  try {
    const { data } = await db
      .from('profiles')
      .select('name, full_name, phone, contact_phone, contact_email, email')
      .eq('id', userId)
      .maybeSingle();
    if (data) {
      result.fullName = data.full_name || data.name || '';
      result.phone = data.phone || data.contact_phone || '';
      result.email = userEmail || data.contact_email || data.email || '';
    }
  } catch {
    /* prefill is best-effort */
  }
  return result;
}
