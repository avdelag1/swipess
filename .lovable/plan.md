

## Plan: Replace Tulum Zones with "Eventos" — Full Events Discovery Hub

### What We're Building

Replace `/explore/zones` (NeighborhoodMap) with a full-screen, Instagram/TikTok-style events discovery feed. Users swipe vertically through portrait event cards. Each card shows a big hero image with overlaid title, date, location, and promo badges. Tapping opens a detail view with WhatsApp contact button. An admin panel allows publishing events.

### Database

**New table: `events`**

```sql
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'event',
  image_url text,
  image_urls jsonb DEFAULT '[]',
  event_date timestamptz,
  event_end_date timestamptz,
  location text,
  location_detail text,
  latitude double precision,
  longitude double precision,
  organizer_name text,
  organizer_photo_url text,
  organizer_whatsapp text,
  promo_text text,
  discount_tag text,
  is_free boolean DEFAULT false,
  price_text text,
  is_published boolean DEFAULT true,
  is_approved boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can read published & approved events
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT USING (is_published = true AND is_approved = true);

-- Admins (via has_role) can insert/update/delete
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

**New table: `event_favorites`**

```sql
CREATE TABLE public.event_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.event_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON public.event_favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### New Pages (3 files)

#### 1. `src/pages/EventosFeed.tsx` — Main vertical feed

- **Header**: "Eventos & Experiencias" + search icon
- **Category tabs**: horizontal scroll pills — All | Beach Clubs | Jungle & Nature | Music & Fiestas | Food & Restaurants | Promos & Discounts
- **Vertical scroll feed**: Each card is ~75vh tall portrait image with gradient overlay at bottom containing:
  - Bold title, date/time badge, location tag
  - Promo/discount badge (bright color)
  - "Free entry" or "App discount" small tag
- Infinite scroll via pagination (load 10 at a time)
- Tapping a card navigates to detail view
- Swipe-up gesture scrolls to next card (snap scrolling via CSS `scroll-snap-type: y mandatory`)

#### 2. `src/pages/EventoDetail.tsx` — Full-screen event detail

- Hero image (full-width, 50vh)
- Title + date/time + location
- Short description (2-3 lines)
- Promo highlights as bullet badges
- Organizer section (photo + name)
- Big green **"Chatea por WhatsApp"** button → `https://wa.me/{number}?text=Hola, vi tu evento en Swipess`
- Heart icon (save to favorites via `event_favorites`)
- Share button (native share API)
- Back button

#### 3. `src/pages/AdminEventos.tsx` — Admin panel (protected by role check)

- List of all events with edit/delete
- "+ Nuevo Evento" button opens form:
  - Image upload (portrait), title, date/time, location, description, promo text, category dropdown, organizer WhatsApp number, price/free toggle
- Publish toggle + approval toggle
- Only accessible to admin role users

### Route & Navigation Updates

| File | Change |
|------|--------|
| `src/App.tsx` | Replace `NeighborhoodMap` import with `EventosFeed`, add `EventoDetail` route at `/explore/eventos/:id`, add `AdminEventos` route at `/admin/eventos` |
| `src/components/ExploreFeatureLinks.tsx` | Change zones entry: icon `PartyPopper`, label `Eventos`, path `/explore/eventos` |

### Files Summary (5 new/edited)

| File | Action |
|------|--------|
| Database migration | Create `events` + `event_favorites` tables with RLS |
| `src/pages/EventosFeed.tsx` | Create — vertical scroll feed with category tabs |
| `src/pages/EventoDetail.tsx` | Create — full detail view with WhatsApp button |
| `src/pages/AdminEventos.tsx` | Create — admin CRUD panel for events |
| `src/App.tsx` | Edit — swap route, add new routes |
| `src/components/ExploreFeatureLinks.tsx` | Edit — update zones → eventos entry |

