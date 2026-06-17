import type { ContractTemplate } from './contractTemplates';

const BLANK = '<u>_________________________________</u>';
const BLANK_SHORT = '<u>________________</u>';
const BLANK_NUM = '<u>_______</u>';

function signatureBlock(partyA: string, partyB: string): string {
  return `
<hr style="margin: 30px 0;"/>
<div style="display: flex; justify-content: space-between; margin-top: 40px; flex-wrap: wrap; gap: 24px;">
  <div style="width: 45%; min-width: 200px;">
    <p><strong>${partyA} SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 48px;"></p>
    <p>Printed Name: ${BLANK}</p>
    <p>Date: ${BLANK_SHORT}</p>
  </div>
  <div style="width: 45%; min-width: 200px;">
    <p><strong>${partyB} SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 48px;"></p>
    <p>Printed Name: ${BLANK}</p>
    <p>Date: ${BLANK_SHORT}</p>
  </div>
</div>
<p style="margin-top: 24px; font-size: 11px; opacity: 0.7;"><em>Digital signatures captured through Swipess are recorded with timestamp and device metadata for audit purposes.</em></p>`;
}

function partiesBlock(landlordLabel = 'LANDLORD', tenantLabel = 'TENANT'): string {
  return `
<p><strong>This Lease Agreement</strong> ("Agreement") is entered into as of ${BLANK_SHORT} (the "Effective Date")</p>
<p><strong>BETWEEN:</strong></p>
<p><strong>${landlordLabel} ("Landlord"):</strong><br/>
Full Legal Name: ${BLANK}<br/>
Address: ${BLANK}<br/>
Phone: ${BLANK}<br/>
Email: ${BLANK}<br/>
Tax ID / ID Number (if applicable): ${BLANK}</p>
<p><strong>${tenantLabel} ("Tenant"):</strong><br/>
Full Legal Name: ${BLANK}<br/>
Current Address: ${BLANK}<br/>
Phone: ${BLANK}<br/>
Email: ${BLANK}<br/>
Government ID / Passport: ${BLANK}</p>
<hr style="margin: 20px 0;"/>`;
}

function section(num: number, title: string, body: string): string {
  return `<h2 style="font-size: 18px; margin-top: 24px;">${num}. ${title}</h2>\n${body}`;
}

function buildLeaseDoc(
  title: string,
  subtitle: string,
  sections: Array<{ title: string; body: string }>,
  sigA = 'LANDLORD',
  sigB = 'TENANT',
): string {
  return `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">${title}</h1>
  <p style="font-style: italic;">${subtitle}</p>
</div>
${partiesBlock(sigA, sigB)}
${sections.map((s, i) => section(i + 1, s.title, s.body)).join('\n')}
${signatureBlock(sigA, sigB)}`;
}

