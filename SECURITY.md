# Security Policy

## Reporting a Vulnerability

We take the security of SwipesS seriously. If you believe you have found a security vulnerability, please report it to us responsibly. 

**DO NOT open a public GitHub issue.** Instead, please email the details of the vulnerability to:
`admin@swipess.com`

We will attempt to acknowledge receipt of your report within 24 hours and will provide a timeline for resolution if the vulnerability is confirmed.

---

## Security Philosophy

- **Defense in Depth**: We implement security at the Database (RLS), Edge Function, and Client layers.
- **Zero-Trust Client Access**: The client-side Supabase keys are for public access only. All sensitive operations are handled via Supabase Edge Functions with secret verification.
- **Least Privilege**: Row Level Security (RLS) is enabled by default for all tables. Users only have access to their own data or data explicitly shared with them.

---

## Our Hardening Stack

1. **Content Security Policy**: Strictly enforced via `vercel.json` to prevent XSS and data exfiltration.
2. **Data Validation**: Every field, form, and URL parameter is validated using **Zod**.
3. **Environment Security**: Sensitive keys like `MINIMAX_API_KEY` and Apple signing material are stored in **Supabase Edge Function secrets** (or the host secret store) and never exposed to the browser or git.
4. **Haptic & Visual Cues**: Sensitive actions provide clear haptic and UI feedback to prevent "ghost" interactions.

---

## Where secrets belong (not the git repo)

| Secret | Correct home |
|--------|----------------|
| Apple AuthKey (`.p8`) / `APPLE_PRIVATE_KEY` | Supabase Dashboard → Edge Functions → Secrets (used by `delete-user` for token revoke). Optional local backup: `~/.swipess-secrets/` only on your machine. |
| `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_CLIENT_ID` | Same Supabase secrets |
| TLS / CSR material (`swipess.key`, `swipess.pem`) | Local only under `~/.swipess-secrets/` or your certificate host — **never** commit |
| AI keys (`GROQ_API_KEY`, etc.) | Supabase Edge secrets |
| `VITE_*` Supabase URL/anon | Client env / Vercel — these are **public** publishable values, not private keys |

**Hiding ≠ safe enough if a key was already pushed:** git history may still contain old blobs. Removing the file from the tree stops *new* leaks. **Rotate** (create a new key in Apple Developer, put the new value in Supabase secrets, revoke the old key) if the private key ever lived in a shared or public clone.

---

### Key Protections
- **`nosniff`**: Prevents browser-side MIME type sniffing.
- **`SAMEORIGIN`**: Prevents clickjacking by disabling cross-origin iframe embedding.
- **`HSTS`**: Enforces HTTPS access only.

Thank you for helping us keep SwipesS secure.
