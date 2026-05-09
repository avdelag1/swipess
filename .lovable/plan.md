## Goal
Get the current Lovable preview version (carousel, canonical IAP product IDs, .99 pricing, iOS PayPal compliance, custom domain links) live on swipess.com via Vercel, fully synced to the original GitHub repo `avdelag1/swipess`.

## Why your Vercel site is stale
Your stack has three layers, and right now they're out of sync:

```
Lovable preview (NEW)  →  Lovable GitHub repo  →  original repo (avdelag1/swipess)  →  Vercel (OLD)
   ✅ latest                ✅ auto-synced            ❓ depends on mirror              ❌ deploying old commit
```

Vercel deploys from the **original repo**, not from Lovable directly. So the missing link is the `mirror-to-original.yml` workflow that pushes Lovable's `main` → `avdelag1/swipess`'s `main`. If that workflow isn't running (or its `MIRROR_REPO_TOKEN1` secret is missing/expired), Vercel never sees your new commits.

## Plan

### Step 1 — Publish the latest Lovable build
Click **Publish** in Lovable so the current preview becomes the head of the Lovable-connected GitHub repo. This is the source of truth for everything downstream.

### Step 2 — Verify the mirror workflow ran
Open the Lovable-connected GitHub repo → **Actions** tab → look for the most recent run of **"Mirror to original repository"**.

- ✅ Green check → code is already on `avdelag1/swipess`. Skip to Step 4.
- ❌ Red X or no run → the `MIRROR_REPO_TOKEN1` secret is missing/expired. Go to Step 3.

### Step 3 — Fix the mirror token (only if Step 2 failed)
1. GitHub → your profile → **Settings → Developer settings → Personal access tokens → Fine-grained tokens** → **Generate new token**
2. Repository access: select **both** the Lovable-connected repo and `avdelag1/swipess`
3. Permissions: **Contents: Read and Write**, **Pull requests: Read and Write**
4. Copy the token
5. In the **Lovable-connected repo** → **Settings → Secrets and variables → Actions** → add a secret named exactly `MIRROR_REPO_TOKEN1` with the token value
6. Re-run the failed mirror workflow from the Actions tab

### Step 4 — Confirm the original repo got the commit
Open `https://github.com/avdelag:wipess/swipess` (your original repo) → check the latest commit timestamp matches what you just published in Lovable.

### Step 5 — Trigger / verify the Vercel deploy
Vercel auto-deploys on push to `main` of the original repo. Open Vercel dashboard → swipess project → **Deployments** tab:

- A new "Building" or "Ready" deploy should appear within ~1 min of the mirror push.
- If nothing appears: Vercel project may be linked to the wrong repo or the wrong branch. Open Vercel → Settings → Git → confirm it points to `avdelag1/swipess` on branch `main`.
- Click **Redeploy** on the latest commit if you want to force-rebuild without code changes.

### Step 6 — Hard-refresh and verify on swipess.com
Once Vercel shows "Ready":
1. Open `https://swipess.com` in a private/incognito window (bypasses service worker + browser cache)
2. Verify: carousel cycling photos on swipe cards, .99 pricing on subscription/token modals, no PayPal buttons on iOS, canonical product IDs in IAP flow

The service worker (`sw.js`) is set to `must-revalidate`, so a normal page reload should also work after ~30 sec.

## Technical notes
- Vercel build command: `npm run build` (from `vercel.json`) — already correct
- SPA rewrites and CSP headers in `vercel.json` are unchanged, so no Vercel config edits are needed
- The mirror is `--force` push, so the original repo always tracks Lovable exactly. No merge conflicts possible.
- If you want to skip GitHub Actions entirely, an alternative is to **change Vercel's Git source** from `avdelag1/swipess` to the Lovable-connected repo directly. That eliminates the mirror dependency. I can walk you through that if Step 3 keeps failing.

## What I need from you to proceed
Tell me which of these you'd like me to do once you've published:
1. Just verify the mirror + Vercel pipeline is working (read-only checks via GitHub Actions logs)
2. Help you re-point Vercel to the Lovable repo directly (cleaner, one less moving part)
3. Both
