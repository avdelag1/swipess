// import { } from '@/data/contractTemplates';

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

// Fills template blanks (<u>___</u> underline patterns) with the supplied values.
// Each replacement is contextual — it searches for the blank near its label text
// so the correct field gets filled even when multiple blanks exist.
export const applyVariablesToContent = (content: string, values: Record<string, string>): string => {
  let r = content;
  const B = '_{3,}';               // blank: 3+ underscores inside <u>
  const fill = (v: string) => `<u>${v}</u>`;

  const sub = (pattern: string, replacement: string, flags = 'i') => {
    r = r.replace(new RegExp(pattern, flags), replacement);
  };

  if (values.effective_date) {
    sub(`((?:as of|on|date[d]?)[:\\s]*)(<u>${B}<\\/u>)`, `$1${fill(values.effective_date)}`);
    // Fallback: "Agreement Date: ___"
    sub(`(Agreement\\s+Date[^<]*:\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.effective_date)}`);
  }

  // Owner / landlord / seller — first "Name: ___" occurrence
  if (values.landlord_name) {
    sub(`((?:LANDLORD|SELLER|OWNER|RENTAL COMPANY\\/OWNER)[^<]*<br\\s*\\/?>[\\s\\S]*?Name:\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.landlord_name)}`);
  }

  // Tenant / buyer / renter — second name block (search after "TENANT" / "BUYER" heading)
  if (values.tenant_name) {
    sub(`((?:TENANT|BUYER|RENTER|GUEST|CLIENT)[^<]*<br\\s*\\/?>[\\s\\S]*?Name:\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.tenant_name)}`);
  }

  if (values.monthly_rent) {
    sub(`(Monthly\\s+Rent:\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.monthly_rent)}`);
  }

  if (values.security_deposit) {
    sub(`(Security\\s+Deposit\\s*(?:Amount)?:\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.security_deposit)}`);
  }

  if (values.lease_term) {
    sub(`(minimum\\s+period\\s+of\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.lease_term)}`);
  }

  if (values.property_address) {
    // "located at:" … next paragraph blank
    sub(`((?:located\\s+at|Property\\s+Address)[^<]*:.*?<\\/p>[\\s\\S]*?<p[^>]*>)(<u>${B}<\\/u>)`, `$1${fill(values.property_address)}`, 'is');
    // Fallback: "Address: ___" (first occurrence)
    sub(`(Address:\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.property_address)}`);
  }

  if (values.purchase_price) {
    sub(`(Total\\s+Purchase\\s+Price:\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.purchase_price)}`);
    sub(`(total\\s+sum\\s+of\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.purchase_price)}`);
  }

  if (values.closing_date) {
    sub(`(on\\s+or\\s+before\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.closing_date)}`);
  }

  if (values.earnest_money) {
    sub(`(Earnest\\s+Money\\s+Deposit:\\s*)(<u>${B}<\\/u>)`, `$1${fill(values.earnest_money)}`);
  }

  return r;
};


