-- Add Tulum Centro businesses to expert knowledge
INSERT INTO public.expert_knowledge (title, category, location, instagram_handle, whatsapp, content, metadata)
VALUES
('La Mini Quinta', 'Nightlife / Party Street', 'Centro Tulum', '@laminiquinta', '', 'Famous "Calle del Terror" strip in Tulum Centro. Raw, local, and chaotic energy. The heart of the party scene in town.', '{"aka": "Calle del Terror", "vibe": "party-hard"}'),
('Santo Gordo', 'Restaurant / Bar', 'Centro (Mini Quinta)', '@santogordotulum', '', 'Solid stop on the Mini Quinta strip with great food and pre-party vibes.', '{"min_spend": "low-medium"}'),
('La Pizzina', 'Restaurant / Pre-party', 'Centro (Mini Quinta)', '', '', 'Pizza + pre-party vibes. Great place to start the night in town.', '{}'),
('La Guardia', 'Bar / Nightlife', 'Centro (Mini Quinta)', '', '', 'Another solid option on the Mini Quinta route for drinks and music.', '{}'),
('Santino', 'Club / Reggaeton', 'Centro Tulum', '@santinotulum', '', 'Classic Tulum Centro spot for reggaeton and late-night dancing.', '{"music": "reggaeton"}'),
('Strawhat', 'Bar / Hostel', 'Centro Tulum', '@strawhattulum', '', 'Backpacker-friendly bar with a lively rooftop and social atmosphere.', '{"vibe": "social"}')
ON CONFLICT DO NOTHING;
