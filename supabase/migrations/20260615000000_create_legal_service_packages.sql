-- Create table for legal service packages
CREATE TABLE IF NOT EXISTS public.legal_service_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    features TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.legal_service_packages ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow public read access on legal_service_packages"
    ON public.legal_service_packages
    FOR SELECT
    USING (true);

-- Allow admins to insert/update (assumes admin check if needed, but here we just lock it down for general public)
CREATE POLICY "Allow service role full access on legal_service_packages"
    ON public.legal_service_packages
    USING (true)
    WITH CHECK (true);

-- Insert original seed data
INSERT INTO public.legal_service_packages (id, name, category, price, duration, features) VALUES
('house-sale-standard', 'House Sale — Standard', 'house_sale', 2500, 45, ARRAY['Everything in Basic', 'Title insurance assistance', 'Negotiation support', 'Up to 3 consultations', 'Post-closing support (30 days)']),
('house-sale-premium', 'House Sale — Premium', 'house_sale', 4000, 60, ARRAY['Everything in Standard', 'Unlimited consultations (90 days)', 'Tax implications review', 'HOA document review', 'Dispute resolution coverage']),
('rental-basic', 'Rental Agreement — Basic', 'rental', 500, 7, ARRAY['Lease agreement drafting', 'Basic tenant screening review', '1 revision included']),
('rental-standard', 'Rental Agreement — Standard', 'rental', 900, 14, ARRAY['Everything in Basic', 'Move-in/out checklist', 'Addendum preparation', 'Up to 3 revisions', '30-min consultation']),
('rental-full', 'Rental Agreement — Full', 'rental', 1600, 21, ARRAY['Everything in Standard', 'Multi-unit lease package', 'Section 8 compliance review', 'Unlimited revisions (30 days)', '2 hr consultation']),
('eviction-basic', 'Eviction — Basic', 'eviction', 800, 45, ARRAY['Pay or Quit notice', 'Unlawful detainer filing', 'Court representation (1 hearing)']),
('eviction-full', 'Eviction — Full', 'eviction', 1800, 90, ARRAY['Everything in Basic', 'Full court representation', 'Writ of possession', 'Judgment recovery assistance', 'Up to 3 hearings']),
('divorce-uncontested', 'Divorce — Uncontested', 'divorce', 1200, 60, ARRAY['Divorce petition drafting', 'Marital settlement agreement', 'Property division documents', 'Court filing assistance']),
('divorce-children', 'Divorce — With Children', 'divorce', 3500, 120, ARRAY['Divorce petition', 'Custody & visitation plan', 'Child support calculation', 'Parenting agreement', '3 court hearings']),
('divorce-contested', 'Divorce — Contested', 'divorce', 5000, 180, ARRAY['Full legal representation', 'Discovery assistance', 'Mediation support', 'Child custody filing', 'Asset valuation', '5 court appearances']),
('nda', 'NDA Drafting', 'nda', 350, 3, ARRAY['Custom NDA drafting', 'Mutual or one-way options', '1 revision included']),
('business', 'Business Formation', 'business', 1000, 14, ARRAY['Entity selection consultation', 'Articles of incorporation', 'Operating agreement', 'EIN registration guidance', '1-year registered agent']),
('dispute', 'Property Dispute Resolution', 'dispute', 2000, 90, ARRAY['Case evaluation', 'Demand letter', 'Mediation representation', 'Litigation (up to 2 hearings)']),
('estate-basic', 'Estate Planning — Basic', 'estate', 800, 14, ARRAY['Simple will drafting', 'Healthcare directive', 'Power of attorney', 'Notarization assistance']),
('estate-full', 'Estate Planning — Full', 'estate', 2200, 30, ARRAY['Everything in Basic', 'Living trust setup', 'Trust funding guidance', 'Beneficiary designation review', '1-year plan review'])
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    duration = EXCLUDED.duration,
    features = EXCLUDED.features;
