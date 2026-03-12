
Goal: fix (1) Likes pages getting “stuck” (client + owner) and (2) app launch/top bar color showing pink instead of black in installed shortcut/PWA launch.

What I found:
1) The Likes pages all use `usePersistentReorder()`. That hook currently calls `setOrderedIds(...)` on every render and always returns a new array reference, which can create a render loop on those pages.
2) Bottom nav navigation uses `startTransition(() => navigate(...))`. Under heavy continuous renders, navigation can be deprioritized and appear frozen.
3) Launch color is still pink because both manifests still have `"theme_color": "#ff69b4"`. Also native status bar fallback in `main.tsx` is currently red (`#FF0000`).

Implementation plan:

1) Stabilize Likes pages (critical)
- File: `src/hooks/usePersistentReorder.ts`
  - Add an array equality guard (`same order + same ids`) so state is only updated when order actually changes.
  - In the effect, return previous state when computed `next` matches `prev`.
  - Use a stable dependency (IDs signature) instead of raw `items` reference to avoid unnecessary effect firing.
  - In `handleReorder`, no-op if the resulting order is unchanged.

2) Make bottom-nav route changes immediate/reliable
- File: `src/components/BottomNavigation.tsx`
  - Remove `startTransition` around `navigate`.
  - Use direct `navigate(item.path!)` in pointer and keyboard handlers.
  - Keep tap animation/haptics unchanged.

3) Force black launch/status color for installed app/shortcut
- Files: `public/manifest.webmanifest`, `public/manifest.json`
  - Change `"theme_color"` to `#000000`.
  - Keep `"background_color"` as `#000000`.
- File: `index.html`
  - Keep `<meta name="theme-color" content="#000000">` (already correct).
  - Add cache-busting to manifest link (e.g. `/manifest.webmanifest?v=20260312-black`) so devices pull the updated manifest faster.
  - Set `apple-mobile-web-app-status-bar-style` to `black` for consistent black launch bar.
- File: `src/main.tsx`
  - Change native status bar background from `#FF0000` to `#000000`.

4) Regression pass (focus on what user reported)
- Client side:
  - Open `/client/liked-properties`, then navigate via bottom nav to Explore/Profile/Messages/Filters repeatedly.
  - Repeat from `/client/who-liked-you`.
- Owner side:
  - Open `/owner/liked-clients` and `/owner/interested-clients`, then navigate to Dashboard/Profile/Listings/Messages/Filters repeatedly.
- Confirm no frozen screen, no delayed route switch, and swipe nav still works where expected.
- Confirm installed shortcut/PWA launch top color is black (note: existing installed shortcut may require close/reopen; in some devices uninstall/reinstall shortcut is needed after manifest theme change).

Expected result:
- Likes pages no longer lock navigation.
- Bottom nav transitions are immediate across all sections/routes.
- Launch/top color for home-screen app opens in black instead of pink/red.
