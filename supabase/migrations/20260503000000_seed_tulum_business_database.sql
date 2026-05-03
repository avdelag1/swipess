
-- =====================================================
-- MIGRATION: Tulum Business Database (Nexus 2026 Edition)
-- =====================================================

INSERT INTO public.concierge_knowledge (category, title, content, google_maps_url, phone, website_url, tags, language)
VALUES
-- RESTAURANTS & BEACH CLUBS
('Restaurant / Beach Club', 'Hartwood Tulum', 'Wood-fired Mexican (legendary). Reservations: Email exactly 1 month ahead; walk-ins possible after 3 PM.', 'Carretera Tulum-Boca Paila Km 7.6, Zona Hotelera (~8 km south of Centro)', '', 'https://www.hartwoodtulum.com', '{"@hartwoodtulum", "reservations@hartwoodtulum.com"}', 'en'),
('Restaurant / Beach Club', 'Arca Tulum', 'Contemporary Mexican / wood-fired fine dining. Book 2–3 weeks ahead via WhatsApp or email. OpenTable available.', 'Carretera Tulum-Boca Paila Km 7.6, Zona Hotelera (~8 km south of Centro)', '+52 984 177 2231', 'https://arcatulum.com', '{"@arcatulum", "contact@arcatulum.com"}', 'en'),
('Restaurant / Beach Club', 'Casa Banana', 'Argentinian steakhouse / jungle vibe. Reservations recommended.', 'Carretera Tulum-Boca Paila Km ~8, Zona Hotelera', '', '', '{"@casabananatulum"}', 'en'),
('Restaurant / Beach Club', 'Mezzanine Tulum', 'Boutique hotel + Thai restaurant (oceanfront, adults-only). Book via email or phone.', 'Km 4, Carretera Tulum-Boca Paila, Jaguar National Park', '+52 984 115 4728', 'https://mezzaninetulum.com', '{"@mezzaninetulum", "reservations.mezzanine@colibriboutiquehotels.com"}', 'en'),
('Restaurant / Beach Club', 'Cinco Tulum', 'Restaurant + Beach Club + Glamping (Jaguar Park). Email or call for tables.', 'Km 1.9, Carretera Tulum-Boca Paila, Jaguar National Park', '+52 984 202 3344', 'https://cincotulum.com', '{"@cincotulum", "hola@cincotulum.com"}', 'en'),
('Restaurant / Beach Club', 'La Eufemia', 'Beach taquería / Mexican street-food vibe. Walk-ins common; DM for groups.', 'Beachfront, south end of hotel zone', '', '', '{"@laeufemiataqueria"}', 'en'),
('Restaurant / Beach Club', 'Mi Amor', 'Hotel + Restaurant/Bar (beachfront). Email or phone for dining/hotel.', 'Km 4.1, Carretera Tulum-Boca Paila, Zona Hotelera', '+52 984 115 4728', 'https://tulumhotelmiamor.com', '{"@miamortulum", "reservations.miamor@colibriboutiquehotels.com"}', 'en'),
('Restaurant / Beach Club', 'Papaya Playa Project', 'Beach Club + Restaurant + Hotel (iconic party/relax spot). Book tables via email/WhatsApp.', 'Km 4.5, Carretera Tulum-Boca Paila', '+52 984 116 3774', 'https://www.papayaplayaproject.com', '{"@papayaplayaproject", "reservations@papayaplayaproject.com"}', 'en'),
('Restaurant / Beach Club', 'Gitano', 'Restaurant + Beach Club. Barefoot disco, gypset glamour. Email for reservations.', 'Km 7.5, Carretera Tulum-Boca Paila', '', 'https://www.gitano.com', '{"@gitano", "tulum@gitano.com"}', 'en'),
('Restaurant / Beach Club', 'Rosa Negra', 'Steakhouse / Fine dining. OpenTable or email; evenings only.', 'Carretera Tulum-Boca Paila', '+52 984 980 0725', 'https://www.rosanegra.com.mx/en/restaurantes-tulum', '{"contacto@gruporosanegra.com.mx"}', 'en'),
('Restaurant / Beach Club', 'Pancho Villa', 'Camping + Beach Club + Restaurant (Revolución Pancho Villa). Book via site.', 'Playa Paraíso area, near Tulum Ruins', '', 'https://panchovillatulum.mxhotel.site', '{"@revolucionpanchovilla"}', 'en'),
('Beach Club', 'Playa Pescadores', 'Beach Club (iconic, boat tours). Book via site or email.', 'South beach zone', '', 'https://www.playapescadorestulum.com', '{"playapescadoretulum@gmail.com"}', 'en'),

