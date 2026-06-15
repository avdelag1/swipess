export interface LegalTemplate {
  id: string;
  category: 'lease' | 'divorce' | 'promissory' | 'business';
  title: string;
  description: string;
  content: string;
}

export const LEGAL_TEMPLATES: LegalTemplate[] = [
  {
    id: 'residential-lease',
    category: 'lease',
    title: 'Residential Lease Agreement',
    description: 'Standard agreement to rent a house or apartment',
    content: `<h1>RESIDENTIAL LEASE AGREEMENT</h1>
<p><strong>This Lease Agreement</strong> ("Lease") is entered into on <strong>[DATE]</strong>, by and between:</p>
<p><strong>Landlord:</strong> [LANDLORD NAME], located at [LANDLORD ADDRESS]<br>
<strong>Tenant(s):</strong> [TENANT NAME(S)]</p>

<h2>1. Property Info</h2>
<p>Landlord agrees to rent to Tenant the property located at: <strong>[PROPERTY ADDRESS]</strong></p>

<h2>2. Term of Lease</h2>
<p>This Lease shall commence on <strong>[START DATE]</strong> and end on <strong>[END DATE]</strong>.</p>

<h2>3. Rent and Security Deposit</h2>
<ul>
  <li><strong>Rent:</strong> The monthly rent is <strong>[RENT AMOUNT]</strong>, due on the <strong>[DUE DAY]</strong> of each month.</li>
  <li><strong>Security Deposit:</strong> A security deposit of <strong>[DEPOSIT AMOUNT]</strong> is required upon signing.</li>
</ul>

<h2>4. Utilities</h2>
<p>Tenant is responsible for paying: [LIST UTILITIES, e.g., Water, Electricity, Gas, Internet].</p>

<br>
<p>___________________________<br>Landlord Signature</p>
<p>___________________________<br>Tenant Signature</p>`
  },
  {
    id: 'house-purchase',
    category: 'lease',
    title: 'House Purchase Agreement',
    description: 'Agreement for the purchase and sale of real estate',
    content: `<h1>RESIDENTIAL REAL ESTATE PURCHASE AGREEMENT</h1>
<p><strong>Date:</strong> [DATE]</p>
<p><strong>Seller:</strong> [SELLER NAME], located at [SELLER ADDRESS]<br>
<strong>Buyer:</strong> [BUYER NAME], located at [BUYER ADDRESS]</p>

<h2>1. Property</h2>
<p>The Seller agrees to sell and the Buyer agrees to buy the property located at <strong>[PROPERTY ADDRESS]</strong>.</p>

<h2>2. Purchase Price</h2>
<p>The total purchase price for the property is <strong>[TOTAL PRICE]</strong>.</p>
<ul>
  <li><strong>Earnest Money Deposit:</strong> <strong>[DEPOSIT AMOUNT]</strong> to be held in escrow.</li>
  <li><strong>Balance Due at Closing:</strong> <strong>[BALANCE AMOUNT]</strong>.</li>
</ul>

<h2>3. Closing Date</h2>
<p>This transaction will be closed on or before <strong>[CLOSING DATE]</strong>.</p>

<br>
<p>___________________________<br>Seller Signature</p>
<p>___________________________<br>Buyer Signature</p>`
  },
  {
    id: 'motorcycle-rental',
    category: 'lease',
    title: 'Motorcycle Rental Agreement',
    description: 'Contract for renting a motorcycle',
    content: `<h1>MOTORCYCLE RENTAL AGREEMENT</h1>
<p><strong>Date:</strong> [DATE]</p>
<p><strong>Owner:</strong> [OWNER NAME]<br>
<strong>Renter:</strong> [RENTER NAME]</p>

<h2>1. Vehicle Information</h2>
<ul>
  <li><strong>Make & Model:</strong> [MOTORCYCLE MAKE AND MODEL]</li>
  <li><strong>Year:</strong> [YEAR]</li>
  <li><strong>License Plate:</strong> [LICENSE PLATE NUMBER]</li>
  <li><strong>VIN:</strong> [VIN NUMBER]</li>
</ul>

<h2>2. Rental Period</h2>
<p>The rental begins on <strong>[START DATE/TIME]</strong> and ends on <strong>[END DATE/TIME]</strong>.</p>

<h2>3. Rental Rate</h2>
<p>The rental rate is <strong>[RATE AMOUNT]</strong> per day. Total cost: <strong>[TOTAL AMOUNT]</strong>.</p>

<h2>4. Condition & Liability</h2>
<p>Renter acknowledges receiving the motorcycle in good condition. Renter is liable for any damages or traffic violations incurred during the rental period.</p>

<br>
<p>___________________________<br>Owner Signature</p>
<p>___________________________<br>Renter Signature</p>`
  },
  {
    id: 'motorcycle-bill-of-sale',
    category: 'lease',
    title: 'Motorcycle Bill of Sale',
    description: 'Agreement for buying/selling a motorcycle',
    content: `<h1>MOTORCYCLE BILL OF SALE</h1>
<p><strong>Date:</strong> [DATE]</p>

<p>I, <strong>[SELLER NAME]</strong> ("Seller"), do hereby sell, transfer, and convey to <strong>[BUYER NAME]</strong> ("Buyer") the following motorcycle:</p>

<ul>
  <li><strong>Make:</strong> [MAKE]</li>
  <li><strong>Model:</strong> [MODEL]</li>
  <li><strong>Year:</strong> [YEAR]</li>
  <li><strong>VIN:</strong> [VIN NUMBER]</li>
  <li><strong>Odometer Reading:</strong> [MILEAGE]</li>
</ul>

<p>For the total sum of <strong>[SALE PRICE]</strong>, paid by [PAYMENT METHOD].</p>
<p>The Seller certifies that they are the lawful owner of this vehicle, free and clear of all liens and encumbrances. The vehicle is sold "AS IS", without any warranties.</p>

<br>
<p>___________________________<br>Seller Signature</p>
<p>___________________________<br>Buyer Signature</p>`
  },
  {
    id: 'promissory-note',
    category: 'promissory',
    title: 'Promissory Note (Pagaré)',
    description: 'Legal promise to pay a specific amount',
    content: `<h1>PROMISSORY NOTE (PAGARÉ)</h1>
<p><strong>Date:</strong> [DATE]<br><strong>Location:</strong> [CITY, STATE]</p>

<p>For value received, I, <strong>[BORROWER NAME]</strong> ("Borrower"), promise to pay to the order of <strong>[LENDER NAME]</strong> ("Lender"), the principal sum of <strong>[PRINCIPAL AMOUNT]</strong>, along with an annual interest rate of <strong>[INTEREST RATE]%</strong>.</p>

<h2>1. Payment Terms</h2>
<p>This note shall be paid in full on or before <strong>[DUE DATE]</strong>. Payment shall be made via [PAYMENT METHOD].</p>

<h2>2. Late Fees</h2>
<p>If payment is not made within [NUMBER] days of the due date, a late fee of <strong>[LATE FEE AMOUNT]</strong> will be added to the balance.</p>

<p>By signing below, the Borrower accepts the terms of this note.</p>

<br>
<p>___________________________<br>Borrower Signature</p>`
  },
  {
    id: 'divorce-settlement',
    category: 'divorce',
    title: 'Uncontested Divorce Settlement',
    description: 'Basic settlement agreement for uncontested divorce',
    content: `<h1>MARITAL SETTLEMENT AGREEMENT</h1>
<p><strong>Date:</strong> [DATE]</p>
<p>This agreement is made between <strong>[SPOUSE A NAME]</strong> and <strong>[SPOUSE B NAME]</strong>.</p>
<p>The parties were married on <strong>[DATE OF MARRIAGE]</strong> and separated on <strong>[DATE OF SEPARATION]</strong>. Irreconcilable differences have led to the breakdown of the marriage, and the parties wish to settle all matters amicably.</p>

<h2>1. Spousal Support (Alimony)</h2>
<p>[INSERT SUPPORT TERMS, e.g., Neither party shall receive spousal support / Spouse A shall pay Spouse B $X per month].</p>

<h2>2. Property Division</h2>
<p>The parties agree to divide their property as follows:</p>
<ul>
  <li><strong>To Spouse A:</strong> [LIST ASSETS]</li>
  <li><strong>To Spouse B:</strong> [LIST ASSETS]</li>
</ul>

<h2>3. Debts</h2>
<p>Each party shall be responsible for debts acquired in their individual names since the date of separation.</p>

<br>
<p>___________________________<br>Spouse A Signature</p>
<p>___________________________<br>Spouse B Signature</p>`
  }
];
