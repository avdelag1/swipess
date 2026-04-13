
What I can confirm from the current codebase
- I can see the newer unified-surface / universal-scroll edits in `AppLayout.tsx` and `DashboardLayout.tsx`, so I will not roll those back.
- I cannot verify the Git commit SHA directly in read-only mode, but I can confirm the repo currently loaded already contains the recent scroll/layout changes.
- I also found active regressions causing the broken feel you described: missing imports, bad hook ordering, wrong legal routing, mixed branding assets, nested scroll conflicts, and swipe-card motion code that is half-wired.

Plan
1. Stabilize the app so it builds and opens again
- Fix missing imports/usages: `ChevronRight`, `Gavel`, `useMotionValue`, `useTransform`, `navigate`, `DistanceSlider`.
- Fix `EnhancedOwnerDashboard` hook ordering so it stops throwing the React hooks error.
- Fix `SimpleOwnerSwipeCard` to accept the shared motion prop used by `ClientSwipeContainer`, so cards stop glitching/overlapping.
- Fix `useAiNudges` to stop calling a non-existent `addSystemMessage`.
- Fix `DigitalSignaturePad` sound call.
- Fix push notification typing safely instead of the current broken `upsert`/VAPID types.
- Fix `ClientVerificationFlow` against the real backend schema; if the verification table/fields are missing, add the minimal backend migration with proper auth-safe access.

2. Clean the shell so it feels like one page, not framed
- Keep background ownership only on the outer layout surfaces.
- Keep normal pages scrollable through the main layout container.
- Remove page-level extra `overflow-y-auto` wrappers added to dashboard roots where they break deck sizing.
- Keep profile/settings pages padded below the HUD (`pt-24`) so content clears the top controls cleanly.
- Preserve edge-to-edge feel while making the header/footer visually frame-less.

3. Rework the top HUD to match your current direction
- Remove the centered logo from `TopBar`.
- Make the top bar simpler, monochrome, and lighter visually: avatar/back on the left, actions on the right, no “brand in the middle”.
- Keep the header/footer transparent/borderless so they feel floating, not like separate bars.
- Do not bring back any deprecated orange/red “S” app branding in the shell.

4. Fix broken navigation and page meaning
- Client profile: restore full access and remove the runtime crash.
- Legal Hub: route role-specific CTA buttons to the actual lawyer flow:
  - client → `/client/legal-services`
  - owner → `/owner/legal-services`
- Leave `/legal` for terms/privacy/legal documents only, not as the main “need a lawyer” entry.
- Make owner/client profile and settings actions feel consistent and sensible.

5. Repair swipe deck behavior without breaking the mechanics
- Keep universal page scrolling, but isolate the actual swipe stage so only the card stack is non-scrolling.
- Finish wiring shared motion values for the top card / next card anticipation.
- Remove the deck overlap/mixing caused by conflicting wrapper overflow and missing motion props.
- Keep swipe physics and routing intact; this is a polish/stability pass, not a rewrite.

6. Polish chat without deleting user history
- Make the trash action delete only the selected conversation.
- Move any “clear all history” behavior behind a separate, explicit danger action/confirmation.
- Reduce the visual size of the mic/record button while keeping it usable.
- Keep existing AI conversation history intact.

7. Unify branding and loading/error states
- Replace deprecated square/logo-icon usages in placeholders, loading/error surfaces, and install UI with the approved Swipess wordmark/text treatment where appropriate.
- Audit splash/loading-related components so the app no longer feels like mixed projects stitched together.
- Tone down random pink/orange accents in shell-level UI and use a more restrained white/neutral style, while avoiding a risky full-app recolor in one pass.

8. QA pass after implementation
- Run a full build and fix any remaining type errors, including the backend function checks.
- Test these flows end-to-end: client profile, owner profile, dashboards, legal hub, chat delete-one-chat, swipe deck interactions, and long-page scrolling on mobile-sized viewport.
- Verify no header/footer frames reappear and that no old brand assets sneak back in.

Technical details I’ll use
- `ClientProfile.tsx`: missing `ChevronRight` import is the direct runtime break.
- `OwnerLawyerServices.tsx`: missing `Gavel` import is a direct compile break.
- `EnhancedOwnerDashboard.tsx`: `useCallback` is declared after conditional returns, which explains the React hooks crash.
- `ClientSwipeContainer.tsx` + `SimpleOwnerSwipeCard.tsx`: parent passes `externalX`, child does not support it yet.
- `SwipessSwipeContainer.tsx`: uses `navigate` and `DistanceSlider` without importing them.
- `usePushNotifications.ts`: current subscription writes/types are mismatched and need a proper typed shape.
- `useAiNudges.ts`: references a hook API that does not exist.
- `BottomNavigation.tsx`, `ClientProfile.tsx`, and `OwnerProfile.tsx`: “Legal Hub” currently points to generic `/legal`, which is why the experience feels wrong.
