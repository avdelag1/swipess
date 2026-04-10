# Security Policy

## Reporting a Vulnerability

We take the security of SwipesS seriously. If you believe you have found a security vulnerability, please report it to us responsibly. 

**DO NOT open a public GitHub issue.** Instead, please email the details of the vulnerability to:
`security@swipess.com`

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
3. **Environment Security**: Sensitive keys like `MINIMAX_API_KEY` are stored in Supabase Secrets and never exposed to the browser.
4. **Haptic & Visual Cues**: Sensitive actions provide clear haptic and UI feedback to prevent "ghost" interactions.

---

### Key Protections
- **`nosniff`**: Prevents browser-side MIME type sniffing.
- **`SAMEORIGIN`**: Prevents clickjacking by disabling cross-origin iframe embedding.
- **`HSTS`**: Enforces HTTPS access only.

Thank you for helping us keep SwipesS secure.