-- HOTELS
('Hotel', 'Maria del Mar Tulum', 'Boutique adults-only hotel on the beach road.', 'Km 3.5, Carretera Tulum-Boca Paila', '+52 984 745 4627', 'https://mariadelmartulum.com', '{"@mariadelmartulum", "reservations@mariadelmartulum.com"}', 'en'),
('Hotel', 'IKAL Tulum Hotel', 'Mayan sanctuary, wellness retreats and events.', 'Playa Maya / Parque Nacional El Jaguar', '+52 984 146 0349', 'https://www.ikaltulumhotel.com', '{"@ikaltulumhotel", "wellness@ikaltulumhotel.com"}', 'en'),
('Hotel', 'Sana Tulum', 'Wellness and luxury beachfront hotel.', 'Km 10, Beachfront', '+52 984 745 2107', 'https://www.sanatulum.com', '{"@sanatulum", "reservations@sanatulum.com"}', 'en'),
('Hotel', 'BE Destination Tulum (Be Tulum)', 'Eco-luxury, Mediterranean food. Mediterranean vibe.', 'Km 10, Zona Hotelera', '+52 984 980 0678', 'https://www.betulum.com', '{"@betulumhotel", "reservations@betulum.com"}', 'en'),
('Hotel', 'La Zebra Hotel', 'Family-friendly beach hotel. Salsa Sundays.', 'Km 8.2, Beachfront', '+52 984 115 4728', 'https://www.lazebratulum.com', '{"@lazebratulum"}', 'en'),
('Hotel', 'Radhoo Tulum', 'Adults-only bohemian luxury in the hotel zone.', 'Km 8.7, Zona Hotelera', '+52 984 217 5090', 'https://www.radhootulum.com', '{"concierge@radhootulum.com"}', 'en'),
('Hotel', 'Pocna', 'Beachfront hotel + Beach Club. Direct email or site.', 'Beachfront, hotel zone', '+52 984 213 4543', 'https://playapocnatulum.com', '{"reservations@playapocnatulum.com"}', 'en'),
('Hotel', 'Habitas Tulum (Our Habitas)', 'Eco-luxury hotel (adults-focused). Sustainable sanctuary.', 'Km 4.5, Av. Boca Paila, Zona Hotelera', '+52 984 401 0390', 'https://www.ourhabitas.com/tulum', '{"reservations.tulum@ourhabitas.com"}', 'en'),
('Hotel', 'Azulik', 'Luxury eco-resort + Art/Wellness. Treehouse architecture, adults-only.', 'Km 5, Carretera Tulum-Punta Allen', '+52 984 188 6192', 'https://azulik.com', '{"@azulik", "reservas@azulik.com"}', 'en'),
('Hotel', 'Dune Tulum', 'Boutique hotel + Restaurant. Sophisticated beachfront stay.', 'Beachfront, hotel zone', '+52 984 238 9529', 'https://dunehoteltulum.com', '{"reservas@dunetulum.com"}', 'en'),
('Hotel', 'Casa Malca', 'Luxury hotel with art-focused vibes. Former Escobar mansion.', 'Km 9.5, Carretera Tulum-Boca Paila', '+52 984 135 1373', 'https://casamalca.com', '{"@casamalca", "reservations@casamalca.com"}', 'en'),
('Hotel', 'Amansala', 'Yoga & Wellness eco-resort. Use contact form on site.', 'Km 5.5, Carretera Tulum-Boca Paila', '', 'https://www.amansala.com', '{"wellness"}', 'en'),
('Hotel', 'Hotelito Azul', 'Boutique beachfront hotel.', 'Km 5.8, Carretera Tulum-Boca Paila', '+52 938 164 0744', 'https://www.hotelitoazul.mx', '{"@hotelitoazul", "reservations@hotelitoazul.mx"}', 'en'),
('Hotel', 'Dos Ceibas', 'Eco-resort / Beachfront hotel on the Sian Ka’an edge.', 'Carretera Tulum-Punta Allen', '+52 984 236 7057', 'https://www.dosceibas.com', '{"info@dosceibas.com"}', 'en'),

-- COMMUNITY & EXPERIENCE
('Community / Mentorship', 'Tulum Men''s Mentorship / Circles', 'Brotherhood gatherings, personal growth circles. Rotating locations.', 'Various locations in Tulum', '', 'https://mantorship.com', '{"mentorship", "personal-growth"}', 'en'),
('Nature / Experience', 'Sian Ka’an (Siancan)', 'UNESCO Biosphere Reserve. Eco-tours, boat trips, wildlife.', 'South of Tulum (Punta Allen road)', '+52 984 236 4168', 'https://www.visitsiankaan.com', '{"eco-tours", "nature"}', 'en'),

-- HOSTELS
('Hostel', 'Straw Hat Hostel & Rooftop Bar', 'Backpacker-friendly bar with a social rooftop.', 'Avenida Tulum 89, Tulum Centro', '', '', '{"@strawhathostel"}', 'en'),
('Hostel', 'Che Tulum Hostel & Bar', 'Adults Only social hostel in Centro.', 'Tulum Centro', '', '', '{"social"}', 'en')
ON CONFLICT (id) DO NOTHING;