const residential12MonthSections = [
  {
    title: 'PROPERTY DESCRIPTION',
    body: `<p>The Landlord leases to the Tenant the residential premises located at:</p>
<p style="margin-left: 20px;">${BLANK}</p>
<p>Unit / Apt #: ${BLANK_NUM} | City: ${BLANK} | State / Province: ${BLANK} | Postal Code: ${BLANK}</p>
<p>Property type: ☐ House ☐ Apartment ☐ Condo ☐ Townhouse ☐ Other: ${BLANK}</p>
<p>Included fixtures, appliances, and furnishings: ${BLANK}</p>
<p>Parking space(s): ${BLANK_NUM} | Storage unit: ☐ Yes ☐ No — Location: ${BLANK}</p>`,
  },
  {
    title: 'TERM OF LEASE',
    body: `<p>Commencement Date: ${BLANK_SHORT}</p>
<p>Expiration Date: ${BLANK_SHORT}</p>
<p>Initial lease term: ${BLANK_NUM} months (twelve (12) months unless otherwise stated).</p>
<p>Holdover: If Tenant remains after expiration without a new written agreement, tenancy continues month-to-month on the same terms, terminable by either party with thirty (30) days written notice.</p>`,
  },
  {
    title: 'RENT AND PAYMENT TERMS',
    body: `<p>Monthly Rent: ${BLANK} (Currency: ${BLANK})</p>
<p>Rent Due: On or before the ${BLANK_NUM} day of each calendar month.</p>
<p>Payment Method: ☐ Bank transfer ☐ Check ☐ Cash ☐ Online portal ☐ Other: ${BLANK}</p>
<p>Payable to: ${BLANK}</p>
<p>Late Fee: ${BLANK} if rent is not received by the ${BLANK_NUM} day of the month.</p>
<p>Returned Payment Fee: ${BLANK}</p>
<p>Prorated rent for partial first month: ${BLANK}</p>`,
  },
  {
    title: 'SECURITY DEPOSIT',
    body: `<p>Security Deposit Amount: ${BLANK}</p>
<p>Due: ☐ Upon signing ☐ Before move-in ☐ With first month's rent</p>
<p>Held in: ${BLANK} (account / escrow description if required by law)</p>
<p>Permitted deductions: unpaid rent, damages beyond normal wear and tear, cleaning, unpaid utilities assigned to Tenant, and other amounts permitted by law.</p>
<p>Return timeline: Within ${BLANK_NUM} days after Tenant vacates and surrenders keys, with itemized statement of deductions if any.</p>`,
  },
  {
    title: 'UTILITIES AND SERVICES',
    body: `<p>Included in rent (paid by Landlord):</p>
<p style="margin-left: 20px;">☐ Water ☐ Sewer ☐ Trash ☐ Electricity ☐ Gas ☐ Internet ☐ Cable ☐ HOA dues ☐ Landscaping ☐ None</p>
<p>Tenant responsible for: ${BLANK}</p>
<p>Utility transfer: Tenant shall place utilities in Tenant's name within ${BLANK_NUM} days of move-in where applicable.</p>`,
  },
  {
    title: 'USE OF PREMISES',
    body: `<p>Residential use only. No illegal activity. No business use without written consent.</p>
<p>Maximum occupants (adults + children): ${BLANK_NUM}</p>
<p>Named occupants: ${BLANK}</p>
<p>Guests staying more than ${BLANK_NUM} consecutive days require Landlord approval.</p>`,
  },
  {
    title: 'MAINTENANCE AND REPAIRS',
    body: `<p>Landlord shall maintain structural components, roof, plumbing, electrical, HVAC, and appliances provided with the unit, except damage caused by Tenant misuse.</p>
<p>Tenant shall keep premises clean, replace batteries in detectors, report maintenance issues within ${BLANK_NUM} hours, and not make alterations without consent.</p>
<p>Emergency repair contact: ${BLANK}</p>
<p>Non-emergency maintenance request method: ${BLANK}</p>`,
  },
  {
    title: 'ALTERATIONS AND IMPROVEMENTS',
    body: `<p>No painting, fixtures, holes in walls, or structural changes without prior written consent.</p>
<p>Approved alterations become Landlord property unless otherwise agreed in writing.</p>
<p>Tenant shall restore premises to original condition if required at move-out.</p>`,
  },
  {
    title: 'INSURANCE',
    body: `<p>Landlord insurance: Covers building structure only (if applicable).</p>
<p>Tenant renter's insurance: ☐ Required ☐ Recommended — minimum coverage: ${BLANK}</p>
<p>Tenant shall name Landlord as additional interested party if required by insurer.</p>`,
  },
  {
    title: 'RULES AND RESTRICTIONS',
    body: `<ul>
  <li>Pets: ☐ Not allowed ☐ Allowed — Type/breed limits: ${BLANK} — Pet deposit/fee: ${BLANK}</li>
  <li>Smoking: ☐ Prohibited everywhere ☐ Allowed outdoors only</li>
  <li>Noise / quiet hours: ${BLANK} to ${BLANK}</li>
  <li>Subletting / Airbnb: ☐ Prohibited ☐ With written consent only</li>
  <li>Grills / open flames: ${BLANK}</li>
  <li>Additional house rules (attach addendum if needed): ${BLANK}</li>
</ul>`,
  },
  {
    title: 'ENTRY AND INSPECTION',
    body: `<p>Landlord may enter with ${BLANK_NUM} hours notice for repairs, inspections, showings, or emergencies, except when law permits entry without notice.</p>
<p>Showing for sale or re-rental: ☐ Allowed during last ${BLANK_NUM} days of tenancy with reasonable notice.</p>`,
  },
  {
    title: 'DEFAULT AND REMEDIES',
    body: `<p>Tenant default includes non-payment, material lease violation, illegal activity, or abandonment.</p>
<p>Cure period (if applicable): ${BLANK_NUM} days written notice to cure, except for emergencies or non-curable breaches.</p>
<p>Landlord remedies may include termination, possession action, and collection of amounts owed as permitted by law.</p>`,
  },
  {
    title: 'EARLY TERMINATION',
    body: `<p>Early termination by Tenant: ${BLANK_NUM} days written notice and early termination fee of ${BLANK} (or forfeiture of ${BLANK_NUM} month(s) rent) unless otherwise required by law.</p>
<p>Landlord early termination: Only as permitted by law or for material breach after notice.</p>
<p>Military / job relocation / other statutory rights: As applicable under local law.</p>`,
  },
  {
    title: 'MOVE-OUT AND SECURITY DEPOSIT RETURN',
    body: `<p>Notice to vacate: ${BLANK_NUM} days before intended move-out date.</p>
<p>Keys returned to: ${BLANK} on or before ${BLANK_SHORT}.</p>
<p>Cleaning standard: Broom-clean, all personal property removed, carpets professionally cleaned if required: ${BLANK}</p>
<p>Forwarding address for deposit return: ${BLANK}</p>`,
  },
  {
    title: 'NOTICES',
    body: `<p>All notices shall be in writing and delivered by: ☐ Email (if agreed) ☐ Certified mail ☐ Hand delivery ☐ Portal message</p>
<p>Landlord notice address: ${BLANK}</p>
<p>Tenant notice address: Premises address unless Tenant provides alternate in writing.</p>`,
  },
  {
    title: 'GOVERNING LAW AND DISPUTES',
    body: `<p>Governing law: ${BLANK}</p>
<p>Venue / jurisdiction: ${BLANK}</p>
<p>Dispute resolution: ☐ Courts ☐ Mediation first ☐ Arbitration (if permitted and agreed)</p>`,
  },
  {
    title: 'ADDITIONAL TERMS AND ATTACHMENTS',
    body: `<p>The following addenda are attached and incorporated: ☐ Move-in checklist ☐ Lead paint disclosure ☐ Mold disclosure ☐ HOA rules ☐ Parking map ☐ Other: ${BLANK}</p>
<p>Additional clauses:</p>
<p>${BLANK}</p>
<p>${BLANK}</p>
<p><strong>ENTIRE AGREEMENT:</strong> This document constitutes the entire agreement. Modifications must be in writing signed by both parties.</p>`,
  },
];

