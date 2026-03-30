
-- Seed Ezriyah Ben Derrick's expert profile
INSERT INTO public.expert_knowledge (title, category, location, website_url, instagram_handle, whatsapp, content, metadata)
VALUES (
  'Ezriyah Ben Derrick',
  'Visionary Men''s Coach & Medicine Man',
  'Tulum / Worldwide',
  'https://www.ezriyah.com',
  '@epic_ezriyah',
  '+52 984 116 6188',
  'Former radiation health physicist turned expert in fundamental masculinity, harmonious relationships, and embodied leadership. Creator of the LOCOJI Method. Offers 1:1 Mantorship, Manbodiment circles, conscious relationship coaching, workshops, and sacred medicine retreats (Iboga, Bufo, Cacao).',
  '{"keywords": ["FundamentalMasculinity", "Mantorship", "Manbodiment", "ConsciousRelationshipCoach", "TruthStructureAction", "LOCOJIMethod", "MasculineEnergy", "MensEmbodiment", "HighCalibreMan", "HarmoniousRelationships", "PsychedelicIntegration", "RitesOfPassage", "RelationshipDetox", "MasculineLeadership"], "bio_short": "Guides high-achieving men to reclaim power, release trauma & fear, build soul-deep connections, and lead with TRUTH • STRUCTURE • ACTION."}'
) ON CONFLICT (id) DO NOTHING;
