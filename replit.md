# Swipess — Elite Tulum Marketplace

## Project Overview
Swipess is an elite multi-vertical marketplace for the Tulum area, covering:
- **Properties** — rentals and sales
- **Motorcycles & Bicycles** — vehicle listings
- **Services** — local service providers
- **Events** — local happenings (EventosFeed)

## Architecture
- **Frontend**: React 18 + Vite, TypeScript, Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Supabase (auth, PostgreSQL DB, Edge Functions)
- **State**: TanStack React Query + Zustand
- **Forms**: React Hook Form + Zod
- **Routing**: React Router DOM v6
- **i18n**: i18next / react-i18next
- **Mobile**: Capacitor (iOS + Android targets)

## Supabase Backend
- Project ID: `vplgtcguxujxwrgguxqq`
- URL: `https://vplgtcguxujxwrgguxqq.supabase.co`
- Auth: email/password + magic link + OAuth
- Roles: `client`, `owner`, `admin` (app_role enum)
- 6 Edge Functions: ai-orchestrator, ai-assistant, ai-conversation, delete-user, moderate-image, send-push-notification
- 30+ DB migrations covering profiles, listings, bookings, conversations, reviews

## Replit Environment
- **Dev server**: `npm run dev` → port 5000 (webview)
- **Workflow**: "Start application" → `npm run dev`
- **Replit DB**: Neon Postgres is provisioned and available at `DATABASE_URL` (not yet used by the app)

## Environment Variables
The app uses hardcoded Supabase fallbacks so it works out of the box. For production, set:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key (safe for frontend)

## Key Files
- `src/App.tsx` — All routes and layout
- `src/integrations/supabase/client.ts` — Supabase client configuration
- `src/integrations/supabase/types.ts` — Full DB type definitions
- `src/pages/` — All page components
- `src/components/` — Shared UI components
- `src/hooks/` — Custom hooks (auth, listings, etc.)
- `vite.config.ts` — Vite configuration

## Scripts
- `npm run dev` — Start development server on port 5000
- `npm run build` — Production build
- `npm run lint` — ESLint