const monthToMonthSections = [
  {
    title: 'PROPERTY',
    body: `<p>Premises address: ${BLANK}</p>
<p>Description: ${BLANK}</p>`,
  },
  {
    title: 'MONTH-TO-MONTH TERM',
    body: `<p>Tenancy begins ${BLANK_SHORT} and continues on a month-to-month basis until terminated by either party.</p>
<p>Termination notice required: ${BLANK_NUM} days written notice (minimum as required by local law).</p>
<p>Rent is due for any partial notice period as permitted by law.</p>`,
  },
  {
    title: 'RENT',
    body: `<p>Monthly Rent: ${BLANK} — Due on the ${BLANK_NUM} of each month.</p>
<p>Late fee: ${BLANK} after day ${BLANK_NUM}.</p>
<p>Payment instructions: ${BLANK}</p>`,
  },
  {
    title: 'SECURITY DEPOSIT',
    body: `<p>Amount: ${BLANK} — Return within ${BLANK_NUM} days after move-out with itemized deductions.</p>`,
  },
  {
    title: 'TENANT OBLIGATIONS',
    body: `<p>Pay rent on time, maintain premises, comply with house rules, no illegal use, no unauthorized subletting.</p>
<p>Utilities paid by Tenant: ${BLANK}</p>`,
  },
  {
    title: 'LANDLORD OBLIGATIONS',
    body: `<p>Maintain habitable premises, make timely repairs for items Landlord is responsible for, provide required notices.</p>`,
  },
  {
    title: 'RENT INCREASES',
    body: `<p>Landlord may increase rent with ${BLANK_NUM} days written notice, not more than once per ${BLANK_NUM} months, subject to rent control laws if applicable.</p>`,
  },
  {
    title: 'PETS, SMOKING, OCCUPANCY',
    body: `<p>Pets: ${BLANK} | Smoking: ${BLANK} | Max occupants: ${BLANK_NUM}</p>`,
  },
  {
    title: 'DEFAULT',
    body: `<p>Non-payment or material breach may result in termination after notice period required by law.</p>`,
  },
  {
    title: 'GOVERNING LAW',
    body: `<p>${BLANK}</p>`,
  },
];

