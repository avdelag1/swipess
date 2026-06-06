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

  if (templateId.includes('bicycle') || templateId.includes('moto') || templateId.includes('motorcycle')) {
    return [
      { key: 'effective_date', label: 'Agreement Date', placeholder: '2026-04-11', type: 'date' },
      { key: 'landlord_name', label: 'Owner / Company Name', placeholder: 'Enter name', type: 'text' },
      { key: 'tenant_name', label: 'Renter Full Name', placeholder: 'Enter name', type: 'text' },
      { key: 'monthly_rent', label: 'Rental Fee', placeholder: 'e.g. 50', type: 'number' },
      { key: 'security_deposit', label: 'Security Deposit', placeholder: 'e.g. 200', type: 'number' },
    ];
  }

  if (templateId.includes('service')) {
    return [
      { key: 'effective_date', label: 'Agreement Date', placeholder: '2026-04-11', type: 'date' },
      { key: 'landlord_name', label: 'Service Provider Name', placeholder: 'Enter name', type: 'text' },
      { key: 'tenant_name', label: 'Client Full Name', placeholder: 'Enter name', type: 'text' },
      { key: 'monthly_rent', label: 'Service Fee', placeholder: 'e.g. 500', type: 'number' },
    ];
  }

  return commonVariables;
};

// Replaces {{key}} placeholders with provided values.
// If a value is empty, the placeholder text is kept so the field remains visible.
export const applyVariablesToContent = (content: string, values: Record<string, string>): string => {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = values[key];
    return value && value.trim() ? value : match;
  });
};
