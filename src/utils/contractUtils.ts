import { ContractTemplate } from '@/data/contractTemplates';

export interface ContractVariable {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'date';
}

export const getVariablesForTemplate = (templateId: string): ContractVariable[] => {
  const commonVariables: ContractVariable[] = [
    { key: 'effective_date', label: 'Effective Date', placeholder: '2026-04-11', type: 'date' },
    { key: 'landlord_name', label: 'Landlord / Seller Full Name', placeholder: 'Enter name', type: 'text' },
    { key: 'tenant_name', label: 'Tenant / Buyer Full Name', placeholder: 'Enter name', type: 'text' },
  ];

  if (templateId.includes('rental') || templateId.includes('lease')) {
    return [
      ...commonVariables,
      { key: 'monthly_rent', label: 'Monthly Rent', placeholder: 'e.g. 1500', type: 'number' },
      { key: 'security_deposit', label: 'Security Deposit', placeholder: 'e.g. 1500', type: 'number' },
      { key: 'lease_term', label: 'Lease Term (Months)', placeholder: 'e.g. 12', type: 'number' },
      { key: 'property_address', label: 'Property Address', placeholder: 'Full address', type: 'text' },
    ];
  }

  if (templateId.includes('sale') || templateId.includes('purchase')) {
    return [
      ...commonVariables,
      { key: 'purchase_price', label: 'Total Purchase Price', placeholder: 'e.g. 250000', type: 'number' },
      { key: 'earnest_money', label: 'Earnest Money Deposit', placeholder: 'e.g. 5000', type: 'number' },
      { key: 'closing_date', label: 'Target Closing Date', placeholder: '2026-05-11', type: 'date' },
      { key: 'property_address', label: 'Property Address', placeholder: 'Full address', type: 'text' },
    ];
  }

  return commonVariables;
};

export const applyVariablesToContent = (content: string, values: Record<string, string>): string => {
  let processed = content;
  // This is a naive replacement for now, real implementation would identify the <u> tags
  // but for the AI demo we'll just inject them into the HTML structure.
  Object.entries(values).forEach(([key, value]) => {
    // Replace placeholders like {{key}} if they existed, or just append meta for now
  });
  return processed;
};