const furnishedApartmentSections = [
  {
    title: 'FURNISHED PREMISES',
    body: `<p>Address: ${BLANK}</p>
<p>Furnished residential unit including inventory listed in <strong>Schedule A — Furniture &amp; Equipment Inventory</strong> attached hereto.</p>
<p>Tenant acknowledges receiving all items in good working order unless noted on move-in checklist dated ${BLANK_SHORT}.</p>`,
  },
  {
    title: 'LEASE TERM',
    body: `<p>From ${BLANK_SHORT} to ${BLANK_SHORT} (${BLANK_NUM} months).</p>
<p>Renewal: ☐ Automatic ☐ By mutual written agreement ☐ Month-to-month after initial term.</p>`,
  },
  {
    title: 'RENT AND DEPOSITS',
    body: `<p>Monthly Rent (including furniture use): ${BLANK}</p>
<p>Security Deposit: ${BLANK}</p>
<p>Furniture / equipment deposit (if separate): ${BLANK}</p>
<p>Late fee: ${BLANK}</p>`,
  },
  {
    title: 'FURNITURE CARE AND REPLACEMENT',
    body: `<p>Tenant shall use furniture reasonably and report damage within ${BLANK_NUM} hours.</p>
<p>Damage beyond normal wear: Tenant pays repair or replacement cost at ${BLANK} vendor rates or actual invoice.</p>
<p>No removal of Landlord furniture from premises.</p>
<p>Missing items at move-out charged at replacement value per Schedule A.</p>`,
  },
  {
    title: 'INVENTORY — SCHEDULE A (SUMMARY)',
    body: `<table style="width:100%; border-collapse: collapse;">
<tr><th style="border:1px solid #ccc; padding:8px;">Item</th><th style="border:1px solid #ccc; padding:8px;">Qty</th><th style="border:1px solid #ccc; padding:8px;">Condition at move-in</th></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">Sofa / seating</td><td style="border:1px solid #ccc; padding:8px;">${BLANK_NUM}</td><td style="border:1px solid #ccc; padding:8px;">${BLANK}</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">Bed / mattress</td><td style="border:1px solid #ccc; padding:8px;">${BLANK_NUM}</td><td style="border:1px solid #ccc; padding:8px;">${BLANK}</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">Dining set</td><td style="border:1px solid #ccc; padding:8px;">${BLANK_NUM}</td><td style="border:1px solid #ccc; padding:8px;">${BLANK}</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">TV / electronics</td><td style="border:1px solid #ccc; padding:8px;">${BLANK_NUM}</td><td style="border:1px solid #ccc; padding:8px;">${BLANK}</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">Kitchen appliances</td><td style="border:1px solid #ccc; padding:8px;">${BLANK}</td><td style="border:1px solid #ccc; padding:8px;">${BLANK}</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">Other: ${BLANK}</td><td style="border:1px solid #ccc; padding:8px;">${BLANK}</td><td style="border:1px solid #ccc; padding:8px;">${BLANK}</td></tr>
</table>
<p>Full inventory photos / checklist stored: ☐ In app vault ☐ Physical copy with both signatures.</p>`,
  },
  {
    title: 'UTILITIES AND INTERNET',
    body: `<p>Included: ${BLANK}</p>
<p>Tenant pays: ${BLANK}</p>
<p>WiFi network provided: ☐ Yes ☐ No — Password change prohibited without consent.</p>`,
  },
  {
    title: 'CLEANING AND LINENS',
    body: `<p>Move-in cleaning standard: ${BLANK}</p>
<p>Move-out cleaning fee if not met: ${BLANK}</p>
<p>Linens/towels provided: ☐ Yes ☐ No — Replacement cost: ${BLANK}</p>`,
  },
  {
    title: 'RULES',
    body: `<p>No smoking. Pets: ${BLANK}. No parties exceeding ${BLANK_NUM} guests. Quiet hours ${BLANK}–${BLANK}.</p>`,
  },
  {
    title: 'INSURANCE AND LIABILITY',
    body: `<p>Tenant contents insurance recommended/required: ${BLANK}</p>
<p>Landlord not liable for Tenant personal property loss unless caused by Landlord negligence.</p>`,
  },
  {
    title: 'TERMINATION AND FORFEITURES',
    body: `<p>Early termination fee: ${BLANK}. Furniture damage assessed at move-out inspection within ${BLANK_NUM} days.</p>`,
  },
  {
    title: 'GOVERNING LAW',
    body: `<p>${BLANK}</p>`,
  },
];

