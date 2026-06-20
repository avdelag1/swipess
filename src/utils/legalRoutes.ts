export type LegalSection = 'help' | 'documents' | 'vault' | 'templates';
export type LegalRole = 'owner' | 'client';

export function getLegalServicesPath(role: LegalRole): string {
  return role === 'owner' ? '/owner/legal-services' : '/client/legal-services';
}

export function getLegalSectionPath(
  role: LegalRole,
  section: LegalSection,
  extra?: Record<string, string>,
): string {
  const base = getLegalServicesPath(role);
  if (section === 'help') return base;
  const params = new URLSearchParams({ section });
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  }
  return `${base}?${params.toString()}`;
}

export function getLegalContractPath(role: LegalRole, contractId?: string): string {
  return getLegalSectionPath(role, 'documents', contractId ? { contract: contractId } : undefined);
}