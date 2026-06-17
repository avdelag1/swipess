import { computeContractStatus, type ContractSignStatus } from '@/utils/contractSigning';

export type VaultDocumentKind = 'digital_contract' | 'vault_file';

export interface DocumentAttachment {
  type: VaultDocumentKind;
  id: string;
  title: string;
  status: ContractSignStatus | 'uploaded';
  template_type?: string;
  file_name?: string;
}

export interface VaultContractRow {
  id: string;
  owner_id: string;
  client_id: string;
  title: string;
  content?: string | null;
  status?: string | null;
  template_type?: string | null;
  owner_signature?: string | null;
  client_signature?: string | null;
  metadata?: Record<string, unknown> | null;
  updated_at?: string;
  created_at?: string;
}

export interface VaultFileRow {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  status: string;
  created_at: string;
}

export const DOCUMENT_MESSAGE_TYPES = new Set(['document', 'contract', 'lease']);

export function isDocumentMessage(messageType?: string | null): boolean {
  return !!messageType && DOCUMENT_MESSAGE_TYPES.has(messageType);
}

export function parseDocumentAttachments(raw: unknown): DocumentAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is DocumentAttachment => {
      if (!item || typeof item !== 'object') return false;
      const row = item as DocumentAttachment;
      return (
        (row.type === 'digital_contract' || row.type === 'vault_file') &&
        typeof row.id === 'string' &&
        typeof row.title === 'string'
      );
    })
    .map((item) => ({
      type: item.type,
      id: item.id,
      title: item.title,
      status: item.status || 'draft',
      template_type: item.template_type,
      file_name: item.file_name,
    }));
}

export function contractDisplayStatus(contract: VaultContractRow): ContractSignStatus {
  if (contract.status === 'signed') return 'signed';
  return computeContractStatus({
    owner_id: contract.owner_id,
    client_id: contract.client_id,
    owner_signature: contract.owner_signature,
    client_signature: contract.client_signature,
  });
}

export function isVaultDraft(contract: VaultContractRow): boolean {
  return contract.owner_id === contract.client_id;
}

export function isContractWithParty(contract: VaultContractRow, partyId: string): boolean {
  return contract.client_id === partyId || contract.owner_id === partyId;
}

export function buildDocumentShareContent(title: string, status: string): string {
  if (status === 'signed') return `Fully signed: "${title}"`;
  if (status === 'sent') return `Lease sent for signature: "${title}"`;
  return `Shared document: "${title}"`;
}

export function contractStatusLabel(status: ContractSignStatus | 'uploaded'): string {
  switch (status) {
    case 'signed':
      return 'Fully signed';
    case 'sent':
      return 'Awaiting signature';
    case 'draft':
      return 'Draft / template';
    case 'uploaded':
      return 'Vault file';
    default:
      return 'Document';
  }
}

export function contractStatusTone(status: ContractSignStatus | 'uploaded'): string {
  switch (status) {
    case 'signed':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
    case 'sent':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
    case 'draft':
      return 'text-sky-400 bg-sky-500/10 border-sky-500/25';
    default:
      return 'text-white/60 bg-white/5 border-white/10';
  }
}