const commercialLeaseSections = [
  {
    title: 'DEMISED PREMISES',
    body: `<p>Commercial property located at: ${BLANK}</p>
<p>Suite / Unit: ${BLANK} | Approximate area: ${BLANK} sq ft / sq m</p>
<p>Permitted use: ${BLANK} (e.g., retail, office, restaurant, warehouse)</p>
<p>Common areas and parking: ${BLANK}</p>`,
  },
  {
    title: 'TERM AND COMMENCEMENT',
    body: `<p>Lease term: ${BLANK_NUM} months/years commencing ${BLANK_SHORT}, ending ${BLANK_SHORT}.</p>
<p>Rent commencement date (if different from start): ${BLANK_SHORT}</p>
<p>Option to renew: ☐ Yes — ${BLANK_NUM} period(s) of ${BLANK_NUM} months at market rate ☐ No</p>`,
  },
  {
    title: 'BASE RENT AND CAM CHARGES',
    body: `<p>Base Monthly Rent: ${BLANK}</p>
<p>CAM / operating expenses: ☐ Included ☐ Billed separately — Estimated: ${BLANK} per month</p>
<p>Property tax pass-through: ${BLANK}</p>
<p>Insurance pass-through: ${BLANK}</p>
<p>Rent escalation: ☐ Fixed ${BLANK}% annually ☐ CPI ☐ Renegotiated at renewal</p>`,
  },
  {
    title: 'SECURITY DEPOSIT AND GUARANTY',
    body: `<p>Security deposit: ${BLANK} (${BLANK_NUM} months rent)</p>
<p>Personal guaranty required: ☐ Yes — Guarantor: ${BLANK} ☐ No</p>`,
  },
  {
    title: 'TENANT IMPROVEMENTS AND SIGNAGE',
    body: `<p>Landlord work: ${BLANK}</p>
<p>Tenant work (TI allowance): ${BLANK}</p>
<p>Signage rights: ${BLANK}</p>
<p>All improvements subject to Landlord approval and permits.</p>`,
  },
  {
    title: 'HOURS OF OPERATION AND COMPLIANCE',
    body: `<p>Business hours: ${BLANK}</p>
<p>Tenant complies with zoning, health, fire codes, ADA/accessibility, and all permits for permitted use.</p>`,
  },
  {
    title: 'UTILITIES AND SERVICES',
    body: `<p>Tenant pays: ${BLANK}</p>
<p>Landlord provides: ${BLANK}</p>`,
  },
  {
    title: 'MAINTENANCE AND REPAIRS',
    body: `<p>Tenant maintains interior, fixtures, HVAC filters, and glass. Landlord maintains structure, roof, exterior, and common areas unless lease states otherwise (NNN / gross).</p>
<p>Lease type: ☐ Gross ☐ Modified gross ☐ Triple net (NNN)</p>`,
  },
  {
    title: 'INSURANCE REQUIREMENTS',
    body: `<p>Tenant commercial general liability: minimum ${BLANK} per occurrence</p>
<p>Property insurance on Tenant improvements and inventory</p>
<p>Landlord named additional insured: ☐ Required</p>
<p>Certificate due before occupancy and annually.</p>`,
  },
  {
    title: 'ASSIGNMENT AND SUBLEASE',
    body: `<p>No assignment or sublease without Landlord written consent, not unreasonably withheld where stated by law.</p>
<p>Landlord recapture rights: ${BLANK}</p>`,
  },
  {
    title: 'DEFAULT AND REMEDIES',
    body: `<p>Events of default: rent default, bankruptcy, abandonment, unauthorized use, failure to maintain insurance.</p>
<p>Notice and cure: ${BLANK_NUM} days (or immediate for non-monetary emergencies as allowed).</p>
<p>Landlord may pursue rent acceleration, possession, and damages as permitted by law.</p>`,
  },
  {
    title: 'SURRENDER AND HOLDING OVER',
    body: `<p>Return premises in broom-clean condition, remove trade fixtures unless agreed, repair damage.</p>
<p>Holding over rent: ${BLANK}% of monthly rent per month or pro-rata.</p>`,
  },
  {
    title: 'NOTICES AND GOVERNING LAW',
    body: `<p>Notices to Landlord: ${BLANK}</p>
<p>Notices to Tenant: Premises address</p>
<p>Governing law / venue: ${BLANK}</p>`,
  },
];

