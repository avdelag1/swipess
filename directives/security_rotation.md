# SECURITY SOP: API Key Rotation

> [!CAUTION]
> Critical Vulnerability: GitHub and Minimax API keys have been exposed in the public `.env` file. These must be rotated immediately to prevent unauthorized usage and potential billing spikes.

## 📋 Steps to Rotate

### 1. GitHub Token
- Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- Locate the old token or create a new one with `repo` scope
- Delete the old token immediately
- Update `.env` with the new `GITHUB_TOKEN`

### 2. Minimax API Key
- Log in to your [Minimax Dashboard](https://www.minimaxi.com/dashboard)
- Revoke the existing key
- Generate a new key
- Update `.env` with the new `MINIMAX_API_KEY`

### 3. Environment Lockdown
- Ensure `.env` is listed in your `.gitignore`
- Use the `execution/set_secrets.py` script to update keys if deploying to Supabase Edge Functions:
  ```bash
  python execution/set_secrets.py
  ```

---

*Last Updated: 2026-04-21*
