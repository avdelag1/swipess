# AI Rules for This App

## Tech stack
- React 18 + TypeScript for all application code.
- Vite is the build tool and dev server.
- React Router is used for routing, with routes defined in `src/App.tsx`.
- Tailwind CSS is the primary styling system.
- shadcn/ui is the default component library, built on top of Radix UI primitives.
- TanStack Query handles server state, caching, persistence, and async data flows.
- Supabase is the backend platform for auth, database access, storage, and edge functions.
- React Hook Form + Zod are the standard pair for forms and validation.
- Framer Motion is the default animation library for interactive motion.
- Capacitor is used for native/mobile platform features.

## Library usage rules
- Use **React + TypeScript** for all new components, hooks, pages, and utilities. Do not add plain JavaScript files for app logic unless a file is already intentionally JS-based.
- Use **React Router** for navigation and route structure. Keep top-level route declarations in `src/App.tsx`.
- Use **Tailwind CSS** for styling first. Only add or edit CSS files when global tokens, shared theme rules, or complex reusable effects cannot be expressed cleanly with utilities.
- Use **shadcn/ui** components before building custom UI from scratch. If a needed primitive already exists in `src/components/ui`, use it instead of introducing another UI library.
- Use **Radix UI** only when a lower-level accessible primitive is needed and there is no suitable existing shadcn wrapper yet.
- Use **lucide-react** for icons by default. Avoid introducing new icon sets for standard UI icons unless there is a strong visual requirement that lucide cannot cover.
- Use **TanStack Query** for anything backed by Supabase or other async remote data: fetching, caching, invalidation, optimistic updates, and persisted query state.
- Use **Zustand** only for lightweight client-side app state that does not belong in React component state or TanStack Query.
- Use **React Hook Form** for forms with multiple fields or submission flows, and pair it with **Zod** for schema validation at the form boundary.
- Use **Supabase** for authentication, database reads/writes, storage, realtime features, and edge-function-backed server logic. Do not add a parallel backend SDK unless absolutely required.
- Use **Framer Motion** for page transitions and interactive animations. Use **lottie-react** only for prebuilt JSON animation assets that are intentionally decorative.
- Use **date-fns** for date formatting and date math instead of custom date utilities.
- Use **DOMPurify** whenever rendering untrusted or user-generated HTML.
- Use **i18next / react-i18next** for user-facing text that should participate in localization.
- Use **Capacitor** APIs for native device capabilities such as camera, push notifications, haptics, keyboard, splash screen, and status bar behavior.

## Project conventions
- Put pages in `src/pages/`.
- Put reusable components in `src/components/`.
- Put hooks in `src/hooks/`.
- Put shared utilities in `src/utils/` or `src/lib/` depending on whether they are app utilities or lower-level infrastructure.
- Prefer existing project patterns over introducing new abstractions.
- Do not add new libraries if the current stack already solves the problem.