const roomRentalSections = [
  {
    title: 'ROOM AND SHARED SPACES',
    body: `<p>Property address: ${BLANK}</p>
<p>Leased private room: ${BLANK} (description / identifier)</p>
<p>Shared areas: kitchen, bathroom(s), living room, laundry: ${BLANK}</p>
<p>Other occupants on lease (if any): ${BLANK}</p>
<p>Exclusive use areas vs. shared: ${BLANK}</p>`,
  },
  {
    title: 'TERM',
    body: `<p>Start: ${BLANK_SHORT} — End: ${BLANK_SHORT} or ☐ Month-to-month after ${BLANK_SHORT}</p>
<p>Notice to terminate: ${BLANK_NUM} days</p>`,
  },
  {
    title: 'RENT AND DEPOSIT',
    body: `<p>Monthly rent for room: ${BLANK}</p>
<p>Due date: ${BLANK_NUM} of month | Payment method: ${BLANK}</p>
<p>Security deposit: ${BLANK}</p>
<p>Last month rent collected: ☐ Yes ☐ No</p>`,
  },
  {
    title: 'HOUSE RULES AND CONDUCT',
    body: `<ul>
  <li>Quiet hours: ${BLANK}</li>
  <li>Guests overnight: ${BLANK}</li>
  <li>Kitchen / fridge space allocation: ${BLANK}</li>
  <li>Cleaning rotation or duties: ${BLANK}</li>
  <li>Trash and recycling: ${BLANK}</li>
  <li>Thermostat / AC rules: ${BLANK}</li>
</ul>`,
  },
  {
    title: 'UTILITIES SPLIT',
    body: `<p>Utilities split method: ☐ Included in rent ☐ Divided equally ☐ By meter ☐ Fixed ${BLANK} per month</p>
<p>WiFi share: ${BLANK}</p>`,
  },
  {
    title: 'PETS AND SMOKING',
    body: `<p>Pets: ${BLANK} | Smoking: ${BLANK}</p>`,
  },
  {
    title: 'ACCESS AND MASTER TENANT',
    body: `<p>Primary tenant / master lease holder (if sublease): ${BLANK}</p>
<p>Landlord consent to sublease obtained: ☐ Yes ☐ N/A — Copy attached</p>
<p>Roommate has keys to: ${BLANK}</p>`,
  },
  {
    title: 'MAINTENANCE',
    body: `<p>Roommate reports issues to: ${BLANK} within ${BLANK_NUM} hours.</p>
<p>Landlord / head-tenant contact for emergencies: ${BLANK}</p>`,
  },
  {
    title: 'DEFAULT',
    body: `<p>Non-payment or repeated rule violations may result in termination with ${BLANK_NUM} days notice (or as required by master lease and local law).</p>`,
  },
  {
    title: 'MOVE-OUT',
    body: `<p>Room cleaned, personal items removed, keys returned ${BLANK_SHORT}.</p>
<p>Deposit return: ${BLANK_NUM} days to forwarding address ${BLANK}</p>`,
  },
  {
    title: 'GOVERNING LAW',
    body: `<p>${BLANK}</p>`,
  },
];

