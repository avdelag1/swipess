# Apple Launch Checklist

This is the playbook for rotating leaked credentials and setting up the app for release on Apple's platforms.

---

## 1. Rotate the leaked keys 🔑

These were committed and live: `AuthKey_SS64MZ8TVF.p8`, `swipess.key`, `swipess.pem`, `swipess.csr`, `distribution.cer`, `KEY/KEY.JKS.txt`.

**Revoke + recreate in the dashboards:**
- **Apple `.p8` key** (`AuthKey_SS64MZ8TVF`, Key ID `SS64MZ8TVF`): Apple Developer → **Certificates, Identifiers & Profiles → Keys** → select it → **Revoke** → create a new key (you'll reuse the new one in step 3).
- **Distribution certificate** (`distribution.cer` + its private key `swipess.key`/`.pem`/`.csr`): Apple Developer → **Certificates** → revoke the distribution cert → create a new one (generate a fresh CSR from Keychain Access; never commit the `.key`).
- `KEY/KEY.JKS.txt` is empty (0 bytes) — no secret, but remove it too.

*Note: The keys have already been untracked from Git by the agent, and the removal has been committed.*

---

## 2. Supabase → Apple provider (makes Sign in with Apple work)

Supabase Dashboard → **Authentication → Providers → Apple** → enable, then in **Authorized Client IDs** add:
```
com.swipess.mobile
```
This is what makes the native `signInWithIdToken` accept the token. (If you also use **web** Apple login, fill the Services ID + Team ID + Key ID + `.p8` secret fields there too.)

---

## 3. Supabase → Edge Function secrets (for IAP validation + Apple revoke)

First create a **Sign in with Apple key**: Apple Developer → **Keys → +** → enable **"Sign in with Apple"** → download the `.p8` (one time) → note its **Key ID**.

Then Supabase Dashboard → **Project Settings → Edge Functions → Secrets** (or **Edge Functions → Manage secrets**) and add:

| Secret | Value / where to get it |
|---|---|
| `APPLE_TEAM_ID` | Apple Developer → **Membership** (10-char Team ID) |
| `APPLE_KEY_ID` | Key ID of the **new** Sign in with Apple key |
| `APPLE_PRIVATE_KEY` | full contents of the new `.p8` (paste with the `BEGIN/END` lines) |
| `APPLE_CLIENT_ID` | `com.swipess.mobile` (optional — defaults to this) |
| `APPLE_SHARED_SECRET` | App Store Connect → your app → **App-Specific Shared Secret** |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Cloud → service account JSON (Android only) |

Then deploy the functions + migration:
```bash
npx supabase db push
npx supabase functions deploy apple-link-token delete-user validate-apple-receipt validate-google-play-purchase moderate-image
```

---

## 4. App Store Connect → In-App Purchases

App Store Connect → **My Apps → Swipess → Monetization**. Create these (IDs must match **exactly**):

**Auto-Renewable Subscriptions** (group: **Swipess Plus**)
- `Swipess.plus.monthly.v3` — 1 month — $39.99
- `Swipess.plus.semestral.v3` — 6 months — $119.99
- `Swipess.plus.annual.v3` — 1 year — $299.99

**Consumables**
- `Swipess.tokens.20.v2` $9.99 · `Swipess.tokens.50.v2` $19.99 · `Swipess.tokens.100.v2` $39.99 · `Swipess.tokens.150.v2` $49.99

**Non-Renewing Subscriptions** (event promos)
- `Swipess.promo.event.week.v3` $19.99 · `.month.v3` $49.99 · `.quarter.v3` $99.99

Each needs a display name, description, price, and a review screenshot, and must be **"Ready to Submit."** Then **Agreements, Tax, and Banking → sign the Paid Applications Agreement** (products stay invisible until this is active).

---

## 5. Demo account + review notes (so the reviewer can get in)

1. In the app, create a normal **email/password account** and add a bit of activity (a listing, a like).
2. App Store Connect → your version → **App Review Information → Sign-In required** → enter that email + password.
3. In **Notes**, add: *"Location-based app — if the map/feed looks empty, search 'Tulum'. To test purchases, use a Sandbox Apple ID."*
4. App Store Connect → **Users and Access → Sandbox → Testers** → create a sandbox tester for IAP testing.

---

### Suggested order
**1 (rotate) → 2 (Apple provider) → 3 (secrets + deploy) → 4 (IAP) → 5 (demo)**, then `npx cap sync ios` → build → submit.
