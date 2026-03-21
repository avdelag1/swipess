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
- Auth: email/password + magic link + OAuth (Google)
- Roles: `client`, `owner`, `admin` (app_role enum)
- 6 Edge Functions: ai-orchestrator, ai-assistant, ai-conversation, delete-user, moderate-image, send-push-notification
- 30+ DB migrations covering profiles, listings, bookings, conversations, reviews, contracts, tokens

## Replit Environment
- **Dev server**: `npm run dev` → port 5000 (webview)
- **Workflow**: "Start application" → `npm run dev`
- The app runs as a pure client-side SPA connecting to the hosted Supabase project

## Environment Variables
The app ships with hardcoded Supabase fallback credentials so it works out of the box. For production overrides, set:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key (safe for frontend)
- `VITE_VAPID_PUBLIC_KEY` — Web Push public key (optional, for push notifications)

## Key Files
- `src/App.tsx` — All routes and layout
- `src/integrations/supabase/client.ts` — Supabase client configuration
- `src/integrations/supabase/types.ts` — Full DB type definitions
- `src/pages/` — All page components
- `src/components/` — Shared UI components
- `src/hooks/` — Custom hooks (auth, listings, etc.)
- `vite.config.ts` — Vite configuration (port 5000, host 0.0.0.0, allowedHosts: true)
- `supabase/functions/` — Edge Functions (deployed to Supabase, not Replit)
- `supabase/migrations/` — Full database migration history

## Scripts
- `npm run dev` — Start development server on port 5000
- `npm run build` — Production build to dist/public
- `npm run lint` — ESLint
- `npm run test` — Vitest unit tests