export const LEASE_TEMPLATES: ContractTemplate[] = [
  {
    id: 'lease-residential-12-month',
    name: 'Residential Lease — 12 Month',
    description: 'Full residential lease with 17 sections: rent, deposit, utilities, pets, maintenance, termination, and signatures.',
    category: 'lease',
    forRole: 'both',
    content: buildLeaseDoc(
      'RESIDENTIAL LEASE AGREEMENT',
      'Standard Twelve (12) Month Term — House or Apartment',
      residential12MonthSections,
    ),
  },
  {
    id: 'lease-month-to-month',
    name: 'Month-to-Month Residential Lease',
    description: 'Flexible monthly tenancy with notice periods, rent increases, and all core tenant/landlord duties.',
    category: 'lease',
    forRole: 'both',
    content: buildLeaseDoc(
      'MONTH-TO-MONTH RESIDENTIAL LEASE',
      'Periodic Tenancy — 30-Day Notice (adjust per local law)',
      monthToMonthSections,
    ),
  },
  {
    id: 'lease-furnished-apartment',
    name: 'Furnished Apartment Lease',
    description: 'Includes furniture inventory schedule, damage/replacement rules, linens, and move-in checklist.',
    category: 'lease',
    forRole: 'both',
    content: buildLeaseDoc(
      'FURNISHED APARTMENT LEASE AGREEMENT',
      'Includes Schedule A — Furniture & Equipment Inventory',
      furnishedApartmentSections,
    ),
  },
  {
    id: 'lease-commercial',
    name: 'Commercial Property Lease',
    description: 'Office, retail, or warehouse lease with CAM, TI allowance, insurance, guaranty, and renewal options.',
    category: 'lease',
    forRole: 'both',
    content: buildLeaseDoc(
      'COMMERCIAL LEASE AGREEMENT',
      'Business / Retail / Office Premises',
      commercialLeaseSections,
      'LANDLORD',
      'TENANT',
    ),
  },
  {
    id: 'lease-room-rental',
    name: 'Room Rental & Sublease Agreement',
    description: 'Single room in shared home — house rules, utility splits, master-tenant consent, and deposits.',
    category: 'lease',
    forRole: 'both',
    content: buildLeaseDoc(
      'ROOM RENTAL AGREEMENT',
      'Private Room in Shared Residence',
      roomRentalSections,
      'LANDLORD / HEAD TENANT',
      'ROOM TENANT',
    ),
  },
];