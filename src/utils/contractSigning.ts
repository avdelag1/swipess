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

export interface ShareContractResult {
  contract: Record<string, unknown>;
  attachment: {
    type: 'digital_contract';
    id: string;
    title: string;
    status: ContractSignStatus;
    template_type?: string;
  };
  content: string;
  notify: boolean;
}

/** Assign, clone, or reuse a vault lease for a chat counterparty. */
export async function shareContractInConversation(opts: {
  contract: Record<string, unknown>;
  senderId: string;
  recipientId: string;
  recipientRole: 'client' | 'owner';
}): Promise<ShareContractResult> {
  const contract = opts.contract;
  const contractId = contract.id as string;
  const ownerId = contract.owner_id as string;
  const clientId = contract.client_id as string;
  const title = (contract.title as string) || 'Lease';
  const templateType = contract.template_type as string | undefined;

  if (opts.senderId !== ownerId && opts.senderId !== clientId) {
    throw new Error('You are not a party on this document.');
  }

  const linkPath = opts.recipientRole === 'client' ? '/client/contracts' : '/owner/contracts';
  let saved = contract;

  if (clientId === opts.recipientId) {
    const status = computeContractStatus({
      owner_id: ownerId,
      client_id: clientId,
      owner_signature: contract.owner_signature as string | null | undefined,
      client_signature: contract.client_signature as string | null | undefined,
    });
    return {
      contract: saved,
      attachment: { type: 'digital_contract', id: contractId, title, status, template_type: templateType },
      content: status === 'signed'
        ? `Fully signed lease: "${title}"`
        : `Lease ready for you: "${title}"`,
      notify: status !== 'signed' && userNeedsSignature(saved as any, opts.recipientId),
    };
  }

  if (clientId === ownerId) {
    const { data, error } = await supabase
      .from('digital_contracts')
      .update({
        client_id: opts.recipientId,
        status: 'sent',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', contractId)
      .select('*')
      .single();
    if (error) throw error;
    saved = data as Record<string, unknown>;

    await notifyContractEvent({
      recipientId: opts.recipientId,
      senderId: opts.senderId,
      contractId,
      title: 'Lease Ready to Sign',
      type: 'contract_pending',
      linkPath,
      message: `"${title}" is waiting for your signature.`,
    });

    return {
      contract: saved,
      attachment: { type: 'digital_contract', id: contractId, title, status: 'sent', template_type: templateType },
      content: `Sent lease for signature: "${title}"`,
      notify: false,
    };
  }

  const { data: cloned, error: cloneError } = await supabase
    .from('digital_contracts')
    .insert({
      owner_id: ownerId,
      client_id: opts.recipientId,
      listing_id: contract.listing_id ?? null,
      template_type: templateType || 'rental',
      title,
      content: contract.content,
      status: 'sent',
      metadata: contract.metadata ?? {},
    } as any)
    .select('*')
    .single();
  if (cloneError) throw cloneError;
  saved = cloned as Record<string, unknown>;

  await notifyContractEvent({
    recipientId: opts.recipientId,
    senderId: opts.senderId,
    contractId: saved.id as string,
    title: 'Lease Ready to Sign',
    type: 'contract_pending',
    linkPath,
    message: `"${title}" is waiting for your signature.`,
  });

  return {
    contract: saved,
    attachment: {
      type: 'digital_contract',
      id: saved.id as string,
      title,
      status: 'sent',
      template_type: templateType,
    },
    content: `Sent lease for signature: "${title}"`,
    notify: false,
  };
}