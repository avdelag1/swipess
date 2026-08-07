# Swipess — Project Rules for Grok / AI Agents

> Primary instructions for AI coding agents in this repo. Critical map/gesture rules also live in `CLAUDE.md` (do not weaken either file).

**Product:** Elite multi-vertical marketplace (properties, vehicles, services) — swipe matching, realtime messaging, Global Passport map, AI concierge.  
**Live:** https://www.swipess.com · **Repo:** `avdelag1/swipess` · **App ID:** `com.swipess.mobile`  
**Related:** Admin console at `../admin-swipess` → `avdelag1/admin-swipess`

---

## Tech stack

| Layer | Choice |
|-------|--------|
| App | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix) + Framer Motion |
| Server state | TanStack Query v5 (+ persist) |
| Client state | Zustand stores in `src/state/` |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions) |
| Maps | Mapbox GL (`PassportMapModal` + passport utils) |
| Mobile | Capacitor 7 (iOS + Android) |
| Deploy web | Vercel (`main` auto-deploys) |
| AI | Edge functions (`ai-concierge`, `ai-enhance-text`, `ai-listing-extract`, `ai-profile-extract`, `voice-transcribe`, …) |
| Forms / validation | react-hook-form + Zod |
| i18n | i18next |
| Tests | Vitest |
| Package manager | **npm** (Node 22.x, npm ≥10) — not pnpm/yarn |

**Supabase project id (prod types / link-preview):** `vplgtcguxujxwrgguxqq`

---

## Commands

```bash
npm install                 # deps (+ postinstall patches)
npm run dev                 # Vite dev server
npm run build               # production build + postbuild smoke
npm run lint                # ESLint
npm test                    # Vitest
npx tsc --noEmit            # typecheck — must be clean before commit when TS touched

# Mobile
npm run ios:sync            # build + cap sync ios + plist/version patches
npm run android:sync
npm run cap:sync

# Backend / AI
npm run deploy:ai           # deploy core AI edge functions
npm run types:prod          # regenerate Supabase TS types
npm run smoke:prod
```

Env template: `.env.example` → copy to `.env` / `.env.local` (never commit secrets).

---

## Repo layout (where to look)

| Path | Purpose |
|------|---------|
| `src/pages/` | Route-level screens |
| `src/components/` | UI (passport map, swipe, chat, listings, HUD, …) |
| `src/hooks/` | React hooks (`useAuth`, concierge, filters, …) |
| `src/state/` | Zustand stores |
| `src/integrations/supabase/` | Client + generated DB types |
| `src/utils/` | Map gestures, camera, pure helpers |
| `src/schemas/` | Zod schemas |
| `supabase/migrations/` | DB migrations (source of truth) |
| `supabase/functions/` | Edge functions (Deno) |
| `directives/` | Layer-1 SOPs (human/agent procedures) |
| `execution/` | Layer-3 deterministic scripts |
| `scripts/` | Build, iOS, smoke helpers |
| `ios/`, `android/` | Capacitor native projects |
| `vercel.json` | Deploy, CSP, bot OG rewrites |

---

## Operating principles (3-layer)

1. **Directive** (`directives/*.md`) — SOP: goals, tools, outputs, edge cases.  
2. **Orchestration** (you) — route, call tools in order, handle errors, improve directives.  
3. **Execution** (`execution/*`, `scripts/*`) — deterministic scripts; prefer these over ad-hoc one-offs.

Before inventing a new script, check `execution/` and `scripts/`. If you add a Layer-3 script, document it in a matching directive.

**Self-anneal:** fix → retest → update directive with limits/edge cases learned.

---

## Hard rules (non-negotiable)

### Git & GitHub

