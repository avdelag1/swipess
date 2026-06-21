// Contract templates for owners and clients
import { LEASE_TEMPLATES } from './leaseTemplates';

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lease' | 'rental' | 'purchase' | 'rental_agreement' | 'service' | 'bicycle' | 'moto' | 'promise';
  forRole: 'owner' | 'client' | 'both';
  content: string;
}

// Re-export flagship lease templates for direct imports
export { LEASE_TEMPLATES } from './leaseTemplates';

// Owner Templates — lease builders listed first
export const ownerTemplates: ContractTemplate[] = [
  ...LEASE_TEMPLATES,
  {
    id: 'long-term-rental-3months',
    name: 'Long-Term Rental Agreement (3+ Months)',
    description: 'Standard rental agreement for properties with minimum 3-month lease term',
    category: 'lease',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">LONG-TERM RENTAL AGREEMENT</h1>
  <p style="font-style: italic;">Minimum 3 Month Term</p>
</div>

<p><strong>This Rental Agreement</strong> ("Agreement") is entered into as of <u style="color:#EB4898;font-style:italic;">{{effective_date}}</u> (the "Effective Date")</p>

<p><strong>BETWEEN:</strong></p>

<p><strong>LANDLORD:</strong><br/>
Name: <u style="color:#EB4898;font-style:italic;">{{landlord_name}}</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>TENANT:</strong><br/>
Name: <u style="color:#EB4898;font-style:italic;">{{tenant_name}}</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY DESCRIPTION</h2>
<p>The Landlord agrees to rent to the Tenant the property located at:</p>
<p style="margin-left: 20px;"><u style="color:#EB4898;font-style:italic;">{{property_address}}</u></p>
<p>Including the following furnishings and appliances: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. TERM OF LEASE</h2>
<p>The lease term shall commence on <u style="color:#EB4898;font-style:italic;">{{effective_date}}</u> and shall continue for a minimum period of <u style="color:#EB4898;font-style:italic;">{{lease_term}}</u> months, ending on <u>________________</u>.</p>
<p>After the initial term, this Agreement shall continue on a month-to-month basis unless either party provides 30 days written notice of termination.</p>

<h2 style="font-size: 18px;">3. RENT PAYMENT</h2>
<p>Monthly Rent: <u style="color:#EB4898;font-style:italic;">{{monthly_rent}}</u> (Currency: <u>________</u>)</p>
<p>Due Date: The <u>_____</u> day of each month</p>
<p>Payment Method: <u>_________________________________</u></p>
<p>Late Fee: A late fee of <u>________</u> shall be assessed for payments received after the <u>_____</u> day of the month.</p>

<h2 style="font-size: 18px;">4. SECURITY DEPOSIT</h2>
<p>Security Deposit Amount: <u style="color:#EB4898;font-style:italic;">{{security_deposit}}</u></p>
<p>The security deposit shall be held by the Landlord and returned within 30 days of lease termination, minus any deductions for damages beyond normal wear and tear.</p>

<h2 style="font-size: 18px;">5. UTILITIES AND SERVICES</h2>
<p>The following utilities are INCLUDED in the rent:</p>
<p style="margin-left: 20px;">☐ Electricity ☐ Water ☐ Gas ☐ Internet ☐ Cable TV ☐ Trash Collection</p>
<p>The Tenant shall be responsible for: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">6. PROPERTY RULES AND RESTRICTIONS</h2>
<ul>
  <li>Pets: ☐ Allowed ☐ Not Allowed (If allowed, pet deposit: <u>________</u>)</li>
  <li>Smoking: ☐ Allowed ☐ Not Allowed</li>
  <li>Subletting: ☐ Allowed with written consent ☐ Not Allowed</li>
  <li>Maximum Occupants: <u>_____</u> persons</li>
</ul>

<h2 style="font-size: 18px;">7. MAINTENANCE AND REPAIRS</h2>
<p>The Landlord shall be responsible for major repairs and maintaining the property in habitable condition. The Tenant shall be responsible for minor maintenance and shall promptly notify the Landlord of any needed repairs.</p>

<h2 style="font-size: 18px;">8. TERMINATION</h2>
<p>Early termination by Tenant requires <u>_____</u> days written notice and forfeiture of <u>_____</u> month(s) rent.</p>
<p>The Landlord may terminate this Agreement for non-payment of rent or violation of terms with <u>_____</u> days notice.</p>

<h2 style="font-size: 18px;">9. GOVERNING LAW</h2>
<p>This Agreement shall be governed by the laws of <u>_________________________________</u>.</p>

<h2 style="font-size: 18px;">10. ADDITIONAL TERMS</h2>
<p><u>_________________________________________________________________</u></p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>LANDLORD SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>TENANT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'property-sale-contract',
    name: 'Property Sale Contract',
    description: 'Contract for the sale and purchase of real estate property',
    category: 'purchase',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">PROPERTY SALE CONTRACT</h1>
  <p style="font-style: italic;">Real Estate Purchase Agreement</p>
</div>

<p><strong>This Property Sale Contract</strong> ("Agreement") is made on <u style="color:#EB4898;font-style:italic;">{{effective_date}}</u></p>

<p><strong>BETWEEN:</strong></p>

<p><strong>SELLER:</strong><br/>
Name: <u style="color:#EB4898;font-style:italic;">{{landlord_name}}</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>BUYER:</strong><br/>
Name: <u style="color:#EB4898;font-style:italic;">{{tenant_name}}</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY DESCRIPTION</h2>
<p>The Seller agrees to sell and the Buyer agrees to purchase the following property:</p>
<p>Address: <u style="color:#EB4898;font-style:italic;">{{property_address}}</u></p>
<p>Property Type: ☐ House ☐ Apartment ☐ Land ☐ Commercial ☐ Other: <u>________</u></p>
<p>Size: <u>________</u> square meters/feet</p>
<p>Property Registry Number: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. PURCHASE PRICE AND PAYMENT</h2>
<p>Total Purchase Price: <u style="color:#EB4898;font-style:italic;">{{purchase_price}}</u> (Currency: <u>________</u>)</p>
<p>Payment Schedule:</p>
<ul>
  <li>Earnest Money Deposit: <u style="color:#EB4898;font-style:italic;">{{earnest_money}}</u> due on <u>________________</u></li>
  <li>Second Payment: <u>________________</u> due on <u>________________</u></li>
  <li>Final Payment: <u>________________</u> due at closing on <u style="color:#EB4898;font-style:italic;">{{closing_date}}</u></li>
</ul>
<p>Payment Method: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">3. CLOSING DATE</h2>
<p>The closing of this transaction shall take place on or before <u>________________</u> at <u>_________________________________</u>.</p>

<h2 style="font-size: 18px;">4. PROPERTY CONDITION</h2>
<p>The property is sold: ☐ As-Is ☐ With the following warranties: <u>_________________________________</u></p>
<p>The Buyer has the right to conduct an inspection within <u>_____</u> days of this Agreement.</p>

<h2 style="font-size: 18px;">5. TITLE AND DEED</h2>
<p>The Seller warrants that they have clear and marketable title to the property and will provide all necessary documents for transfer.</p>

<h2 style="font-size: 18px;">6. CLOSING COSTS</h2>
<p>Seller responsible for: <u>_________________________________</u></p>
<p>Buyer responsible for: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">7. CONTINGENCIES</h2>
<p>This Agreement is contingent upon:</p>
<ul>
  <li>☐ Buyer obtaining financing by <u>________________</u></li>
  <li>☐ Satisfactory property inspection</li>
  <li>☐ Clear title search</li>
  <li>☐ Other: <u>_________________________________</u></li>
</ul>

<h2 style="font-size: 18px;">8. DEFAULT</h2>
<p>If Buyer defaults, Seller may retain earnest money as liquidated damages.</p>
<p>If Seller defaults, Buyer shall be entitled to return of all deposits plus <u>_________________________________</u>.</p>

<h2 style="font-size: 18px;">9. GOVERNING LAW</h2>
<p>This Agreement shall be governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>SELLER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>BUYER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>

<p style="margin-top: 30px;"><strong>WITNESS 1:</strong> <u>_________________________________</u> Date: <u>___________</u></p>
<p><strong>WITNESS 2:</strong> <u>_________________________________</u> Date: <u>___________</u></p>
`
  },
  {
    id: 'bicycle-rental-agreement',
    name: 'Bicycle Rental Agreement',
    description: 'Rental agreement for bicycles with safety and liability terms',
    category: 'bicycle',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">BICYCLE RENTAL AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u style="color:#EB4898;font-style:italic;">{{effective_date}}</u></p>

<p><strong>RENTAL COMPANY/OWNER:</strong><br/>
Name: <u style="color:#EB4898;font-style:italic;">{{landlord_name}}</u><br/>
Business Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>RENTER:</strong><br/>
Name: <u style="color:#EB4898;font-style:italic;">{{tenant_name}}</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Emergency Contact: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. BICYCLE DETAILS</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Brand/Model:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Color:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Serial Number:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Condition at Rental:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Excellent ☐ Good ☐ Fair</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Accessories Included:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Helmet ☐ Lock ☐ Lights ☐ Basket ☐ Other: <u>________</u></td>
  </tr>
</table>

<h2 style="font-size: 18px;">2. RENTAL PERIOD AND RATES</h2>
<p>Start Date/Time: <u>________________</u> at <u>________</u></p>
<p>End Date/Time: <u>________________</u> at <u>________</u></p>
<p>Rental Rate: <u style="color:#EB4898;font-style:italic;">{{monthly_rent}}</u> per ☐ Hour ☐ Day ☐ Week ☐ Month</p>
<p>Total Rental Fee: <u>________________</u></p>
<p>Security Deposit: <u style="color:#EB4898;font-style:italic;">{{security_deposit}}</u></p>
<p>Late Return Fee: <u>________________</u> per hour/day</p>

<h2 style="font-size: 18px;">3. TERMS AND CONDITIONS</h2>
<ul>
  <li>The Renter must be at least 18 years old (or accompanied by a guardian).</li>
  <li>The bicycle must be returned in the same condition as rented.</li>
  <li>The Renter is responsible for any damage, theft, or loss during the rental period.</li>
  <li>The bicycle may not be used for commercial purposes or competitions.</li>
  <li>The Renter must obey all traffic laws and regulations.</li>
</ul>

<h2 style="font-size: 18px;">4. SAFETY ACKNOWLEDGMENT</h2>
<p>By signing below, I acknowledge that:</p>
<ul>
  <li>I have inspected the bicycle and confirm it is in good working condition.</li>
  <li>I understand cycling carries inherent risks.</li>
  <li>I agree to wear a helmet at all times while riding (if provided).</li>
  <li>I am physically capable of operating a bicycle safely.</li>
</ul>

<h2 style="font-size: 18px;">5. LIABILITY WAIVER</h2>
<p>I release the Owner/Rental Company from any liability for injuries, accidents, or damages that may occur during the rental period, except in cases of gross negligence by the Owner.</p>

<h2 style="font-size: 18px;">6. DAMAGE AND LOSS</h2>
<p>In case of damage or loss, the Renter agrees to pay:</p>
<ul>
  <li>Minor repairs: Actual cost</li>
  <li>Major damage: Up to <u>________________</u></li>
  <li>Total loss/theft: Replacement value of <u>________________</u></li>
</ul>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>OWNER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>RENTER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'motorcycle-rental-agreement',
    name: 'Motorcycle Rental Agreement',
    description: 'Comprehensive rental agreement for motorcycles and scooters',
    category: 'moto',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">MOTORCYCLE RENTAL AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u style="color:#EB4898;font-style:italic;">{{effective_date}}</u></p>

<p><strong>RENTAL COMPANY/OWNER:</strong><br/>
Name: <u style="color:#EB4898;font-style:italic;">{{landlord_name}}</u><br/>
Business Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>RENTER:</strong><br/>
Name: <u style="color:#EB4898;font-style:italic;">{{tenant_name}}</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Driver's License #: <u>_________________________________</u><br/>
License Expiry: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Emergency Contact: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. MOTORCYCLE DETAILS</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Brand/Model:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Year:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Color:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>License Plate:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>VIN:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Engine CC:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Odometer Reading:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u> km/miles</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Fuel Level:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Full ☐ 3/4 ☐ 1/2 ☐ 1/4</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Condition:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Excellent ☐ Good ☐ Fair</td>
  </tr>
</table>

<h2 style="font-size: 18px;">2. RENTAL PERIOD AND RATES</h2>
<p>Start Date/Time: <u>________________</u> at <u>________</u></p>
<p>End Date/Time: <u>________________</u> at <u>________</u></p>
<p>Daily Rate: <u>________________</u></p>
<p>Mileage Limit: <u>________</u> km/miles per day (Excess: <u>________</u> per km/mile)</p>
<p>Total Rental Fee: <u>________________</u></p>
<p>Security Deposit: <u>________________</u></p>
<p>Insurance: ☐ Included ☐ Optional (<u>________</u> per day)</p>

<h2 style="font-size: 18px;">3. INSURANCE COVERAGE</h2>
<p>☐ Basic Coverage: Third-party liability only</p>
<p>☐ Full Coverage: Comprehensive with deductible of <u>________________</u></p>
<p>Coverage does NOT include: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">4. RENTER REQUIREMENTS</h2>
<ul>
  <li>Minimum age: <u>_____</u> years</li>
  <li>Valid motorcycle license required (appropriate class for vehicle CC)</li>
  <li>Minimum <u>_____</u> years riding experience</li>
  <li>Must wear helmet at all times</li>
</ul>

<h2 style="font-size: 18px;">5. RESTRICTIONS</h2>
<ul>
  <li>No racing or stunts</li>
  <li>No off-road use</li>
  <li>No riding under the influence of alcohol or drugs</li>
  <li>No passengers unless covered by insurance</li>
  <li>Restricted areas: <u>_________________________________</u></li>
</ul>

<h2 style="font-size: 18px;">6. LIABILITY AND WAIVER</h2>
<p>The Renter assumes full responsibility for any accidents, damages, fines, or injuries during the rental period. The Renter agrees to indemnify and hold harmless the Owner from any claims arising from the Renter's use of the motorcycle.</p>

<h2 style="font-size: 18px;">7. IN CASE OF ACCIDENT</h2>
<ol>
  <li>Do not admit fault</li>
  <li>Contact police immediately</li>
  <li>Contact Owner at: <u>_________________________________</u></li>
  <li>Take photos of all damage and collect witness information</li>
</ol>

<hr style="margin: 30px 0;"/>

<p><strong>I confirm I have a valid motorcycle license and have inspected the vehicle.</strong></p>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>OWNER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>RENTER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'service-contract-longterm',
    name: 'Long-Term Service Contract (1+ Month)',
    description: 'Contract for hiring service providers for extended periods',
    category: 'service',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">LONG-TERM SERVICE CONTRACT</h1>
  <p style="font-style: italic;">For Ongoing Services (Minimum 1 Month)</p>
</div>

<p><strong>Contract Date:</strong> <u>________________</u></p>

<p><strong>CLIENT (Hiring Party):</strong><br/>
Name/Business: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>SERVICE PROVIDER:</strong><br/>
Name/Business: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u><br/>
Professional ID/License #: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. SERVICES TO BE PROVIDED</h2>
<p>The Service Provider agrees to perform the following services:</p>
<p style="margin-left: 20px; padding: 10px; border: 1px solid #ccc;">
<u>_________________________________________________________________</u><br/>
<u>_________________________________________________________________</u><br/>
<u>_________________________________________________________________</u>
</p>

<p>Service Type: ☐ Cleaning ☐ Maintenance ☐ Gardening ☐ Security ☐ Childcare ☐ Cooking ☐ Other: <u>________</u></p>

<h2 style="font-size: 18px;">2. CONTRACT DURATION</h2>
<p>Start Date: <u>________________</u></p>
<p>Initial Term: <u>_____</u> months</p>
<p>Renewal: ☐ Auto-renew monthly ☐ Requires written agreement ☐ Fixed term only</p>
<p>Termination Notice Required: <u>_____</u> days</p>

<h2 style="font-size: 18px;">3. WORK SCHEDULE</h2>
<p>Days of Service: ☐ Mon ☐ Tue ☐ Wed ☐ Thu ☐ Fri ☐ Sat ☐ Sun</p>
<p>Hours: From <u>________</u> to <u>________</u></p>
<p>Total Hours per Week/Month: <u>_____</u></p>
<p>Location of Service: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">4. COMPENSATION</h2>
<p>Payment Amount: <u>________________</u> per ☐ Hour ☐ Day ☐ Week ☐ Month</p>
<p>Payment Schedule: ☐ Weekly ☐ Bi-weekly ☐ Monthly</p>
<p>Payment Method: <u>_________________________________</u></p>
<p>Payment Due: On the <u>_____</u> of each period</p>

<p><strong>Additional Compensation:</strong></p>
<ul>
  <li>Overtime Rate: <u>________</u> per hour (over <u>_____</u> hours)</li>
  <li>Holiday Pay: <u>_________________________________</u></li>
  <li>Transportation Allowance: <u>________________</u></li>
  <li>Materials/Supplies: ☐ Provided by Client ☐ Provided by Service Provider</li>
</ul>

<h2 style="font-size: 18px;">5. RESPONSIBILITIES</h2>
<p><strong>Service Provider shall:</strong></p>
<ul>
  <li>Perform all services with professionalism and care</li>
  <li>Arrive punctually as scheduled</li>
  <li>Notify Client of absences at least <u>_____</u> hours in advance</li>
  <li>Maintain confidentiality of Client's personal information</li>
</ul>

<p><strong>Client shall:</strong></p>
<ul>
  <li>Provide safe working conditions</li>
  <li>Make timely payments as agreed</li>
  <li>Provide necessary access, equipment, and supplies</li>
</ul>

<h2 style="font-size: 18px;">6. INDEPENDENT CONTRACTOR STATUS</h2>
<p>The Service Provider is engaged as an independent contractor and is responsible for their own taxes and insurance unless otherwise specified.</p>

<h2 style="font-size: 18px;">7. TERMINATION</h2>
<p>Either party may terminate with <u>_____</u> days written notice.</p>
<p>Immediate termination is permitted for: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">8. DISPUTE RESOLUTION</h2>
<p>Any disputes shall be resolved through: ☐ Mediation ☐ Arbitration ☐ Legal proceedings</p>
<p>Governing Law: <u>_________________________________</u></p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>CLIENT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>SERVICE PROVIDER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'short-term-rental',
    name: 'Short-Term Rental Agreement',
    description: 'Agreement for vacation rentals and short stays',
    category: 'rental_agreement',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">SHORT-TERM RENTAL AGREEMENT</h1>
  <p style="font-style: italic;">Vacation / Temporary Stay</p>
</div>

<p><strong>Agreement Date:</strong> <u style="color:#EB4898;font-style:italic;">{{effective_date}}</u></p>

<p><strong>PROPERTY OWNER/MANAGER:</strong><br/>
Name: <u style="color:#EB4898;font-style:italic;">{{landlord_name}}</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>GUEST:</strong><br/>
Name: <u style="color:#EB4898;font-style:italic;">{{tenant_name}}</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY</h2>
<p>Address: <u style="color:#EB4898;font-style:italic;">{{property_address}}</u></p>
<p>Property Type: ☐ House ☐ Apartment ☐ Room ☐ Villa ☐ Other: <u>________</u></p>
<p>Bedrooms: <u>_____</u> | Bathrooms: <u>_____</u> | Max Guests: <u>_____</u></p>

<h2 style="font-size: 18px;">2. STAY PERIOD</h2>
<p>Check-in: <u>________________</u> at <u>________</u></p>
<p>Check-out: <u>________________</u> at <u>________</u></p>
<p>Total Nights: <u>_____</u></p>

<h2 style="font-size: 18px;">3. PRICING</h2>
<p>Nightly Rate: <u>________________</u></p>
<p>Cleaning Fee: <u>________________</u></p>
<p>Service Fee: <u>________________</u></p>
<p>Taxes: <u>________________</u></p>
<p><strong>Total Amount: <u>________________</u></strong></p>
<p>Security Deposit: <u>________________</u> (refundable)</p>

<h2 style="font-size: 18px;">4. HOUSE RULES</h2>
<ul>
  <li>☐ No smoking</li>
  <li>☐ No parties or events</li>
  <li>☐ No pets</li>
  <li>☐ Quiet hours: <u>________</u> to <u>________</u></li>
  <li>Additional rules: <u>_________________________________</u></li>
</ul>

<h2 style="font-size: 18px;">5. CANCELLATION POLICY</h2>
<p>☐ Flexible: Full refund up to 24 hours before check-in</p>
<p>☐ Moderate: Full refund up to 5 days before check-in</p>
<p>☐ Strict: 50% refund up to 7 days before check-in</p>
<p>☐ Custom: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">6. AMENITIES INCLUDED</h2>
<p>☐ WiFi ☐ Air Conditioning ☐ Heating ☐ Kitchen ☐ Washer ☐ Dryer ☐ Parking ☐ Pool ☐ TV</p>
<p>Other: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">7. GUEST RESPONSIBILITIES</h2>
<ul>
  <li>Treat property with respect</li>
  <li>Report any damages immediately</li>
  <li>Leave property in reasonable condition</li>
  <li>Follow all house rules</li>
</ul>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>OWNER/MANAGER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>GUEST SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'motorcycle-bill-of-sale',
    name: 'Motorcycle Bill of Sale',
    description: 'Agreement for buying/selling a motorcycle',
    category: 'moto',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">MOTORCYCLE BILL OF SALE</h1>
</div>

<p><strong>Date:</strong> <u>[DATE]</u></p>

<p>I, <strong><u>[SELLER NAME]</u></strong> ("Seller"), do hereby sell, transfer, and convey to <strong><u>[BUYER NAME]</u></strong> ("Buyer") the following motorcycle:</p>

<ul>
  <li><strong>Make:</strong> <u>[MAKE]</u></li>
  <li><strong>Model:</strong> <u>[MODEL]</u></li>
  <li><strong>Year:</strong> <u>[YEAR]</u></li>
  <li><strong>VIN:</strong> <u>[VIN NUMBER]</u></li>
  <li><strong>Odometer Reading:</strong> <u>[MILEAGE]</u></li>
</ul>

<p>For the total sum of <strong><u>[SALE PRICE]</u></strong>, paid by <u>[PAYMENT METHOD]</u>.</p>
<p>The Seller certifies that they are the lawful owner of this vehicle, free and clear of all liens and encumbrances. The vehicle is sold "AS IS", without any warranties.</p>

<br>
<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>SELLER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>[SELLER NAME]</u></p>
    <p>Date: <u>[DATE]</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>BUYER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>[BUYER NAME]</u></p>
    <p>Date: <u>[DATE]</u></p>
  </div>
</div>
`
  },
  {
    id: 'divorce-settlement',
    name: 'Uncontested Divorce Settlement',
    description: 'Basic settlement agreement for uncontested divorce',
    category: 'service',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">MARITAL SETTLEMENT AGREEMENT</h1>
</div>

<p><strong>Date:</strong> <u>[DATE]</u></p>
<p>This agreement is made between <strong><u>[SPOUSE A NAME]</u></strong> and <strong><u>[SPOUSE B NAME]</u></strong>.</p>
<p>The parties were married on <strong><u>[DATE OF MARRIAGE]</u></strong> and separated on <strong><u>[DATE OF SEPARATION]</u></strong>. Irreconcilable differences have led to the breakdown of the marriage, and the parties wish to settle all matters amicably.</p>

<h2 style="font-size: 18px;">1. SPOUSAL SUPPORT (ALIMONY)</h2>
<p><u>[INSERT SUPPORT TERMS, e.g., Neither party shall receive spousal support / Spouse A shall pay Spouse B $X per month]</u>.</p>

<h2 style="font-size: 18px;">2. PROPERTY DIVISION</h2>
<p>The parties agree to divide their property as follows:</p>
<ul>
  <li><strong>To Spouse A:</strong> <u>[LIST ASSETS]</u></li>
  <li><strong>To Spouse B:</strong> <u>[LIST ASSETS]</u></li>
</ul>

<h2 style="font-size: 18px;">3. DEBTS</h2>
<p>Each party shall be responsible for debts acquired in their individual names since the date of separation.</p>

<br>
<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>SPOUSE A SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>[SPOUSE A NAME]</u></p>
    <p>Date: <u>[DATE]</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>SPOUSE B SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>[SPOUSE B NAME]</u></p>
    <p>Date: <u>[DATE]</u></p>
  </div>
</div>
`
  },
  {
    id: 'promissory-note',
    name: 'Promissory Note (Pagaré)',
    description: 'Legal promise to pay a specific amount',
    category: 'promise',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">PROMISSORY NOTE (PAGARÉ)</h1>
</div>

<p><strong>Date:</strong> <u>[DATE]</u><br><strong>Location:</strong> <u>[CITY, STATE]</u></p>

<p>For value received, I, <strong><u>[BORROWER NAME]</u></strong> ("Borrower"), promise to pay to the order of <strong><u>[LENDER NAME]</u></strong> ("Lender"), the principal sum of <strong><u>[PRINCIPAL AMOUNT]</u></strong>, along with an annual interest rate of <strong><u>[INTEREST RATE]%</u></strong>.</p>

<h2 style="font-size: 18px;">1. PAYMENT TERMS</h2>
<p>This note shall be paid in full on or before <strong><u>[DUE DATE]</u></strong>. Payment shall be made via <u>[PAYMENT METHOD]</u>.</p>

<h2 style="font-size: 18px;">2. LATE FEES</h2>
<p>If payment is not made within <u>[NUMBER]</u> days of the due date, a late fee of <strong><u>[LATE FEE AMOUNT]</u></strong> will be added to the balance.</p>

<p>By signing below, the Borrower accepts the terms of this note.</p>

<br>
<div style="margin-top: 40px;">
  <p><strong>BORROWER SIGNATURE</strong></p>
  <p style="border-bottom: 1px solid #000; height: 40px; width: 45%;"></p>
  <p>Name: <u>[BORROWER NAME]</u></p>
  <p>Date: <u>[DATE]</u></p>
</div>
`
  },
  // ── lease (4 new) ──────────────────────────────────────────────────────────
  {
    id: 'commercial-lease',
    name: 'Commercial Property Lease Agreement',
    description: 'Lease agreement for business premises such as offices, shops, or warehouses',
    category: 'lease',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">COMMERCIAL PROPERTY LEASE AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>LANDLORD:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Registration No.: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>TENANT:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Registration No.: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PREMISES</h2>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Type: ☐ Office ☐ Retail Shop ☐ Warehouse ☐ Restaurant ☐ Other: <u>________</u></p>
<p>Floor Area: <u>________</u> sq m/ft &nbsp; Floor/Level: <u>________</u></p>
<p>Permitted Use: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. LEASE TERM</h2>
<p>Commencement Date: <u>________________</u> &nbsp; Expiry Date: <u>________________</u></p>
<p>Option to Renew: ☐ Yes, for <u>_____</u> year(s) ☐ No</p>
<p>Renewal Notice Required: <u>_____</u> days prior to expiry</p>

<h2 style="font-size: 18px;">3. RENT</h2>
<p>Monthly Base Rent: <u>________________</u> &nbsp; Currency: <u>________</u></p>
<p>Annual Increase: <u>_____</u>% or CPI, whichever is higher</p>
<p>Due Date: <u>_____</u> day of each month &nbsp; Late Fee: <u>________________</u></p>
<p>Security Deposit: <u>________________</u> (equivalent to <u>_____</u> months' rent)</p>

<h2 style="font-size: 18px;">4. OPERATING COSTS</h2>
<p>The Tenant shall pay its proportionate share of: ☐ Building insurance ☐ Property taxes ☐ Common area maintenance</p>
<p>Estimated monthly operating costs: <u>________________</u></p>
<p>Utilities: ☐ Included in rent ☐ Metered separately — Tenant's responsibility</p>

<h2 style="font-size: 18px;">5. FIT-OUT AND ALTERATIONS</h2>
<p>Tenant ☐ may ☐ may not carry out fit-out works without prior written consent.</p>
<p>Landlord fit-out contribution: <u>________________</u></p>
<p>All alterations must be restored to original condition at end of lease unless agreed otherwise.</p>

<h2 style="font-size: 18px;">6. SIGNAGE</h2>
<p>Tenant ☐ may ☐ may not install external signage subject to: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">7. ASSIGNMENT AND SUBLETTING</h2>
<p>Tenant ☐ may ☐ may not assign or sublet without Landlord's written consent, not to be unreasonably withheld.</p>

<h2 style="font-size: 18px;">8. DEFAULT AND TERMINATION</h2>
<p>Landlord may terminate for non-payment after <u>_____</u> days' notice or breach of any material term after <u>_____</u> days' notice to remedy.</p>

<h2 style="font-size: 18px;">9. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>LANDLORD SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>TENANT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'room-rental',
    name: 'Room Rental Agreement',
    description: 'Agreement for renting a single room in a shared house or flat',
    category: 'lease',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">ROOM RENTAL AGREEMENT</h1>
  <p style="font-style: italic;">Single Room in Shared Accommodation</p>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>LANDLORD/HEAD TENANT:</strong><br/>
Name: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>ROOM TENANT:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY AND ROOM</h2>
<p>Full Property Address: <u>_________________________________________________________________</u></p>
<p>Room Description: <u>_________________________________</u> (e.g., Bedroom 2, upper floor)</p>
<p>Room Size: <u>________</u> sq m/ft &nbsp; Furnished: ☐ Yes ☐ No</p>
<p>Furnishings Included: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. SHARED AREAS</h2>
<p>Tenant has access to the following shared areas:</p>
<p>☐ Kitchen ☐ Living Room ☐ Bathroom(s): <u>_____</u> ☐ Garden ☐ Laundry ☐ Parking</p>

<h2 style="font-size: 18px;">3. RENTAL TERM</h2>
<p>Start Date: <u>________________</u> &nbsp; End Date: <u>________________</u> (or rolling monthly)</p>
<p>Notice Period to Vacate: <u>_____</u> days by either party</p>

<h2 style="font-size: 18px;">4. RENT AND PAYMENTS</h2>
<p>Monthly Rent: <u>________________</u> &nbsp; Due: <u>_____</u> day of each month</p>
<p>Security Deposit: <u>________________</u></p>
<p>Bills Included: ☐ Electricity ☐ Water ☐ Gas ☐ Internet ☐ All bills</p>
<p>Tenant's share of utilities if not included: <u>________________</u> per month (estimated)</p>

<h2 style="font-size: 18px;">5. HOUSE RULES</h2>
<ul>
  <li>Quiet hours: <u>________</u> to <u>________</u></li>
  <li>Overnight guests: ☐ Allowed (max <u>_____</u> nights/week) ☐ Not Allowed</li>
  <li>Smoking: ☐ Allowed in designated area ☐ Not Allowed</li>
  <li>Pets: ☐ Allowed ☐ Not Allowed</li>
  <li>Kitchen cleaning: <u>_________________________________</u></li>
  <li>Common area responsibilities: <u>_________________________________</u></li>
</ul>

<h2 style="font-size: 18px;">6. OTHER OCCUPANTS</h2>
<p>Other current occupants of the property: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">7. KEYS AND ACCESS</h2>
<p>Number of keys/access cards issued: <u>_____</u> &nbsp; Replacement cost: <u>________________</u></p>

<h2 style="font-size: 18px;">8. TERMINATION</h2>
<p>Either party may end this agreement with <u>_____</u> days' written notice. The deposit will be returned within <u>_____</u> days of vacating, less deductions for damage or unpaid rent.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>LANDLORD SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>ROOM TENANT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'month-to-month-rental',
    name: 'Month-to-Month Tenancy Agreement',
    description: 'Flexible rolling monthly tenancy with short notice periods',
    category: 'lease',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">MONTH-TO-MONTH TENANCY AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>LANDLORD:</strong><br/>
Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>TENANT:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY</h2>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Type: ☐ Apartment ☐ House ☐ Studio ☐ Other: <u>________</u></p>

<h2 style="font-size: 18px;">2. TENANCY TERM</h2>
<p>Commencement Date: <u>________________</u></p>
<p>This tenancy is a month-to-month arrangement and continues until terminated in writing by either party.</p>
<p>Minimum stay: <u>_____</u> month(s)</p>

<h2 style="font-size: 18px;">3. RENT</h2>
<p>Monthly Rent: <u>________________</u> &nbsp; Currency: <u>________</u></p>
<p>Due Date: <u>_____</u> day of each month</p>
<p>Payment Method: <u>_________________________________</u></p>
<p>Late Fee: <u>________________</u> if paid after <u>_____</u> days</p>
<p>The Landlord may increase rent by giving <u>_____</u> days' written notice.</p>

<h2 style="font-size: 18px;">4. SECURITY DEPOSIT</h2>
<p>Amount: <u>________________</u> &nbsp; Returned within <u>_____</u> days of vacating</p>

<h2 style="font-size: 18px;">5. UTILITIES</h2>
<p>Included in rent: ☐ Electricity ☐ Water ☐ Gas ☐ Internet ☐ None</p>
<p>Tenant pays: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">6. TERMINATION NOTICE</h2>
<p>Tenant must give at least <u>_____</u> days' written notice before vacating.</p>
<p>Landlord must give at least <u>_____</u> days' written notice to end the tenancy.</p>
<p>Notice may be delivered by: ☐ Email ☐ Text/SMS ☐ Written letter</p>

<h2 style="font-size: 18px;">7. GENERAL CONDITIONS</h2>
<ul>
  <li>Pets: ☐ Allowed ☐ Not Allowed</li>
  <li>Smoking: ☐ Allowed ☐ Not Allowed</li>
  <li>Subletting: ☐ Not permitted without written consent</li>
  <li>Maximum occupants: <u>_____</u></li>
</ul>

<h2 style="font-size: 18px;">8. MAINTENANCE</h2>
<p>Tenant shall keep the property clean and report maintenance issues promptly. Landlord shall maintain the property in a habitable condition.</p>

<h2 style="font-size: 18px;">9. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>LANDLORD SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>TENANT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'sublease-agreement',
    name: 'Sublease Agreement',
    description: 'Agreement for a tenant to sublet all or part of a property to a subtenant',
    category: 'lease',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">SUBLEASE AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>SUBLANDLORD (Original Tenant):</strong><br/>
Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>SUBTENANT:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>MASTER LANDLORD:</strong><br/>
Name: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PREMISES</h2>
<p>Full Property Address: <u>_________________________________________________________________</u></p>
<p>Sublet Portion: ☐ Entire property ☐ Specific area: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. MASTER LEASE</h2>
<p>The Sublandlord holds a lease for the above property dated <u>________________</u>, expiring <u>________________</u>.</p>
<p>Master Landlord consent to sublease: ☐ Granted (written consent attached) ☐ Consent clause in master lease permits subletting</p>

<h2 style="font-size: 18px;">3. SUBLEASE TERM</h2>
<p>Start Date: <u>________________</u> &nbsp; End Date: <u>________________</u></p>
<p>The sublease term shall not extend beyond the master lease expiry date.</p>

<h2 style="font-size: 18px;">4. RENT</h2>
<p>Monthly Sublease Rent: <u>________________</u></p>
<p>Due Date: <u>_____</u> day of each month, paid to the Sublandlord</p>
<p>Security Deposit: <u>________________</u></p>
<p>Late Fee: <u>________________</u> per day after <u>_____</u> day grace period</p>

<h2 style="font-size: 18px;">5. UTILITIES AND SERVICES</h2>
<p>Included in sublease rent: ☐ Electricity ☐ Water ☐ Internet ☐ All utilities</p>
<p>Subtenant pays separately: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">6. CONDITIONS</h2>
<ul>
  <li>Subtenant shall comply with all terms of the master lease</li>
  <li>No further subletting or assignment by Subtenant</li>
  <li>Sublandlord remains liable to Master Landlord under the master lease</li>
  <li>Subtenant shall not contact the Master Landlord without Sublandlord's consent</li>
</ul>

<h2 style="font-size: 18px;">7. TERMINATION</h2>
<p>Either party may terminate with <u>_____</u> days' written notice. The sublease automatically terminates if the master lease ends.</p>

<h2 style="font-size: 18px;">8. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>SUBLANDLORD SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>SUBTENANT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  // ── purchase (4 new) ───────────────────────────────────────────────────────
  {
    id: 'land-purchase-agreement',
    name: 'Vacant Land Purchase Agreement',
    description: 'Purchase agreement specifically for undeveloped land or plots',
    category: 'purchase',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">VACANT LAND PURCHASE AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>SELLER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>BUYER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. LAND DESCRIPTION</h2>
<p>Location/Address: <u>_________________________________________________________________</u></p>
<p>Title/Registry Number: <u>_________________________________</u></p>
<p>Total Area: <u>________________</u> square meters / hectares / rai</p>
<p>Boundaries: North: <u>__________</u> South: <u>__________</u> East: <u>__________</u> West: <u>__________</u></p>
<p>Zoning Classification: <u>_________________________________</u></p>
<p>Land Use Rights: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. PURCHASE PRICE</h2>
<p>Total Purchase Price: <u>________________</u> (Currency: <u>________</u>)</p>
<p>Price per sq m / hectare: <u>________________</u></p>
<p>Earnest Money: <u>________________</u> due within <u>_____</u> days</p>
<p>Balance Due at Closing: <u>________________</u> on or before <u>________________</u></p>

<h2 style="font-size: 18px;">3. TITLE AND ENCUMBRANCES</h2>
<p>The Seller warrants the land is free from: ☐ Mortgages ☐ Liens ☐ Easements (undisclosed) ☐ Encroachments</p>
<p>Known encumbrances or rights of way: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">4. SURVEYS AND INSPECTIONS</h2>
<p>Buyer may arrange a land survey within <u>_____</u> days at Buyer's cost.</p>
<p>If survey reveals area discrepancy exceeding <u>_____</u>%, either party may renegotiate or cancel.</p>

<h2 style="font-size: 18px;">5. ACCESS AND UTILITIES</h2>
<p>Road access: ☐ Direct public road ☐ Right of way via: <u>_________________________________</u></p>
<p>Utility connections available: ☐ Electricity ☐ Water ☐ Sewer ☐ None</p>

<h2 style="font-size: 18px;">6. CONDITIONS</h2>
<ul>
  <li>☐ Subject to Buyer's satisfactory due diligence</li>
  <li>☐ Subject to zoning approval for: <u>_________________________________</u></li>
  <li>☐ Subject to financing approval</li>
  <li>☐ Other: <u>_________________________________</u></li>
</ul>

<h2 style="font-size: 18px;">7. CLOSING</h2>
<p>Closing Date: <u>________________</u> &nbsp; Location: <u>_________________________________</u></p>
<p>Transfer taxes and registration fees: ☐ Split equally ☐ Paid by Buyer ☐ Paid by Seller</p>

<h2 style="font-size: 18px;">8. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>SELLER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>BUYER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'commercial-property-purchase',
    name: 'Commercial Real Estate Purchase Agreement',
    description: 'Purchase agreement for commercial properties such as offices, shops, or industrial units',
    category: 'purchase',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">COMMERCIAL REAL ESTATE PURCHASE AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>SELLER:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Registration No.: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Represented by: <u>_________________________________</u></p>

<p><strong>BUYER:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Registration No.: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Represented by: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY DESCRIPTION</h2>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Type: ☐ Office ☐ Retail ☐ Industrial ☐ Mixed-Use ☐ Other: <u>________</u></p>
<p>Net Leasable Area: <u>________</u> sq m &nbsp; Land Area: <u>________</u> sq m</p>
<p>Title/Registry Number: <u>_________________________________</u></p>
<p>Current Tenants: ☐ Vacant ☐ Occupied — see rent roll attached</p>

<h2 style="font-size: 18px;">2. PURCHASE PRICE AND PAYMENT</h2>
<p>Total Purchase Price: <u>________________</u> (Currency: <u>________</u>)</p>
<p>Earnest Money Deposit: <u>________________</u> due within <u>_____</u> banking days</p>
<p>Second Instalment: <u>________________</u> due by <u>________________</u></p>
<p>Balance at Closing: <u>________________</u> due on <u>________________</u></p>

<h2 style="font-size: 18px;">3. DUE DILIGENCE PERIOD</h2>
<p>Buyer shall have <u>_____</u> days from the date hereof to conduct due diligence including:</p>
<ul>
  <li>Physical inspection and environmental assessment</li>
  <li>Review of existing leases, permits, and licences</li>
  <li>Title search and encumbrance verification</li>
  <li>Financial review of rental income and operating costs</li>
</ul>
<p>If unsatisfied, Buyer may cancel within this period and recover the earnest money deposit.</p>

<h2 style="font-size: 18px;">4. REPRESENTATIONS AND WARRANTIES</h2>
<p>Seller represents: valid title; no undisclosed litigation; all permits current; no material defects known but not disclosed.</p>

<h2 style="font-size: 18px;">5. ASSIGNMENT OF LEASES</h2>
<p>Seller shall assign all existing tenancy agreements to Buyer at closing. Security deposits held by Seller: <u>________________</u></p>

<h2 style="font-size: 18px;">6. CLOSING COSTS</h2>
<p>Transfer taxes: ☐ Shared equally ☐ Buyer ☐ Seller</p>
<p>Agent commission: <u>________________</u> paid by <u>_________________________________</u></p>
<p>Legal fees: each party bears own costs</p>

<h2 style="font-size: 18px;">7. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>. Disputes shall be referred to <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>SELLER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>BUYER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'installment-property-sale',
    name: 'Property Sale by Installments Agreement',
    description: 'Agreement for selling property with payment spread across multiple instalments',
    category: 'purchase',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">PROPERTY SALE BY INSTALLMENTS AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>SELLER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>BUYER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY</h2>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Registry/Title Number: <u>_________________________________</u></p>
<p>Description: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. TOTAL PURCHASE PRICE AND INSTALLMENTS</h2>
<p>Cash Price (if paid in full today): <u>________________</u></p>
<p>Installment Sale Price (includes financing): <u>________________</u></p>
<p>Interest Rate on Outstanding Balance: <u>_____</u>% per annum</p>

<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
  <tr style="background: #f0f0f0;">
    <th style="padding: 8px; border: 1px solid #ccc;">Installment</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Amount</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Due Date</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Purpose</th>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">1st (Deposit)</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;">On signing</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">2nd</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">Final</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;">Title transfer</td>
  </tr>
</table>

<h2 style="font-size: 18px;">3. TITLE TRANSFER</h2>
<p>Legal title to the property shall transfer to the Buyer only upon receipt of the final installment. Until that date, the Seller retains title as security.</p>

<h2 style="font-size: 18px;">4. POSSESSION</h2>
<p>The Buyer ☐ shall ☐ shall not take possession before full payment. If possession is granted early, the Buyer shall pay <u>________________</u> per month as an occupancy fee.</p>

<h2 style="font-size: 18px;">5. DEFAULT</h2>
<p>If the Buyer misses any installment by more than <u>_____</u> days, the Seller may:</p>
<ul>
  <li>Charge interest at <u>_____</u>% per month on overdue amounts, and/or</li>
  <li>After <u>_____</u> consecutive missed payments, cancel this agreement and forfeit all amounts paid as liquidated damages</li>
</ul>

<h2 style="font-size: 18px;">6. INSURANCE AND MAINTENANCE</h2>
<p>During the installment period, the property shall be insured by: ☐ Seller ☐ Buyer for a minimum of <u>________________</u>.</p>

<h2 style="font-size: 18px;">7. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>SELLER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>BUYER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'property-exchange-agreement',
    name: 'Property Exchange / Swap Agreement',
    description: 'Agreement for two parties to exchange their respective properties',
    category: 'purchase',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">PROPERTY EXCHANGE AGREEMENT</h1>
  <p style="font-style: italic;">Property Swap / Like-Kind Exchange</p>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>PARTY A:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>PARTY B:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTIES SUBJECT TO EXCHANGE</h2>
<p><strong>Party A's Property ("Property A"):</strong></p>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Registry No.: <u>_________________________________</u> &nbsp; Area: <u>________</u> sq m</p>
<p>Agreed Value: <u>________________</u></p>

<p><strong>Party B's Property ("Property B"):</strong></p>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Registry No.: <u>_________________________________</u> &nbsp; Area: <u>________</u> sq m</p>
<p>Agreed Value: <u>________________</u></p>

<h2 style="font-size: 18px;">2. EQUALIZATION PAYMENT</h2>
<p>Difference in agreed values: <u>________________</u></p>
<p>☐ No equalization payment — values are equal</p>
<p>☐ Party <u>__</u> shall pay Party <u>__</u> an equalization sum of <u>________________</u> by <u>________________</u></p>

<h2 style="font-size: 18px;">3. CONDITION OF PROPERTIES</h2>
<p>Each party has inspected the other's property and accepts it: ☐ As-Is ☐ Subject to the following conditions being met: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">4. TITLE WARRANTIES</h2>
<p>Each party warrants that they hold valid, unencumbered title to their respective property and will provide all documents needed for transfer.</p>
<p>Known encumbrances: Party A: <u>_________________________________</u></p>
<p>Known encumbrances: Party B: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">5. SIMULTANEOUS CLOSING</h2>
<p>Both property transfers shall occur simultaneously on <u>________________</u> at <u>_________________________________</u>.</p>
<p>If either transfer cannot be completed, neither transfer shall proceed.</p>

<h2 style="font-size: 18px;">6. TRANSFER COSTS</h2>
<p>Each party shall bear the transfer taxes and registration fees for the property they are acquiring.</p>
<p>Shared costs (e.g., notary): split equally.</p>

<h2 style="font-size: 18px;">7. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>PARTY A SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>PARTY B SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  // ── bicycle (4 new) ────────────────────────────────────────────────────────
  {
    id: 'electric-bike-rental',
    name: 'Electric Bike / E-Scooter Rental Agreement',
    description: 'Rental agreement for electric bicycles and e-scooters with safety and charging terms',
    category: 'bicycle',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">ELECTRIC BIKE / E-SCOOTER RENTAL AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>OWNER/OPERATOR:</strong><br/>
Name: <u>_________________________________</u><br/>
Business: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>RENTER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Emergency Contact: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. VEHICLE DETAILS</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Type:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Electric Bicycle ☐ E-Scooter ☐ Other: <u>________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Brand/Model:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Serial/ID No.:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Battery Level at Handover:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>______</u>%</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Condition:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Excellent ☐ Good ☐ Fair</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Accessories:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Helmet ☐ Lock ☐ Charger ☐ Phone mount</td>
  </tr>
</table>

<h2 style="font-size: 18px;">2. RENTAL PERIOD AND FEES</h2>
<p>Start: <u>________________</u> at <u>________</u> &nbsp; Return: <u>________________</u> at <u>________</u></p>
<p>Rate: <u>________________</u> per ☐ Hour ☐ Half-day ☐ Day ☐ Week</p>
<p>Total Fee: <u>________________</u> &nbsp; Security Deposit: <u>________________</u></p>
<p>Late Return Fee: <u>________________</u> per hour</p>
<p>Return with battery below <u>_____</u>%: additional charge of <u>________________</u></p>

<h2 style="font-size: 18px;">3. PERMITTED USE AND RESTRICTIONS</h2>
<ul>
  <li>Maximum speed: comply with local law (typically <u>_____</u> km/h for e-bikes)</li>
  <li>Allowed zones: ☐ Bike lanes ☐ Roads ☐ Cycle paths — no motorways or off-road</li>
  <li>Maximum rider weight: <u>_____</u> kg &nbsp; &nbsp; Maximum: ☐ 1 rider only</li>
  <li>No modification to the vehicle, motor, or battery</li>
  <li>Must be locked when unattended using the provided lock</li>
</ul>

<h2 style="font-size: 18px;">4. SAFETY REQUIREMENTS</h2>
<p>Renter confirms: of legal age to ride in this jurisdiction; will wear helmet; understands the vehicle's controls before departing.</p>

<h2 style="font-size: 18px;">5. LIABILITY AND DAMAGE</h2>
<p>Renter is liable for: damage to vehicle, theft (replacement value: <u>________________</u>), traffic fines, and third-party damage during the rental period.</p>
<p>Owner's liability is limited to the rental fee paid.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>OWNER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>RENTER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'bicycle-sale-agreement',
    name: 'Bicycle Bill of Sale',
    description: 'Bill of sale for the private sale or transfer of a bicycle',
    category: 'bicycle',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">BICYCLE BILL OF SALE</h1>
</div>

<p><strong>Date:</strong> <u>________________</u></p>

<p><strong>SELLER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>BUYER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. BICYCLE DESCRIPTION</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Brand:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Model:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Year:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Color:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Frame Serial No.:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Type:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Road ☐ Mountain ☐ City/Hybrid ☐ Electric ☐ Other: <u>________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Condition:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ New ☐ Excellent ☐ Good ☐ Fair — Notes: <u>________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Accessories Included:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Lock ☐ Lights ☐ Helmet ☐ Pump ☐ Bag ☐ Other: <u>________</u></td>
  </tr>
</table>

<h2 style="font-size: 18px;">2. SALE PRICE</h2>
<p>Sale Price: <u>________________</u> (Currency: <u>________</u>)</p>
<p>Payment Method: ☐ Cash ☐ Bank Transfer ☐ Other: <u>________________</u></p>
<p>Payment received on: <u>________________</u></p>

<h2 style="font-size: 18px;">3. AS-IS SALE</h2>
<p>The bicycle is sold in its current condition, "AS IS". The Seller makes no warranties beyond confirming they are the lawful owner and the bicycle is free of financial encumbrances.</p>

<h2 style="font-size: 18px;">4. TITLE TRANSFER</h2>
<p>The Seller confirms they are the sole owner of the bicycle and transfers full ownership to the Buyer upon receipt of payment.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>SELLER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>BUYER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'bicycle-repair-contract',
    name: 'Bicycle Repair and Maintenance Contract',
    description: 'Service contract for bicycle repair, servicing, and ongoing maintenance',
    category: 'bicycle',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">BICYCLE REPAIR AND MAINTENANCE CONTRACT</h1>
</div>

<p><strong>Contract Date:</strong> <u>________________</u></p>

<p><strong>SERVICE PROVIDER (Mechanic/Shop):</strong><br/>
Name/Business: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>CUSTOMER:</strong><br/>
Name: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. BICYCLE DETAILS</h2>
<p>Brand/Model: <u>_________________________________</u> &nbsp; Color: <u>________________</u></p>
<p>Serial No.: <u>_________________________________</u></p>
<p>Reported Issues: <u>_________________________________________________________________</u></p>

<h2 style="font-size: 18px;">2. WORK AUTHORISED</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr style="background: #f0f0f0;">
    <th style="padding: 8px; border: 1px solid #ccc;">Service / Part</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Estimated Cost</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Approved</th>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Yes ☐ No</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Yes ☐ No</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Yes ☐ No</td>
  </tr>
</table>
<p><strong>Maximum authorised spend without further approval:</strong> <u>________________</u></p>

<h2 style="font-size: 18px;">3. COMPLETION AND COLLECTION</h2>
<p>Estimated Ready Date: <u>________________</u></p>
<p>Collection Deadline: <u>________________</u> — storage fee of <u>________________</u>/day applies after this date</p>
<p>Customer will be notified by: ☐ Phone ☐ SMS ☐ Email</p>

<h2 style="font-size: 18px;">4. PAYMENT</h2>
<p>Total Estimated Cost: <u>________________</u></p>
<p>Deposit Paid: <u>________________</u> &nbsp; Balance due on collection: <u>________________</u></p>
<p>Payment Method: ☐ Cash ☐ Card ☐ Transfer</p>

<h2 style="font-size: 18px;">5. WARRANTY ON REPAIRS</h2>
<p>Labour warranty: <u>_____</u> days &nbsp; Parts warranty: <u>_____</u> days (manufacturer warranty may apply)</p>
<p>Warranty is void if the bicycle is misused, modified by a third party, or damaged after collection.</p>

<h2 style="font-size: 18px;">6. LIABILITY</h2>
<p>The Service Provider is not liable for pre-existing damage, theft from the premises (beyond normal care), or consequential losses. Maximum liability is limited to the repair cost paid.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>SERVICE PROVIDER</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>CUSTOMER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'cycling-tour-agreement',
    name: 'Group Cycling Tour Participation Agreement',
    description: 'Participation and liability waiver for organised group cycling tours',
    category: 'bicycle',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">GROUP CYCLING TOUR PARTICIPATION AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>TOUR OPERATOR:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>PARTICIPANT:</strong><br/>
Name: <u>_________________________________</u><br/>
Date of Birth: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Emergency Contact: <u>_________________________________</u> &nbsp; Phone: <u>_________________________________</u><br/>
Medical Conditions/Allergies: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. TOUR DETAILS</h2>
<p>Tour Name: <u>_________________________________</u></p>
<p>Start Date/Time: <u>________________</u> &nbsp; End Date/Time: <u>________________</u></p>
<p>Meeting Point: <u>_________________________________</u></p>
<p>Approximate Distance: <u>________________</u> km &nbsp; Difficulty: ☐ Easy ☐ Moderate ☐ Challenging</p>
<p>Route Overview: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. FEES</h2>
<p>Participation Fee: <u>________________</u></p>
<p>Includes: ☐ Bicycle rental ☐ Helmet ☐ Guide ☐ Lunch ☐ Insurance ☐ Other: <u>________</u></p>
<p>Cancellation: Full refund if cancelled more than <u>_____</u> days before the tour; no refund thereafter.</p>

<h2 style="font-size: 18px;">3. PARTICIPANT REQUIREMENTS</h2>
<ul>
  <li>Minimum age: <u>_____</u> years (or accompanied by guardian)</li>
  <li>Physical fitness adequate for the stated difficulty level</li>
  <li>Ability to ride a bicycle without assistance</li>
  <li>Own travel/accident insurance is recommended</li>
</ul>

<h2 style="font-size: 18px;">4. PARTICIPANT OBLIGATIONS</h2>
<ul>
  <li>Follow the tour guide's instructions at all times</li>
  <li>Wear a helmet throughout the tour</li>
  <li>Stay with the group; notify guide before leaving the route</li>
  <li>Carry sufficient water and any personal medication</li>
  <li>Obey all traffic laws</li>
</ul>

<h2 style="font-size: 18px;">5. RISKS AND LIABILITY WAIVER</h2>
<p>I acknowledge that cycling involves inherent risks including falls, collisions, and injury. I voluntarily accept these risks and waive any claims against the Operator, its guides and staff, for injuries or losses arising from participation, except in cases of gross negligence.</p>

<h2 style="font-size: 18px;">6. PHOTOGRAPHS AND MEDIA</h2>
<p>☐ I consent ☐ I do not consent to my image being used in the Operator's marketing materials.</p>

<h2 style="font-size: 18px;">7. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>OPERATOR SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>PARTICIPANT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  // ── moto (3 new) ───────────────────────────────────────────────────────────
  {
    id: 'motorcycle-purchase-agreement',
    name: 'Motorcycle Purchase Agreement',
    description: 'Detailed purchase agreement for private sale of a motorcycle between individuals',
    category: 'moto',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">MOTORCYCLE PURCHASE AGREEMENT</h1>
  <p style="font-style: italic;">Private Sale Between Individuals</p>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>SELLER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>BUYER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. VEHICLE DETAILS</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Make:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Model:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Year:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Color:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Engine CC:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>VIN:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>License Plate:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Odometer:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u> km/miles</td>
  </tr>
</table>
<p>Condition: ☐ Excellent ☐ Good ☐ Fair &nbsp; Known defects: <u>_________________________________</u></p>
<p>Documents included: ☐ Registration ☐ Title/Ownership ☐ Service history ☐ Insurance (valid to: <u>________</u>)</p>

<h2 style="font-size: 18px;">2. PURCHASE PRICE</h2>
<p>Agreed Sale Price: <u>________________</u> (Currency: <u>________</u>)</p>
<p>Deposit: <u>________________</u> paid on <u>________________</u></p>
<p>Balance: <u>________________</u> due on or before <u>________________</u></p>
<p>Payment Method: ☐ Cash ☐ Bank Transfer ☐ Other: <u>________________</u></p>

<h2 style="font-size: 18px;">3. AS-IS SALE</h2>
<p>The motorcycle is sold "AS IS" in its current condition. The Buyer has inspected and test-ridden the vehicle and accepts it in its present state.</p>

<h2 style="font-size: 18px;">4. SELLER WARRANTIES</h2>
<p>The Seller confirms: sole and legal owner; no outstanding finance or liens; odometer reading is accurate to the best of their knowledge; the vehicle is not reported stolen.</p>

<h2 style="font-size: 18px;">5. TITLE TRANSFER</h2>
<p>Title transfers upon receipt of full payment. Seller shall assist with all registration transfer documentation.</p>

<h2 style="font-size: 18px;">6. HANDOVER</h2>
<p>Handover Date: <u>________________</u> &nbsp; Location: <u>_________________________________</u></p>
<p>Seller retains existing insurance — Buyer must arrange their own insurance before riding.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>SELLER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>BUYER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'atv-quad-rental',
    name: 'ATV / Quad Bike Rental Agreement',
    description: 'Rental agreement for ATVs, quad bikes, and off-road vehicles',
    category: 'moto',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">ATV / QUAD BIKE RENTAL AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>OWNER/OPERATOR:</strong><br/>
Name/Business: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>RENTER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Driver's License: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Emergency Contact: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. VEHICLE DETAILS</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Type:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ ATV ☐ Quad Bike ☐ Side-by-Side ☐ Other: <u>________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Brand/Model:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Engine CC:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>License Plate:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Fuel Level:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Full ☐ 3/4 ☐ 1/2 ☐ 1/4</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Condition:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐ Excellent ☐ Good ☐ Fair — pre-existing damage noted: <u>________________</u></td>
  </tr>
</table>

<h2 style="font-size: 18px;">2. RENTAL PERIOD AND FEES</h2>
<p>Start: <u>________________</u> at <u>________</u> &nbsp; Return: <u>________________</u> at <u>________</u></p>
<p>Rate: <u>________________</u> per ☐ Hour ☐ Half-day ☐ Day</p>
<p>Total Rental Fee: <u>________________</u> &nbsp; Security Deposit: <u>________________</u></p>
<p>Late Return: <u>________________</u> per hour after agreed return time</p>
<p>Vehicle must be returned with the same fuel level; refuelling fee if returned below: <u>________________</u></p>

<h2 style="font-size: 18px;">3. PERMITTED AREA</h2>
<p>The ATV/Quad may only be used in: <u>_________________________________</u></p>
<p>Authorised terrain: ☐ Off-road trails ☐ Private land ☐ As directed by tour guide</p>
<p>Prohibited: public roads, national park areas, beach areas — unless specifically authorised above.</p>

<h2 style="font-size: 18px;">4. SAFETY RULES</h2>
<ul>
  <li>Helmet and protective gear must be worn at all times</li>
  <li>Maximum passengers: <u>_____</u></li>
  <li>No racing or stunts</li>
  <li>No riding under the influence of alcohol or drugs</li>
  <li>Minimum age: <u>_____</u> years</li>
</ul>

<h2 style="font-size: 18px;">5. LIABILITY AND DAMAGE</h2>
<p>Renter is responsible for all damage, traffic violations, and third-party claims arising during the rental. The Owner's liability is limited to the rental fee paid.</p>
<p>Full replacement value if vehicle is destroyed or stolen: <u>________________</u></p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>OWNER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>RENTER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'electric-scooter-rental',
    name: 'Electric Scooter Rental Agreement',
    description: 'Rental agreement for electric kick-scooters for short-distance urban travel',
    category: 'moto',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">ELECTRIC SCOOTER RENTAL AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>OWNER/OPERATOR:</strong><br/>
Name/Business: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>RENTER:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Date of Birth: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. SCOOTER DETAILS</h2>
<p>Brand/Model: <u>_________________________________</u> &nbsp; Serial/ID No.: <u>_________________________________</u></p>
<p>Max Speed: <u>_____</u> km/h &nbsp; Max Range: <u>_____</u> km &nbsp; Battery at Handover: <u>_____</u>%</p>
<p>Condition at Handover: ☐ Excellent ☐ Good &nbsp; Noted damage: <u>_________________________________</u></p>
<p>Accessories: ☐ Helmet ☐ Charger ☐ Lock &nbsp; Other: <u>________________</u></p>

<h2 style="font-size: 18px;">2. RENTAL TERMS</h2>
<p>Start: <u>________________</u> at <u>________</u> &nbsp; Return: <u>________________</u> at <u>________</u></p>
<p>Rate: <u>________________</u> per ☐ Hour ☐ Day &nbsp; Total: <u>________________</u></p>
<p>Security Deposit: <u>________________</u> &nbsp; Late Fee: <u>________________</u>/hour</p>
<p>Scooter must be returned charged to at least <u>_____</u>% or a charging fee of <u>________________</u> applies.</p>

<h2 style="font-size: 18px;">3. LEGAL COMPLIANCE</h2>
<p>Renter confirms they are: at least <u>_____</u> years old; possess any licence required by local law for e-scooters; will comply with all local regulations on speed limits, allowed roads/paths, and helmet requirements.</p>

<h2 style="font-size: 18px;">4. PROHIBITED USES</h2>
<ul>
  <li>Motorways, highways, or roads where e-scooters are banned</li>
  <li>More than one rider at a time</li>
  <li>Riding under the influence of alcohol or drugs</li>
  <li>Carrying the scooter on public transport unless folded and permitted</li>
  <li>Disassembly or modification of the scooter</li>
</ul>

<h2 style="font-size: 18px;">5. DAMAGE AND LOSS</h2>
<p>Renter is liable for damage beyond normal wear, theft (replacement value: <u>________________</u>), and fines incurred during the rental period.</p>

<h2 style="font-size: 18px;">6. WAIVER</h2>
<p>Renter acknowledges the risks of e-scooter use and waives claims against the Owner for injuries or losses, except in cases of Owner's gross negligence.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>OWNER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>RENTER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  // ── service (3 new) ────────────────────────────────────────────────────────
  {
    id: 'property-management-contract',
    name: 'Property Management Contract',
    description: 'Contract appointing a property manager to manage a rental property on behalf of the owner',
    category: 'service',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">PROPERTY MANAGEMENT CONTRACT</h1>
</div>

<p><strong>Contract Date:</strong> <u>________________</u></p>

<p><strong>PROPERTY OWNER:</strong><br/>
Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>PROPERTY MANAGER:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Licence No.: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. MANAGED PROPERTY</h2>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Type: ☐ Residential ☐ Commercial &nbsp; Units: <u>_____</u></p>

<h2 style="font-size: 18px;">2. APPOINTMENT AND TERM</h2>
<p>The Owner appoints the Manager as exclusive agent for the above property.</p>
<p>Start Date: <u>________________</u> &nbsp; Initial Term: <u>_____</u> months</p>
<p>Auto-renews monthly unless either party gives <u>_____</u> days' written notice of termination.</p>

<h2 style="font-size: 18px;">3. MANAGEMENT SERVICES</h2>
<p>The Manager shall:</p>
<ul>
  <li>Market and advertise vacant units</li>
  <li>Screen and approve tenants (subject to Owner's final approval: ☐ Yes ☐ No)</li>
  <li>Execute and renew tenancy agreements</li>
  <li>Collect rent and security deposits on behalf of the Owner</li>
  <li>Arrange and supervise maintenance and repairs up to <u>________________</u> per occurrence without prior Owner approval</li>
  <li>Conduct periodic property inspections: ☐ Quarterly ☐ Semi-annually</li>
  <li>Provide monthly financial statements to the Owner</li>
</ul>

<h2 style="font-size: 18px;">4. MANAGEMENT FEES</h2>
<p>Monthly Management Fee: <u>_____</u>% of gross rent collected or fixed fee of <u>________________</u>/month</p>
<p>Leasing/Letting Fee: <u>_____</u>% of first month's rent per new tenancy</p>
<p>Renewal Fee: <u>________________</u></p>
<p>Maintenance Supervision Fee: <u>_____</u>% of maintenance cost above threshold</p>

<h2 style="font-size: 18px;">5. OWNER OBLIGATIONS</h2>
<ul>
  <li>Maintain adequate property insurance</li>
  <li>Fund a float account of <u>________________</u> for maintenance expenses</li>
  <li>Respond to Manager's requests within <u>_____</u> business days</li>
</ul>

<h2 style="font-size: 18px;">6. DISBURSEMENTS</h2>
<p>Manager shall remit net rental income to Owner by the <u>_____</u> of each month after deducting management fees and authorised expenses.</p>

<h2 style="font-size: 18px;">7. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>OWNER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>MANAGER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'cleaning-service-contract',
    name: 'House / Office Cleaning Service Contract',
    description: 'Service contract for recurring residential or commercial cleaning services',
    category: 'service',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">CLEANING SERVICE CONTRACT</h1>
</div>

<p><strong>Contract Date:</strong> <u>________________</u></p>

<p><strong>CLIENT:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Address of Property to be Cleaned: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>CLEANING PROVIDER:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY DETAILS</h2>
<p>Property Type: ☐ House/Apartment ☐ Office ☐ Commercial space &nbsp; Size: <u>________</u> sq m</p>
<p>Number of rooms: <u>_____</u> &nbsp; Bathrooms: <u>_____</u> &nbsp; Floors: <u>_____</u></p>

<h2 style="font-size: 18px;">2. SERVICES INCLUDED</h2>
<p>Standard Cleaning includes:</p>
<ul>
  <li>☐ Vacuuming and mopping all floors</li>
  <li>☐ Dusting surfaces and furniture</li>
  <li>☐ Cleaning kitchen (surfaces, sink, appliance exteriors)</li>
  <li>☐ Cleaning bathrooms (toilet, sink, shower/tub, mirrors)</li>
  <li>☐ Emptying bins</li>
  <li>☐ Window cleaning (interior) ☐ Included ☐ Additional charge</li>
  <li>☐ Oven/fridge deep clean ☐ Included ☐ Additional charge: <u>________________</u></li>
  <li>Additional services: <u>_________________________________</u></li>
</ul>

<h2 style="font-size: 18px;">3. SCHEDULE</h2>
<p>Frequency: ☐ Weekly ☐ Bi-weekly ☐ Monthly ☐ One-time</p>
<p>Day(s): <u>_________________________________</u> &nbsp; Time: <u>________</u> to approximately <u>________</u></p>
<p>Start Date: <u>________________</u></p>

<h2 style="font-size: 18px;">4. PRICING</h2>
<p>Price per visit: <u>________________</u> &nbsp; Currency: <u>________</u></p>
<p>Monthly total (if recurring): <u>________________</u></p>
<p>Payment due: ☐ After each visit ☐ Monthly in advance by <u>_____</u> of each month</p>
<p>Payment method: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">5. SUPPLIES AND EQUIPMENT</h2>
<p>Cleaning supplies: ☐ Provided by Provider ☐ Provided by Client</p>
<p>Equipment: ☐ Provided by Provider ☐ Client's equipment available on site</p>

<h2 style="font-size: 18px;">6. ACCESS</h2>
<p>Client shall provide access to the property by: ☐ Being present ☐ Providing a key/code</p>
<p>Access details: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">7. LIABILITY AND INSURANCE</h2>
<p>Provider carries public liability insurance to the value of <u>________________</u>. Provider is liable for damage caused by negligence. Client is responsible for securing valuables.</p>

<h2 style="font-size: 18px;">8. TERMINATION</h2>
<p>Either party may cancel with <u>_____</u> days' written notice. Cancellation of a scheduled visit with less than <u>_____</u> hours' notice incurs a fee of <u>________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>CLIENT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>PROVIDER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'security-guard-contract',
    name: 'Security Guard Service Contract',
    description: 'Contract for providing security guard services to a property or event',
    category: 'service',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">SECURITY GUARD SERVICE CONTRACT</h1>
</div>

<p><strong>Contract Date:</strong> <u>________________</u></p>

<p><strong>CLIENT:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>SECURITY PROVIDER:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Licence No.: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. SCOPE OF SERVICES</h2>
<p>Location(s) to be guarded: <u>_________________________________________________________________</u></p>
<p>Services include:</p>
<ul>
  <li>☐ Static guarding at entry/exit points</li>
  <li>☐ Mobile patrol: frequency — every <u>_____</u> hours</li>
  <li>☐ CCTV monitoring</li>
  <li>☐ Access control and visitor logging</li>
  <li>☐ Emergency response and incident reporting</li>
  <li>☐ Event security for: <u>_________________________________</u></li>
  <li>Other: <u>_________________________________</u></li>
</ul>

<h2 style="font-size: 18px;">2. CONTRACT PERIOD</h2>
<p>Start Date: <u>________________</u> &nbsp; End Date: <u>________________</u> (or rolling)</p>
<p>Hours of Coverage: <u>________</u> to <u>________</u> &nbsp; Days: ☐ Mon–Fri ☐ Weekends ☐ 24/7</p>
<p>Number of Guards per Shift: <u>_____</u></p>

<h2 style="font-size: 18px;">3. FEES</h2>
<p>Rate: <u>________________</u> per ☐ Hour/Guard ☐ Shift ☐ Month</p>
<p>Overtime Rate: <u>________________</u> per hour over <u>_____</u> hours/shift</p>
<p>Invoicing: ☐ Weekly ☐ Monthly &nbsp; Payment within <u>_____</u> days of invoice</p>

<h2 style="font-size: 18px;">4. PERSONNEL STANDARDS</h2>
<p>All guards provided shall hold valid security licences and have undergone background checks. Provider shall supply uniforms and any required equipment. Minimum age: <u>_____</u> years.</p>
<p>Client may request replacement of any guard for reasonable cause.</p>

<h2 style="font-size: 18px;">5. CONDUCT AND AUTHORITY</h2>
<p>Guards shall follow the Client's site rules and the Provider's code of conduct. Guards are NOT authorised to: use excessive force; make arrests beyond citizen's arrest rights; carry firearms unless specifically licenced and agreed in writing.</p>

<h2 style="font-size: 18px;">6. INCIDENT REPORTING</h2>
<p>Provider shall submit incident reports to Client within <u>_____</u> hours of any incident. Emergency contacts must be available 24/7: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">7. LIABILITY AND INSURANCE</h2>
<p>Provider carries public liability insurance of at least <u>________________</u>. Provider is liable for losses directly caused by guards' negligence.</p>

<h2 style="font-size: 18px;">8. TERMINATION</h2>
<p>Either party may terminate with <u>_____</u> days' written notice. Immediate termination may occur for gross misconduct.</p>

<h2 style="font-size: 18px;">9. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>CLIENT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>PROVIDER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  // ── promise / ownerTemplates (3 new) ──────────────────────────────────────
  {
    id: 'business-loan-note',
    name: 'Business Loan Promissory Note',
    description: 'Promissory note for a loan made to a business entity with repayment schedule',
    category: 'promise',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">BUSINESS LOAN PROMISSORY NOTE</h1>
</div>

<p><strong>Date:</strong> <u>________________</u> &nbsp; <strong>Location:</strong> <u>_________________________________</u></p>

<p><strong>LENDER:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>BORROWER (Business):</strong><br/>
Company Name: <u>_________________________________</u><br/>
Registration No.: <u>_________________________________</u><br/>
Registered Address: <u>_________________________________</u><br/>
Represented by: <u>_________________________________</u> (Name/Title)</p>

<hr style="margin: 20px 0;"/>

<p>For value received, the Borrower promises to pay to the Lender the sum of <strong><u>________________</u></strong> (Currency: <u>________</u>) together with interest at the rate of <strong><u>_____</u>%</strong> per annum.</p>

<h2 style="font-size: 18px;">1. LOAN PURPOSE</h2>
<p><u>_________________________________________________________________</u></p>

<h2 style="font-size: 18px;">2. REPAYMENT SCHEDULE</h2>
<p>☐ Lump sum: full amount due on <u>________________</u></p>
<p>☐ Installments: <u>_____</u> equal monthly payments of <u>________________</u>, commencing on <u>________________</u></p>
<p>Payment to be made to: <u>_________________________________</u> (bank/account details)</p>

<h2 style="font-size: 18px;">3. INTEREST</h2>
<p>Interest accrues from the date of disbursement on the outstanding principal balance.</p>
<p>Default interest rate (if payment is overdue): <u>_____</u>% per annum above the standard rate.</p>

<h2 style="font-size: 18px;">4. SECURITY</h2>
<p>☐ Unsecured &nbsp; ☐ Secured by: <u>_________________________________</u></p>
<p>Personal guarantee provided by: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">5. PREPAYMENT</h2>
<p>Borrower ☐ may ☐ may not repay the loan early without penalty.</p>
<p>Prepayment penalty (if applicable): <u>_________________________________</u></p>

<h2 style="font-size: 18px;">6. DEFAULT</h2>
<p>The full outstanding balance becomes immediately due if: payment is overdue by more than <u>_____</u> days; the Borrower becomes insolvent or enters administration; or any material misrepresentation is discovered.</p>

<h2 style="font-size: 18px;">7. GOVERNING LAW</h2>
<p>This Note is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>LENDER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>BORROWER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name/Title: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'investment-agreement',
    name: 'Real Estate Investment Agreement',
    description: 'Agreement between a property owner and an investor outlining investment terms and returns',
    category: 'promise',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">REAL ESTATE INVESTMENT AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>PROPERTY OWNER / DEVELOPER ("Owner"):</strong><br/>
Name/Company: <u>_________________________________</u><br/>
ID/Registration: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>INVESTOR:</strong><br/>
Name/Company: <u>_________________________________</u><br/>
ID/Registration: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. INVESTMENT PROPERTY</h2>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Project/Development Name: <u>_________________________________</u></p>
<p>Total Project Value: <u>________________</u></p>

<h2 style="font-size: 18px;">2. INVESTMENT AMOUNT AND STRUCTURE</h2>
<p>Investor's Contribution: <u>________________</u> representing <u>_____</u>% of the total project</p>
<p>Payment Schedule:</p>
<ul>
  <li>First Tranche: <u>________________</u> due by <u>________________</u></li>
  <li>Second Tranche: <u>________________</u> due by <u>________________</u></li>
  <li>Final Tranche: <u>________________</u> due by <u>________________</u></li>
</ul>
<p>Investment Structure: ☐ Equity (ownership share) ☐ Debt (fixed return) ☐ Profit share</p>

<h2 style="font-size: 18px;">3. RETURNS AND PROFIT SHARING</h2>
<p>If Equity: Investor holds <u>_____</u>% ownership and receives <u>_____</u>% of net profits and proceeds from sale.</p>
<p>If Debt: Investor receives fixed return of <u>_____</u>% per annum, paid ☐ Monthly ☐ Quarterly ☐ At maturity.</p>
<p>Projected return period: <u>_____</u> months/years</p>

<h2 style="font-size: 18px;">4. OWNER'S OBLIGATIONS</h2>
<ul>
  <li>Manage the property/development and provide quarterly financial updates</li>
  <li>Obtain all required permits and approvals</li>
  <li>Maintain property insurance</li>
  <li>Not encumber the property beyond agreed financing without Investor's consent</li>
</ul>

<h2 style="font-size: 18px;">5. EXIT STRATEGY</h2>
<p>☐ Property sale: proceeds distributed per ownership percentages after repayment of costs</p>
<p>☐ Buyout: Owner may buy out Investor's share at <u>________________</u> after <u>_____</u> years</p>
<p>☐ Other: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">6. RISK DISCLOSURE</h2>
<p>Investor acknowledges that real estate investment carries risk including market fluctuations, construction delays, and regulatory changes. Returns are not guaranteed unless stated as a fixed debt return.</p>

<h2 style="font-size: 18px;">7. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>OWNER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>INVESTOR SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'installment-payment-agreement',
    name: 'Installment Payment Agreement',
    description: 'Agreement to pay an existing debt or obligation through a structured installment schedule',
    category: 'promise',
    forRole: 'owner',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">INSTALLMENT PAYMENT AGREEMENT</h1>
  <p style="font-style: italic;">Split Payment Schedule</p>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>CREDITOR (Payee):</strong><br/>
Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>DEBTOR (Payer):</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. BACKGROUND — ORIGINAL OBLIGATION</h2>
<p>The Debtor owes the Creditor the total sum of <strong><u>________________</u></strong> arising from:</p>
<p style="margin-left: 20px;"><u>_________________________________________________________________</u></p>
<p>(e.g., unpaid rent, service fees, goods purchased, loan balance)</p>
<p>Original due date: <u>________________</u></p>

<h2 style="font-size: 18px;">2. AGREED INSTALLMENT SCHEDULE</h2>
<p>The Creditor agrees to accept payment in installments as follows:</p>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
  <tr style="background: #f0f0f0;">
    <th style="padding: 8px; border: 1px solid #ccc;">#</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Due Date</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Amount</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Paid</th>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">1</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">2</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">3</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">4</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;">☐</td>
  </tr>
  <tr style="background: #f9f9f9;">
    <td colspan="2" style="padding: 8px; border: 1px solid #ccc;"><strong>TOTAL</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong><u>________________</u></strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"></td>
  </tr>
</table>
<p>Payment method: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">3. INTEREST</h2>
<p>☐ No interest charged while payments are made on schedule</p>
<p>☐ Interest of <u>_____</u>% per annum on the outstanding balance</p>

<h2 style="font-size: 18px;">4. DEFAULT</h2>
<p>If any payment is missed by more than <u>_____</u> days, the Creditor may declare the entire remaining balance immediately due and pursue all available legal remedies.</p>

<h2 style="font-size: 18px;">5. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>CREDITOR SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>DEBTOR SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  }
];

// Client Templates
export const clientTemplates: ContractTemplate[] = [
  {
    id: 'promise-to-purchase-property',
    name: 'Promise to Purchase Property',
    description: 'Formal offer to purchase real estate with conditions',
    category: 'promise',
    forRole: 'client',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">PROMISE TO PURCHASE</h1>
  <p style="font-style: italic;">Property Purchase Offer</p>
</div>

<p><strong>Date:</strong> <u>________________</u></p>

<p><strong>TO (Seller/Owner):</strong><br/>
Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u></p>

<p><strong>FROM (Prospective Buyer):</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY SUBJECT TO THIS OFFER</h2>
<p>Property Address: <u>_________________________________________________________________</u></p>
<p>Property Description: <u>_________________________________________________________________</u></p>
<p>Legal Description/Registry #: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. PURCHASE OFFER</h2>
<p>I hereby offer to purchase the above-described property for:</p>
<p style="font-size: 20px; font-weight: bold; text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px;">
<u>________________</u> (Currency: <u>________</u>)
</p>

<h2 style="font-size: 18px;">3. EARNEST MONEY DEPOSIT</h2>
<p>Upon acceptance of this offer, I agree to provide an earnest money deposit of:</p>
<p><u>________________</u> within <u>_____</u> business days</p>
<p>To be held by: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">4. PROPOSED PAYMENT STRUCTURE</h2>
<ul>
  <li>Down Payment: <u>________________</u> (<u>_____</u>% of purchase price)</li>
  <li>Financing: ☐ Cash Purchase ☐ Bank Financing ☐ Seller Financing</li>
  <li>Closing Date Proposed: <u>________________</u></li>
</ul>

<h2 style="font-size: 18px;">5. CONDITIONS OF THIS OFFER</h2>
<p>This offer is conditional upon:</p>
<ul>
  <li>☐ Buyer obtaining mortgage approval within <u>_____</u> days</li>
  <li>☐ Satisfactory home inspection within <u>_____</u> days</li>
  <li>☐ Clear title verification</li>
  <li>☐ Property appraisal meeting or exceeding offer price</li>
  <li>☐ Sale of Buyer's current property at: <u>_________________________________</u></li>
  <li>☐ Other: <u>_________________________________</u></li>
</ul>

<h2 style="font-size: 18px;">6. ITEMS TO BE INCLUDED</h2>
<p>The following items are to be included in the sale:</p>
<p style="margin-left: 20px;"><u>_________________________________________________________________</u></p>

<h2 style="font-size: 18px;">7. OFFER VALIDITY</h2>
<p>This offer is valid until <u>________________</u> at <u>________</u>.</p>
<p>After this time, this offer shall be considered withdrawn unless accepted in writing.</p>

<h2 style="font-size: 18px;">8. BUYER'S DECLARATION</h2>
<p>I declare that:</p>
<ul>
  <li>I have the financial capacity to complete this purchase</li>
  <li>This offer is made in good faith</li>
  <li>I understand this is a legally binding document upon acceptance</li>
</ul>

<hr style="margin: 30px 0;"/>

<div style="margin-top: 40px;">
  <p><strong>BUYER'S SIGNATURE</strong></p>
  <p style="border-bottom: 1px solid #000; height: 40px; width: 60%;"></p>
  <p>Name: <u>_________________________________</u></p>
  <p>Date: <u>_________________________________</u></p>
</div>

<hr style="margin: 30px 0;"/>

<h2 style="font-size: 18px;">SELLER'S RESPONSE (To be completed by Seller)</h2>
<p>☐ ACCEPTED: I accept this offer as written</p>
<p>☐ REJECTED: I reject this offer</p>
<p>☐ COUNTER-OFFER: I propose the following changes: <u>_________________________________</u></p>

<div style="margin-top: 20px;">
  <p><strong>SELLER'S SIGNATURE</strong></p>
  <p style="border-bottom: 1px solid #000; height: 40px; width: 60%;"></p>
  <p>Name: <u>_________________________________</u></p>
  <p>Date: <u>_________________________________</u></p>
</div>
`
  },
  {
    id: 'rental-application',
    name: 'Rental Application Form',
    description: 'Application to rent a property with personal and financial information',
    category: 'rental',
    forRole: 'client',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">RENTAL APPLICATION</h1>
</div>

<p><strong>Application Date:</strong> <u>________________</u></p>
<p><strong>Property Address Applying For:</strong> <u>_________________________________________________________________</u></p>
<p><strong>Desired Move-in Date:</strong> <u>________________</u></p>
<p><strong>Lease Term Desired:</strong> <u>_____</u> months</p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PERSONAL INFORMATION</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Full Legal Name:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Date of Birth:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>ID/Passport Number:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Phone Number:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Email:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><strong>Current Address:</strong></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>_________________________________</u></td>
  </tr>
</table>

<h2 style="font-size: 18px;">2. ADDITIONAL OCCUPANTS</h2>
<p>Number of occupants (including yourself): <u>_____</u></p>
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <th style="padding: 8px; border: 1px solid #ccc;">Name</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Relationship</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Age</th>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>____</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>____</u></td>
  </tr>
</table>

<h2 style="font-size: 18px;">3. RENTAL HISTORY</h2>
<p><strong>Current/Previous Landlord:</strong></p>
<p>Name: <u>_________________________________</u></p>
<p>Phone: <u>_________________________________</u></p>
<p>Address: <u>_________________________________</u></p>
<p>Dates of Tenancy: <u>________________</u> to <u>________________</u></p>
<p>Rent Amount: <u>________________</u></p>
<p>Reason for Leaving: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">4. EMPLOYMENT INFORMATION</h2>
<p>Employment Status: ☐ Employed ☐ Self-Employed ☐ Retired ☐ Student ☐ Other</p>
<p>Employer Name: <u>_________________________________</u></p>
<p>Position/Title: <u>_________________________________</u></p>
<p>Employer Address: <u>_________________________________</u></p>
<p>Employer Phone: <u>_________________________________</u></p>
<p>Length of Employment: <u>_________________________________</u></p>
<p>Monthly Income: <u>________________</u></p>

<h2 style="font-size: 18px;">5. REFERENCES</h2>
<p><strong>Personal Reference 1:</strong></p>
<p>Name: <u>_________________________________</u> | Phone: <u>_________________________________</u> | Relationship: <u>________________</u></p>

<p><strong>Personal Reference 2:</strong></p>
<p>Name: <u>_________________________________</u> | Phone: <u>_________________________________</u> | Relationship: <u>________________</u></p>

<h2 style="font-size: 18px;">6. ADDITIONAL INFORMATION</h2>
<p>Do you have pets? ☐ Yes ☐ No | If yes, describe: <u>_________________________________</u></p>
<p>Do you smoke? ☐ Yes ☐ No</p>
<p>Have you ever been evicted? ☐ Yes ☐ No | If yes, explain: <u>_________________________________</u></p>
<p>Do you have a vehicle? ☐ Yes ☐ No | License Plate: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">7. DECLARATION</h2>
<p>I certify that all information provided in this application is true and complete. I authorize the landlord to verify all information and conduct background/credit checks as necessary.</p>

<hr style="margin: 30px 0;"/>

<div style="margin-top: 40px;">
  <p><strong>APPLICANT'S SIGNATURE</strong></p>
  <p style="border-bottom: 1px solid #000; height: 40px; width: 60%;"></p>
  <p>Name: <u>_________________________________</u></p>
  <p>Date: <u>_________________________________</u></p>
</div>
`
  },
  // ── rental_agreement / clientTemplates (4 new) ────────────────────────────
  {
    id: 'furnished-apartment-rental',
    name: 'Furnished Apartment Rental Agreement',
    description: 'Rental agreement for a fully furnished apartment including inventory list',
    category: 'rental_agreement',
    forRole: 'client',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">FURNISHED APARTMENT RENTAL AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>LANDLORD:</strong><br/>
Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>TENANT:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY</h2>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Floor/Unit: <u>________</u> &nbsp; Size: <u>________</u> sq m &nbsp; Bedrooms: <u>_____</u> &nbsp; Bathrooms: <u>_____</u></p>

<h2 style="font-size: 18px;">2. RENTAL TERM</h2>
<p>Start Date: <u>________________</u> &nbsp; End Date: <u>________________</u></p>
<p>Notice to vacate: <u>_____</u> days by either party</p>

<h2 style="font-size: 18px;">3. RENT AND DEPOSIT</h2>
<p>Monthly Rent: <u>________________</u> &nbsp; Due: <u>_____</u> day of each month</p>
<p>Security Deposit: <u>________________</u> &nbsp; Furniture Damage Deposit: <u>________________</u></p>
<p>Payment Method: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">4. UTILITIES</h2>
<p>Included: ☐ Electricity ☐ Water ☐ Gas ☐ Internet ☐ Cable TV &nbsp; Monthly cap: <u>________________</u></p>
<p>Tenant pays excess utilities above cap or: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">5. FURNITURE AND INVENTORY</h2>
<p>The apartment is rented fully furnished. A detailed inventory list is attached and signed by both parties. Tenant is responsible for returning all items in the same condition (fair wear excepted).</p>
<p>Key furniture included: <u>_________________________________________________________________</u></p>
<p>Key appliances included: <u>_________________________________________________________________</u></p>

<h2 style="font-size: 18px;">6. TENANT OBLIGATIONS</h2>
<ul>
  <li>No removal or replacement of furniture without Landlord's written consent</li>
  <li>Report damage within <u>_____</u> days of occurrence</li>
  <li>No subletting or additional occupants beyond: <u>_____</u> persons</li>
  <li>Pets: ☐ Allowed ☐ Not Allowed &nbsp; Smoking: ☐ Allowed ☐ Not Allowed</li>
</ul>

<h2 style="font-size: 18px;">7. MAINTENANCE</h2>
<p>Landlord is responsible for structural repairs and appliance servicing beyond normal use. Tenant is responsible for minor wear items and consumables.</p>

<h2 style="font-size: 18px;">8. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>LANDLORD SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>TENANT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'student-housing-rental',
    name: 'Student Housing Agreement',
    description: 'Rental agreement tailored for student accommodation with academic-year terms',
    category: 'rental_agreement',
    forRole: 'client',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">STUDENT HOUSING AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>LANDLORD/RESIDENCE MANAGER:</strong><br/>
Name/Institution: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>STUDENT TENANT:</strong><br/>
Full Name: <u>_________________________________</u><br/>
Student ID: <u>_________________________________</u><br/>
University/College: <u>_________________________________</u><br/>
Programme: <u>_________________________________</u> &nbsp; Year: <u>_____</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u><br/>
Parent/Guardian: <u>_________________________________</u> &nbsp; Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. ACCOMMODATION</h2>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Room/Unit: <u>_________________________________</u></p>
<p>Type: ☐ Private room ☐ Shared room ☐ Studio flat ☐ Shared apartment</p>

<h2 style="font-size: 18px;">2. ACADEMIC YEAR TERM</h2>
<p>Start Date: <u>________________</u> &nbsp; End Date: <u>________________</u></p>
<p>Vacation access: ☐ Room remains available ☐ Must vacate during holidays</p>
<p>Early departure: <u>_____</u> days' notice required; liability for <u>_____</u> month(s) rent</p>

<h2 style="font-size: 18px;">3. FEES</h2>
<p>Weekly/Monthly Rent: <u>________________</u></p>
<p>Included: ☐ Electricity ☐ Water ☐ Internet ☐ Laundry ☐ Gym ☐ Meals (if applicable)</p>
<p>Security Deposit: <u>________________</u> (returned within <u>_____</u> days of departure)</p>
<p>Late Payment Fee: <u>________________</u></p>

<h2 style="font-size: 18px;">4. RESIDENCE RULES</h2>
<ul>
  <li>Quiet hours: <u>________</u> to <u>________</u> on study/exam periods as communicated</li>
  <li>No parties or gatherings of more than <u>_____</u> persons in the room</li>
  <li>No alcohol in under-18 areas &nbsp; ☐ Alcohol policy: <u>_________________________________</u></li>
  <li>Smoking: Not permitted anywhere on the premises</li>
  <li>Overnight guests: maximum <u>_____</u> consecutive nights; must register at reception</li>
  <li>No cooking appliances in room unless kitchen is shared</li>
</ul>

<h2 style="font-size: 18px;">5. MAINTENANCE AND DAMAGE</h2>
<p>Report issues via: <u>_________________________________</u></p>
<p>Tenant is liable for damage caused by their own or guests' actions.</p>

<h2 style="font-size: 18px;">6. TERMINATION BY INSTITUTION</h2>
<p>The Landlord may terminate immediately if the Student is suspended or expelled from their academic programme, or for serious breach of residence rules.</p>

<h2 style="font-size: 18px;">7. GOVERNING LAW</h2>
<p>This Agreement is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>LANDLORD/MANAGER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>STUDENT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'pet-lease-addendum',
    name: 'Pet Addendum to Rental Agreement',
    description: 'Addendum granting permission to keep pets in a rental property with specific conditions',
    category: 'rental_agreement',
    forRole: 'client',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">PET ADDENDUM TO RENTAL AGREEMENT</h1>
</div>

<p><strong>Date:</strong> <u>________________</u></p>
<p>This Addendum is attached to and forms part of the Rental/Lease Agreement dated <u>________________</u> for the property at:</p>
<p><u>_________________________________________________________________</u></p>

<p><strong>LANDLORD:</strong> <u>_________________________________</u></p>
<p><strong>TENANT:</strong> <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. AUTHORISED PET(S)</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr style="background: #f0f0f0;">
    <th style="padding: 8px; border: 1px solid #ccc;">Pet Name</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Species/Breed</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Age</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Weight</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Colour</th>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>__________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>__________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>______</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>______</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>__________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>__________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>__________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>______</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>______</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>__________</u></td>
  </tr>
</table>
<p>Veterinarian: <u>_________________________________</u> &nbsp; Phone: <u>_________________________________</u></p>
<p>Vaccination up to date: ☐ Yes (records provided) &nbsp; Microchipped/Licensed: ☐ Yes ☐ No</p>

<h2 style="font-size: 18px;">2. PET DEPOSIT AND FEES</h2>
<p>Refundable Pet Deposit: <u>________________</u></p>
<p>Monthly Pet Fee (non-refundable): <u>________________</u></p>
<p>The deposit will be returned within <u>_____</u> days after move-out, less any pet-related damage costs.</p>

<h2 style="font-size: 18px;">3. TENANT'S OBLIGATIONS</h2>
<ul>
  <li>Pets must not be left alone for more than <u>_____</u> hours</li>
  <li>Pets must be on a leash in all common areas</li>
  <li>Tenant shall promptly clean up after pets in all areas</li>
  <li>Tenant shall treat pets for fleas regularly and fumigate if infestation occurs</li>
  <li>Tenant is liable for all damage caused by pets (scratching, staining, odour, etc.)</li>
  <li>Pets must not disturb neighbours (excessive barking, noise)</li>
  <li>No additional pets without written consent</li>
</ul>

<h2 style="font-size: 18px;">4. REVOCATION</h2>
<p>This permission may be revoked with <u>_____</u> days' written notice if the pet causes damage or disturbance, or if the Tenant fails to comply with the conditions above.</p>

<h2 style="font-size: 18px;">5. EFFECT ON LEASE</h2>
<p>All other terms of the original lease agreement remain in full force and effect.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>LANDLORD SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>TENANT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'roommate-agreement',
    name: 'Roommate / Co-Tenant Agreement',
    description: 'Agreement between co-tenants sharing a property, covering costs, chores, and house rules',
    category: 'rental_agreement',
    forRole: 'client',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">ROOMMATE / CO-TENANT AGREEMENT</h1>
</div>

<p><strong>Agreement Date:</strong> <u>________________</u></p>
<p><strong>Property Address:</strong> <u>_________________________________________________________________</u></p>

<p><strong>CO-TENANT 1:</strong> <u>_________________________________</u> Phone: <u>_________________________________</u></p>
<p><strong>CO-TENANT 2:</strong> <u>_________________________________</u> Phone: <u>_________________________________</u></p>
<p><strong>CO-TENANT 3 (if applicable):</strong> <u>_________________________________</u> Phone: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. TERM</h2>
<p>This agreement covers the period from <u>________________</u> to <u>________________</u> and may be renewed by mutual consent.</p>

<h2 style="font-size: 18px;">2. RENT AND EXPENSES SPLIT</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr style="background: #f0f0f0;">
    <th style="padding: 8px; border: 1px solid #ccc;">Expense</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Total Amount</th>
    <th style="padding: 8px; border: 1px solid #ccc;">Each Tenant's Share</th>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">Monthly Rent</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">Electricity</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">Water</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">Internet</td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
    <td style="padding: 8px; border: 1px solid #ccc;"><u>________________</u></td>
  </tr>
</table>
<p>Bills paid by: <u>_________________________________</u> &nbsp; Reimbursement by: <u>_____</u> of each month</p>

<h2 style="font-size: 18px;">3. SECURITY DEPOSIT</h2>
<p>Total deposit: <u>________________</u></p>
<p>Each tenant's contribution: <u>_________________________________</u></p>
<p>Deposit held by: ☐ Landlord ☐ Lead tenant: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">4. PRIVATE ROOMS</h2>
<p>Each tenant has exclusive use of their designated room. Other tenants must knock before entering.</p>
<p>Room assignments: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">5. SHARED SPACES AND CHORES</h2>
<p>Cleaning schedule for common areas: <u>_________________________________</u></p>
<ul>
  <li>Kitchen: clean up immediately after use; shared supplies: <u>_________________________________</u></li>
  <li>Bathroom(s): <u>_________________________________</u></li>
  <li>Bins: emptied by <u>_________________________________</u> on <u>_________________________________</u></li>
</ul>

<h2 style="font-size: 18px;">6. GUESTS AND VISITORS</h2>
<p>Overnight guests allowed: ☐ Yes, max <u>_____</u> consecutive nights per month ☐ Requires group agreement</p>
<p>Parties/gatherings of more than <u>_____</u> people: requires 24 hours' notice to all roommates</p>

<h2 style="font-size: 18px;">7. QUIET HOURS AND LIFESTYLE</h2>
<p>Quiet hours: <u>________</u> to <u>________</u> on weekdays; <u>________</u> to <u>________</u> on weekends</p>
<p>Smoking: ☐ Not allowed indoors ☐ Allowed in: <u>_________________________________</u></p>
<p>Pets: ☐ Not allowed ☐ Allowed: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">8. LEAVING THE HOUSEHOLD</h2>
<p>A roommate wishing to leave must give <u>_____</u> days' notice and find a suitable replacement approved by remaining tenants and the Landlord, or continue paying their share until a replacement is found.</p>

<h2 style="font-size: 18px;">9. DISPUTE RESOLUTION</h2>
<p>Disputes will be discussed in a house meeting. If unresolved, the matter will be mediated by: <u>_________________________________</u></p>

<hr style="margin: 30px 0;"/>

<div style="margin-top: 20px;">
  <p><strong>CO-TENANT 1 SIGNATURE:</strong> <u>_________________________________</u> Date: <u>________________</u></p>
  <p><strong>CO-TENANT 2 SIGNATURE:</strong> <u>_________________________________</u> Date: <u>________________</u></p>
  <p><strong>CO-TENANT 3 SIGNATURE:</strong> <u>_________________________________</u> Date: <u>________________</u></p>
</div>
`
  },
  // ── promise / clientTemplates (3 new) ─────────────────────────────────────
  {
    id: 'promise-to-purchase-client',
    name: 'Promise to Purchase (Buyer Commitment Letter)',
    description: 'Formal buyer commitment to purchase a property under agreed conditions',
    category: 'promise',
    forRole: 'client',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">BUYER COMMITMENT LETTER</h1>
  <p style="font-style: italic;">Promise to Purchase Real Estate</p>
</div>

<p><strong>Date:</strong> <u>________________</u></p>

<p><strong>FROM (Buyer):</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>TO (Seller):</strong><br/>
Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<p>I hereby confirm my commitment to purchase the property described below under the terms set out in this letter.</p>

<h2 style="font-size: 18px;">1. PROPERTY</h2>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Title/Registry No.: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. OFFER PRICE</h2>
<p>Purchase Price: <u>________________</u> (Currency: <u>________</u>)</p>
<p>This offer is firm and not subject to further negotiation, except as noted in Section 4.</p>

<h2 style="font-size: 18px;">3. GOOD FAITH DEPOSIT</h2>
<p>I am prepared to pay a good faith deposit of <u>________________</u> within <u>_____</u> days of seller acceptance, held in escrow by <u>_________________________________</u> until closing.</p>

<h2 style="font-size: 18px;">4. CONDITIONS</h2>
<ul>
  <li>☐ Satisfactory property inspection within <u>_____</u> days</li>
  <li>☐ Financing approval within <u>_____</u> days</li>
  <li>☐ Clear title confirmation</li>
  <li>☐ Other: <u>_________________________________</u></li>
</ul>

<h2 style="font-size: 18px;">5. PROPOSED CLOSING DATE</h2>
<p><u>________________</u></p>

<h2 style="font-size: 18px;">6. VALIDITY</h2>
<p>This commitment is valid until <u>________________</u>. If not accepted by that date, it is automatically withdrawn.</p>

<hr style="margin: 30px 0;"/>

<div style="margin-top: 40px;">
  <p><strong>BUYER SIGNATURE</strong></p>
  <p style="border-bottom: 1px solid #000; height: 40px; width: 60%;"></p>
  <p>Name: <u>_________________________________</u></p>
  <p>Date: <u>_________________________________</u></p>
</div>
`
  },
  {
    id: 'payment-promise-client',
    name: 'Personal Payment Promise',
    description: 'Simple personal promise to repay money owed to another individual',
    category: 'promise',
    forRole: 'client',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">PERSONAL PAYMENT PROMISE</h1>
</div>

<p><strong>Date:</strong> <u>________________</u> &nbsp; <strong>Location:</strong> <u>_________________________________</u></p>

<p>I, <strong><u>_________________________________</u></strong> ("Promisor"), hereby acknowledge that I owe the sum of <strong><u>________________</u></strong> (Currency: <u>________</u>) to <strong><u>_________________________________</u></strong> ("Beneficiary").</p>

<h2 style="font-size: 18px;">1. REASON FOR DEBT</h2>
<p><u>_________________________________________________________________</u></p>

<h2 style="font-size: 18px;">2. PAYMENT COMMITMENT</h2>
<p>I solemnly promise to repay the above amount as follows:</p>
<p>☐ Full payment of <u>________________</u> by <u>________________</u></p>
<p>☐ Payments: <u>________________</u> per month, starting <u>________________</u>, until fully paid</p>
<p>Payment to be made via: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">3. INTEREST</h2>
<p>☐ No interest agreed &nbsp; ☐ Interest at <u>_____</u>% per month on outstanding balance</p>

<h2 style="font-size: 18px;">4. CONSEQUENCES OF NON-PAYMENT</h2>
<p>I understand that failure to honour this promise may result in legal action and that this document may be used as evidence in any dispute.</p>

<p>Witnesses to this declaration:</p>
<p>Witness 1: <u>_________________________________</u> &nbsp; Phone: <u>_________________________________</u></p>
<p>Witness 2: <u>_________________________________</u> &nbsp; Phone: <u>_________________________________</u></p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>PROMISOR SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>BENEFICIARY SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  {
    id: 'service-promise-client',
    name: 'Promise of Service / Letter of Commitment',
    description: 'Written commitment by a service provider to deliver specific services by a deadline',
    category: 'promise',
    forRole: 'client',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">PROMISE OF SERVICE / LETTER OF COMMITMENT</h1>
</div>

<p><strong>Date:</strong> <u>________________</u></p>

<p><strong>FROM (Service Provider):</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>TO (Client):</strong><br/>
Name/Company: <u>_________________________________</u><br/>
Address: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<p>This letter confirms my/our binding commitment to provide the following services:</p>

<h2 style="font-size: 18px;">1. SERVICES PROMISED</h2>
<p style="padding: 10px; border: 1px solid #ccc;"><u>_________________________________________________________________</u><br/>
<u>_________________________________________________________________</u><br/>
<u>_________________________________________________________________</u></p>

<h2 style="font-size: 18px;">2. DELIVERY TIMELINE</h2>
<p>Commencement: <u>________________</u></p>
<p>Completion Deadline: <u>________________</u></p>
<p>Key milestones:</p>
<ul>
  <li><u>________________</u> by <u>________________</u></li>
  <li><u>________________</u> by <u>________________</u></li>
</ul>

<h2 style="font-size: 18px;">3. AGREED PRICE</h2>
<p>Total Fee: <u>________________</u> &nbsp; Currency: <u>________</u></p>
<p>Payment terms: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">4. QUALITY STANDARD</h2>
<p>Services will be performed to a professional standard and comply with: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">5. CONSEQUENCES OF NON-DELIVERY</h2>
<p>If the services are not delivered by the deadline for reasons within the Provider's control, the Provider agrees to: <u>_________________________________</u></p>
<p>(e.g., refund the deposit, pay a penalty of <u>________________</u>, extend the service at no cost)</p>

<h2 style="font-size: 18px;">6. GOVERNING LAW</h2>
<p>This commitment is governed by the laws of <u>_________________________________</u>.</p>

<hr style="margin: 30px 0;"/>

<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div style="width: 45%;">
    <p><strong>PROVIDER SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
  <div style="width: 45%;">
    <p><strong>CLIENT SIGNATURE</strong></p>
    <p style="border-bottom: 1px solid #000; height: 40px;"></p>
    <p>Name: <u>_____________________</u></p>
    <p>Date: <u>_____________________</u></p>
  </div>
</div>
`
  },
  // ── rental / clientTemplates (3 new) ──────────────────────────────────────
  {
    id: 'lease-renewal-request',
    name: 'Lease Renewal Request Letter',
    description: 'Formal letter from tenant requesting renewal of an expiring lease',
    category: 'rental',
    forRole: 'client',
    content: `
<div style="text-align: right; margin-bottom: 30px;">
  <p><u>_________________________________</u></p>
  <p>(Tenant's Name)</p>
  <p><u>_________________________________</u></p>
  <p>(Tenant's Address — the rented property)</p>
  <p><u>________________</u></p>
  <p>(Date)</p>
</div>

<div style="margin-bottom: 30px;">
  <p><strong>To:</strong></p>
  <p><u>_________________________________</u></p>
  <p>(Landlord/Property Manager Name)</p>
  <p><u>_________________________________</u></p>
  <p>(Landlord's Address)</p>
</div>

<p><strong>RE: Request to Renew Lease — <u>_________________________________</u> (Property Address)</strong></p>

<hr style="margin: 20px 0;"/>

<p>Dear <u>_________________________________</u>,</p>

<p>I am writing to formally request the renewal of my lease for the above property, which is currently due to expire on <u>________________</u>.</p>

<p>I have been a tenant at this property since <u>________________</u> and have thoroughly enjoyed living here. During my tenancy I have:</p>
<ul>
  <li>Paid rent on time throughout the tenancy</li>
  <li>Maintained the property in good condition</li>
  <li>Complied with all terms of the existing lease</li>
</ul>

<p>I would like to renew my lease on the following proposed terms:</p>
<ul>
  <li><strong>New Lease Start Date:</strong> <u>________________</u></li>
  <li><strong>New Lease Duration:</strong> <u>_____</u> months / year(s)</li>
  <li><strong>Monthly Rent:</strong> <u>________________</u> (or as agreed)</li>
</ul>

<p>I am committed to continuing as a responsible and reliable tenant. If you require any updated documentation, references, or a new application, please let me know and I will provide them promptly.</p>

<p>I would appreciate your response by <u>________________</u> so that I can make alternative arrangements if necessary.</p>

<p>Please feel free to contact me at:</p>
<ul>
  <li>Phone: <u>_________________________________</u></li>
  <li>Email: <u>_________________________________</u></li>
</ul>

<p>Thank you for your consideration. I look forward to continuing our tenancy relationship.</p>

<p style="margin-top: 40px;">Sincerely,</p>

<p style="border-bottom: 1px solid #000; height: 40px; width: 40%;"></p>
<p><u>_________________________________</u></p>
<p>(Tenant's Printed Name)</p>
<p><u>_________________________________</u></p>
<p>(Date)</p>
`
  },
  {
    id: 'early-termination-letter',
    name: 'Early Lease Termination Notice',
    description: 'Formal notice from a tenant requesting early termination of a lease before its expiry date',
    category: 'rental',
    forRole: 'client',
    content: `
<div style="text-align: right; margin-bottom: 30px;">
  <p><u>_________________________________</u></p>
  <p>(Tenant's Name)</p>
  <p><u>_________________________________</u></p>
  <p>(Property Address)</p>
  <p><u>________________</u></p>
  <p>(Date)</p>
</div>

<div style="margin-bottom: 30px;">
  <p><strong>To:</strong></p>
  <p><u>_________________________________</u></p>
  <p>(Landlord / Property Manager)</p>
  <p><u>_________________________________</u></p>
  <p>(Landlord's Address)</p>
</div>

<p><strong>RE: Notice of Early Lease Termination — <u>_________________________________</u> (Property Address)</strong></p>

<hr style="margin: 20px 0;"/>

<p>Dear <u>_________________________________</u>,</p>

<p>Please accept this letter as formal written notice of my intention to terminate my lease early for the property located at <u>_________________________________________________________________</u>.</p>

<p><strong>Lease Details:</strong></p>
<ul>
  <li>Lease Start Date: <u>________________</u></li>
  <li>Lease Expiry Date: <u>________________</u></li>
  <li>Intended Vacate Date: <u>________________</u></li>
  <li>Days' Notice Given: <u>_____</u></li>
</ul>

<p><strong>Reason for Early Termination:</strong></p>
<p>☐ Relocation for employment</p>
<p>☐ Family circumstances</p>
<p>☐ Financial hardship</p>
<p>☐ Medical / health reasons</p>
<p>☐ Property conditions (describe): <u>_________________________________</u></p>
<p>☐ Other: <u>_________________________________</u></p>

<p>I understand that early termination may be subject to the terms of our lease agreement, including an early termination fee of <u>________________</u> and/or continued liability for rent until a replacement tenant is found or until the lease expiry, whichever comes first.</p>

<p>I am willing to:</p>
<ul>
  <li>☐ Assist in showing the property to prospective tenants</li>
  <li>☐ Forfeit all or part of my security deposit as agreed</li>
  <li>☐ Pay the early termination fee of <u>________________</u></li>
  <li>☐ Other arrangements: <u>_________________________________</u></li>
</ul>

<p>I will leave the property in clean and undamaged condition. Please confirm arrangements for the return of my security deposit of <u>________________</u>.</p>

<p>I can be reached at: Phone: <u>_________________________________</u> &nbsp; Email: <u>_________________________________</u></p>

<p>Thank you for your understanding.</p>

<p style="margin-top: 40px;">Sincerely,</p>

<p style="border-bottom: 1px solid #000; height: 40px; width: 40%;"></p>
<p><u>_________________________________</u></p>
<p>(Tenant's Printed Name)</p>
<p><u>_________________________________</u></p>
<p>(Date)</p>
`
  },
  {
    id: 'maintenance-request-form',
    name: 'Formal Maintenance / Repair Request',
    description: 'Formal written maintenance or repair request from tenant to landlord',
    category: 'rental',
    forRole: 'client',
    content: `
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold;">FORMAL MAINTENANCE / REPAIR REQUEST</h1>
</div>

<p><strong>Date:</strong> <u>________________</u></p>
<p><strong>Request No.:</strong> <u>________________</u> (for your records)</p>

<p><strong>FROM (Tenant):</strong><br/>
Name: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u><br/>
Unit/Room: <u>_________________________________</u></p>

<p><strong>TO (Landlord/Property Manager):</strong><br/>
Name: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>Property Address:</strong> <u>_________________________________________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. ISSUE DESCRIPTION</h2>
<p>Location in property: <u>_________________________________</u> (e.g., Kitchen, Master Bathroom, Living Room)</p>
<p>Problem description:</p>
<p style="padding: 10px; border: 1px solid #ccc; min-height: 60px;"><u>_________________________________________________________________</u><br/>
<u>_________________________________________________________________</u><br/>
<u>_________________________________________________________________</u></p>

<h2 style="font-size: 18px;">2. DATE ISSUE FIRST NOTICED</h2>
<p><u>________________</u></p>

<h2 style="font-size: 18px;">3. URGENCY LEVEL</h2>
<p>☐ <strong>Emergency</strong> — immediate risk to health/safety or major water leak (requires same-day response)</p>
<p>☐ <strong>Urgent</strong> — affecting habitability but not an emergency (within 3 days)</p>
<p>☐ <strong>Routine</strong> — non-urgent repair or cosmetic issue (within 14 days)</p>

<h2 style="font-size: 18px;">4. IMPACT ON HABITABILITY</h2>
<p>☐ No impact on daily living</p>
<p>☐ Partial impact: <u>_________________________________</u></p>
<p>☐ Property is uninhabitable until repaired because: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">5. EVIDENCE</h2>
<p>Photos/videos attached: ☐ Yes — <u>_____</u> file(s) ☐ No</p>
<p>Previous verbal report (if any): Date: <u>________________</u> &nbsp; Reported to: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">6. ACCESS FOR REPAIRS</h2>
<p>I am available for repair access on: <u>_________________________________</u></p>
<p>Preferred contact before entry: ☐ At least <u>_____</u> hours' notice by ☐ Phone ☐ SMS ☐ Email</p>
<p>☐ Landlord/agent may enter with notice even if I am not present</p>

<h2 style="font-size: 18px;">7. REQUEST FOR WRITTEN RESPONSE</h2>
<p>I request a written acknowledgment of this request within <u>_____</u> days and confirmation of the expected repair date. If repairs are not completed within a reasonable time, I reserve the right to seek remedies available under local tenancy law.</p>

<hr style="margin: 30px 0;"/>

<div style="margin-top: 40px;">
  <p><strong>TENANT SIGNATURE</strong></p>
  <p style="border-bottom: 1px solid #000; height: 40px; width: 60%;"></p>
  <p>Name: <u>_________________________________</u></p>
  <p>Date: <u>_________________________________</u></p>
</div>

<hr style="margin: 30px 0;"/>

<p><em>For Landlord/Manager use:</em></p>
<p>Received by: <u>_________________________________</u> &nbsp; Date: <u>________________</u></p>
<p>Action taken: <u>_________________________________</u></p>
<p>Scheduled repair date: <u>________________</u> &nbsp; Completed: <u>________________</u></p>
`
  },
  // ── (existing letter of intent below) ─────────────────────────────────────
  {
    id: 'intent-to-rent-letter',
    name: 'Letter of Intent to Rent',
    description: 'Formal letter expressing interest in renting a property',
    category: 'rental',
    forRole: 'client',
    content: `
<div style="text-align: right; margin-bottom: 30px;">
  <p><u>_________________________________</u></p>
  <p>(Your Address)</p>
  <p><u>________________</u></p>
  <p>(Date)</p>
</div>

<div style="margin-bottom: 30px;">
  <p><strong>To:</strong></p>
  <p><u>_________________________________</u></p>
  <p>(Landlord/Property Manager Name)</p>
  <p><u>_________________________________</u></p>
  <p>(Property Address)</p>
</div>

<p><strong>RE: Letter of Intent to Rent Property at <u>_________________________________</u></strong></p>

<hr style="margin: 20px 0;"/>

<p>Dear <u>_________________________________</u>,</p>

<p>I am writing to formally express my sincere interest in renting the property located at <u>_________________________________________________________________</u>.</p>

<p>After visiting the property on <u>________________</u>, I believe it would be an excellent fit for my needs. I am prepared to enter into a rental agreement under the following terms:</p>

<h3 style="font-size: 16px;">Proposed Terms:</h3>
<ul>
  <li><strong>Desired Move-in Date:</strong> <u>________________</u></li>
  <li><strong>Lease Duration:</strong> <u>_____</u> months</li>
  <li><strong>Monthly Rent Offered:</strong> <u>________________</u></li>
  <li><strong>Number of Occupants:</strong> <u>_____</u> adults, <u>_____</u> children</li>
  <li><strong>Pets:</strong> ☐ None ☐ Yes: <u>_________________________________</u></li>
</ul>

<h3 style="font-size: 16px;">About Me:</h3>
<p>I am a <u>_________________________________</u> (profession) currently working at <u>_________________________________</u>. I have been employed there for <u>_____</u> years with a stable monthly income of <u>________________</u>.</p>

<p>My current rental situation is <u>_________________________________</u> and my reason for seeking new accommodation is <u>_________________________________</u>.</p>

<p>I am a responsible tenant who:</p>
<ul>
  <li>Pays rent on time</li>
  <li>Maintains the property in excellent condition</li>
  <li>Respects neighbors and follows property rules</li>
  <li>Has no history of evictions or rental disputes</li>
</ul>

<h3 style="font-size: 16px;">References:</h3>
<p>I am happy to provide:</p>
<ul>
  <li>References from previous landlords</li>
  <li>Proof of employment and income</li>
  <li>Personal and professional references</li>
  <li>Background check authorization</li>
</ul>

<p>I am prepared to:</p>
<ul>
  <li>Pay the security deposit of <u>________________</u></li>
  <li>Pay <u>_____</u> month(s) rent in advance</li>
  <li>Sign a lease agreement immediately upon approval</li>
</ul>

<p>I would appreciate the opportunity to discuss this further and answer any questions you may have. I can be reached at:</p>
<ul>
  <li>Phone: <u>_________________________________</u></li>
  <li>Email: <u>_________________________________</u></li>
</ul>

<p>Thank you for considering my application. I look forward to hearing from you soon.</p>

<p style="margin-top: 40px;">Sincerely,</p>

<p style="border-bottom: 1px solid #000; height: 40px; width: 40%;"></p>
<p><u>_________________________________</u></p>
<p>(Your Name)</p>
<p><u>_________________________________</u></p>
<p>(Your Phone Number)</p>
`
  }
];

// Get all templates
export const getAllTemplates = (): ContractTemplate[] => {
  return [...ownerTemplates, ...clientTemplates];
};

// Get templates by role
export const getTemplatesByRole = (role: 'owner' | 'client'): ContractTemplate[] => {
  return getAllTemplates().filter(t => t.forRole === role || t.forRole === 'both');
};

// Get template by ID
export const getTemplateById = (id: string): ContractTemplate | undefined => {
  return getAllTemplates().find(t => t.id === id);
};


