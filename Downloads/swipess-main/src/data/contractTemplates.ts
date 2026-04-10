// Contract templates for owners and clients

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lease' | 'rental' | 'purchase' | 'rental_agreement' | 'service' | 'bicycle' | 'moto' | 'promise';
  forRole: 'owner' | 'client' | 'both';
  content: string;
}

// Owner Templates
export const ownerTemplates: ContractTemplate[] = [
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

<p><strong>This Rental Agreement</strong> ("Agreement") is entered into as of <u>________________</u> (the "Effective Date")</p>

<p><strong>BETWEEN:</strong></p>

<p><strong>LANDLORD:</strong><br/>
Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>TENANT:</strong><br/>
Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY DESCRIPTION</h2>
<p>The Landlord agrees to rent to the Tenant the property located at:</p>
<p style="margin-left: 20px;"><u>_________________________________________________________________</u></p>
<p>Including the following furnishings and appliances: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. TERM OF LEASE</h2>
<p>The lease term shall commence on <u>________________</u> and shall continue for a minimum period of <u>_______</u> months, ending on <u>________________</u>.</p>
<p>After the initial term, this Agreement shall continue on a month-to-month basis unless either party provides 30 days written notice of termination.</p>

<h2 style="font-size: 18px;">3. RENT PAYMENT</h2>
<p>Monthly Rent: <u>________________</u> (Currency: <u>________</u>)</p>
<p>Due Date: The <u>_____</u> day of each month</p>
<p>Payment Method: <u>_________________________________</u></p>
<p>Late Fee: A late fee of <u>________</u> shall be assessed for payments received after the <u>_____</u> day of the month.</p>

<h2 style="font-size: 18px;">4. SECURITY DEPOSIT</h2>
<p>Security Deposit Amount: <u>________________</u></p>
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

<p><strong>This Property Sale Contract</strong> ("Agreement") is made on <u>________________</u></p>

<p><strong>BETWEEN:</strong></p>

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

<h2 style="font-size: 18px;">1. PROPERTY DESCRIPTION</h2>
<p>The Seller agrees to sell and the Buyer agrees to purchase the following property:</p>
<p>Address: <u>_________________________________________________________________</u></p>
<p>Property Type: ☐ House ☐ Apartment ☐ Land ☐ Commercial ☐ Other: <u>________</u></p>
<p>Size: <u>________</u> square meters/feet</p>
<p>Property Registry Number: <u>_________________________________</u></p>

<h2 style="font-size: 18px;">2. PURCHASE PRICE AND PAYMENT</h2>
<p>Total Purchase Price: <u>________________</u> (Currency: <u>________</u>)</p>
<p>Payment Schedule:</p>
<ul>
  <li>Earnest Money Deposit: <u>________________</u> due on <u>________________</u></li>
  <li>Second Payment: <u>________________</u> due on <u>________________</u></li>
  <li>Final Payment: <u>________________</u> due at closing on <u>________________</u></li>
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

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>RENTAL COMPANY/OWNER:</strong><br/>
Name: <u>_________________________________</u><br/>
Business Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>RENTER:</strong><br/>
Name: <u>_________________________________</u><br/>
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
<p>Rental Rate: <u>________________</u> per ☐ Hour ☐ Day ☐ Week ☐ Month</p>
<p>Total Rental Fee: <u>________________</u></p>
<p>Security Deposit: <u>________________</u></p>
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

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>RENTAL COMPANY/OWNER:</strong><br/>
Name: <u>_________________________________</u><br/>
Business Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u></p>

<p><strong>RENTER:</strong><br/>
Name: <u>_________________________________</u><br/>
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

<p><strong>Agreement Date:</strong> <u>________________</u></p>

<p><strong>PROPERTY OWNER/MANAGER:</strong><br/>
Name: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<p><strong>GUEST:</strong><br/>
Name: <u>_________________________________</u><br/>
ID/Passport: <u>_________________________________</u><br/>
Address: <u>_________________________________</u><br/>
Phone: <u>_________________________________</u><br/>
Email: <u>_________________________________</u></p>

<hr style="margin: 20px 0;"/>

<h2 style="font-size: 18px;">1. PROPERTY</h2>
<p>Address: <u>_________________________________________________________________</u></p>
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