- Default branch is **`main`**. Ship on `main` unless the user asks for a feature branch.
- Agents may `git add`, `commit`, `pull`, `push` when the user asks to ship (see `directives/git_policy.md`).
- Use **conventional commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`.
- Prefer small, focused commits with complete sentences in the body when needed.
- **Never force-push `main`** without explicit user approval.
- **Never commit:** `.env`, `.env.local`, `*.p8`, `*.key`, `*.pem`, keystores, service-account JSON, or any secret.
- Signing / Apple keys live in **Supabase Edge secrets** (runtime) or `~/.swipess-secrets/` (local backup only). Not in the project tree.

### Quality before push

When changes are non-trivial, run what applies:

1. `npx tsc --noEmit` if TypeScript/source changed  
2. `npm run lint` if practical  
3. `npm run build` for UI/build-pipeline risk (see `directives/build_verification.md`)  
4. Touch native shell? consider `npx cap sync` / platform scripts  

### Code style

- TypeScript strict mindset; prefer explicit types on public APIs.
- Functional React components; hooks for side effects.
- Reuse existing shadcn/ui patterns under `src/components/ui/` (if present) and established motion/HUD patterns.
- Validate user input with **Zod**; sanitize HTML with **DOMPurify**.
- Theme-aware UI: do not hardcode light-only colors on shared surfaces (legal, search, sheets often break dark mode).
- Keep mobile/Capacitor in mind: safe areas, keyboard, gesture conflicts, no accidental full-page reloads on forms (Chrome/Safari).

### Security

- Client Supabase keys are **anon/publishable only**. Sensitive work goes through Edge Functions + service role secrets.
- Assume **RLS is mandatory** for new tables; never “open” policies for convenience.
- Do not log secrets, tokens, or PII in commits or console dumps.
- Report real vulns privately (`SECURITY.md`) — do not file public issues with exploit detail.

### Capacitor / iOS

- Do **not** set `limitsNavigationsToAppBoundDomains: true` in `capacitor.config.ts` (breaks Supabase/OAuth on device). See comments in that file.
- After web asset changes that must hit the app shell: rebuild + sync (`ios:sync` / `android:sync`).

### Supabase

- Schema changes → migration under `supabase/migrations/`, not ad-hoc prod edits without a migration.
- Regenerate types with `npm run types:prod` after schema changes that affect the client.
- Edge functions: Deno; deploy via `npm run deploy:ai` or targeted `npx supabase functions deploy <name>`.

---

## Protected: Global Passport map

These interactions took many iterations. **Do not “simplify” without device testing.** Full detail: `CLAUDE.md`.

| Concern | Location | Rule |
|---------|----------|------|
| Double-tap zoom | `bindMapDoubleTapZoom` + `PassportMapModal` | `pointerup` on Mapbox **canvas**, `{ capture: true }` — not container `touchend` / Mapbox `dblclick` |
| Long-press relocate | `bindMapLongPress` | Capture-phase on canvas; bubble phase breaks with double-tap `stopPropagation` |
| Cinematic open | `cinematicOpenGlide` | **Once per open session** — never second call same cycle |
| Marker style | `applyMarkerStyle` in `passportMapMarkers.ts` | Never `el.style.cssText =` (wipes Mapbox transform → pins jump top-left) |
| Marker fade-in | upsert paths | Keep opacity 0 → rAF → 1 |

**Also:** no duplicate `jumpTo` / `easeTo` / `flyTo` / `fitBounds` effects fighting in one render cycle.

---

## Product domains (mental map)

- **Discovery / swipe:** client swipe deck, filters, likes, matching hooks  
- **Listings:** property / vehicle / service forms, AI listing extract, photos  
- **Passport map:** Mapbox radar, markers, long-press relocate, city search  
- **Messaging:** realtime chat, listing/profile cards in thread  
- **Auth:** Supabase auth, Apple/Google, biometric, access codes  
- **Contracts / escrow / legal:** vaults, signing, lawyer flows  
- **AI concierge:** edge AI + voice transcribe  
- **Eventos / radio / perks:** secondary surfaces in `src/pages/`  
- **CMS preview:** `CMSPreviewListener` bridges admin console layout tweaks  

Admin CMS lives in **admin-swipess**, not this app.

---

## Sibling project

| | Path | GitHub |
|--|------|--------|
| Consumer app (this) | `.gemini/antigravity/scratch/swipess` | `avdelag1/swipess` |
| Admin console | `.gemini/antigravity/scratch/admin-swipess` | `avdelag1/admin-swipess` |

When a task spans both (e.g. CMS slider preview), keep changes coordinated and name commits clearly on each repo.

---

## What *not* to do

- Do not rewrite the map gesture system casually.  
- Do not introduce a second package manager or upgrade React/Vite major without being asked.  
- Do not commit build artifacts (`dist/`) unless the project already tracks them for a reason (it should not).  
- Do not disable RLS or widen policies “just for testing” in migrations that ship.  
- Do not put service-role keys in `VITE_*` env vars.

---

## Quick start for a new session

1. Confirm cwd is this repo root (or work relative to it).  
2. Read this file + `CLAUDE.md` if touching the map.  
3. Check `git status` / branch before editing.  
4. Prefer smallest change that ships the user’s intent.  
5. Typecheck → commit (conventional) → push `main` when asked to update GitHub.

Be pragmatic. Protect map/auth/security. Ship clean TypeScript on `main`.
