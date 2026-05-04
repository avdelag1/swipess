## Goal

Kill the washed-out gray look on the Share & Earn panel (and the share dialog) on both Client and Owner profile pages. Make it crisp, branded, and theme-aware so it looks beautiful on the white/light filter and equally premium on dark.

Note on links: share URLs already point to `swipess.lovable.app` from any environment (just fixed in the previous turn). When you connect your custom domain, links will automatically switch to it — no further work needed.

## Files to update

### 1. `src/components/SharedProfileSection.tsx` (the in-page Share & Earn card you screenshotted)

Replace the muted `bg-black/5` / `bg-white/[0.03]` surface with proper layered surfaces:

- **Card surface**
  - Light: pure `bg-white` + `border-slate-200` + soft slate drop shadow
  - Dark: `bg-[#0E0E10]` + `border-white/[0.06]` + deep shadow
- **Gift icon tile**: solid pink gradient (`from-[#EB4898] to-[#FF7AB6]`) with white icon and pink glow shadow — instead of the faded translucent pink
- **URL field**
  - Light: `bg-slate-50` + `border-slate-200` + `text-slate-700`
  - Dark: `bg-white/[0.04]` + `border-white/[0.08]` + `text-white/80`
  - Drop the all-caps mono treatment so the URL stays readable
- **Copy button**: switch from black/white inversion to brand `bg-primary` with `shadow-[0_14px_30px_-10px_hsl(var(--primary)/0.55)]` — single confident CTA
- **Social tiles** (Share / WhatsApp / Instagram / TikTok / X)
  - Light: white tiles with subtle slate shadow that lifts on hover (no gray fill)
  - Dark: `bg-white/[0.06]` with hover lift
  - Labels in `text-slate-700` (light) / `text-white/70` (dark) — never gray-on-gray

### 2. `src/components/ShareDialog.tsx` (the modal opened from the share button)

Same treatment:
- Replace `bg-slate-50` neutral chips with `bg-white` tiles + slate shadow in light mode so they read as elevated, not flat gray
- Promote the Copy button to brand primary instead of `bg-slate-900`
- Tighten header divider opacity so the modal feels like one piece

### 3. Quick sweep for stray gray-on-white

Grep `bg-gray-`, `bg-slate-200`, `text-gray-` usages across the share-related components and swap to either `bg-white + shadow` (elevated) or `bg-slate-50 + border-slate-200` (recessed) — never floating gray slabs.

## What stays the same

- Layout, copy ("Share & Earn", "Get free messages for referrals"), social platform set, and behaviour
- The link-generation logic (already canonical to swipess.lovable.app / custom domain)
- The pink Gift accent — kept, just made more confident

## Out of scope

- No router or sharing-logic changes
- No new dependencies
- No backend/RLS work
