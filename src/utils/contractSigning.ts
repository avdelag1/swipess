import { supabase } from '@/integrations/supabase/client';

export type ContractSignStatus = 'draft' | 'sent' | 'signed';

export interface ContractParty {
  id: string;
  name: string;
}

/** Resolve tenant/landlord from email, name, or user id. */
export async function resolveCounterpartyId(input: string): Promise<ContractParty | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRe.test(trimmed)) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', trimmed)
      .maybeSingle();
    if (data?.id) return { id: data.id, name: data.full_name || 'User' };
  }

  if (trimmed.includes('@')) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', trimmed)
      .limit(1)
      .maybeSingle();
    if (data?.id) return { id: data.id, name: data.full_name || trimmed };
  }

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', `%${trimmed}%`)
    .limit(1)
    .maybeSingle();
  if (data?.id) return { id: data.id, name: data.full_name || trimmed };

  return null;
}

export function computeContractStatus(contract: {
  owner_id: string;
  client_id: string;
  owner_signature?: string | null;
  client_signature?: string | null;
}): ContractSignStatus {
  const ownerSigned = !!contract.owner_signature;
  const clientSigned = !!contract.client_signature;
  if (ownerSigned && clientSigned) return 'signed';
  if (ownerSigned || clientSigned) return 'sent';
  if (contract.client_id && contract.client_id !== contract.owner_id) return 'sent';
  return 'draft';
}

export function userNeedsSignature(
  contract: {
    owner_id: string;
    client_id: string;
    owner_signature?: string | null;
    client_signature?: string | null;
    status?: string | null;
  },
  userId: string,
): boolean {
  if (contract.status === 'signed') return false;
  if (contract.owner_id === userId && !contract.owner_signature) return true;
  if (contract.client_id === userId && contract.client_id !== contract.owner_id && !contract.client_signature) {
    return true;
  }
  return false;
}

export async function notifyContractEvent(opts: {
  recipientId: string;
  senderId: string;
  contractId: string;
  title: string;
  type: 'contract_pending' | 'contract_signed';
  linkPath: string;
  message: string;
}) {
  await supabase.from('notifications').insert({
    user_id: opts.recipientId,
    notification_type: opts.type,
    title: opts.title,
    message: opts.message,
    is_read: false,
    related_user_id: opts.senderId,
    link_url: opts.linkPath,
    metadata: { contract_id: opts.contractId },
  } as any);

  supabase.functions.invoke('send-push-notification', {
    body: {
      userId: opts.recipientId,
      title: opts.title,
      body: opts.message,
      url: opts.linkPath,
    },
  }).catch(() => {});
}