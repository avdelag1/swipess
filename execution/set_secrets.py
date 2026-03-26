"""
Set Supabase Edge Function secrets via Management API.

Usage:
    python execution/set_secrets.py <SUPABASE_ACCESS_TOKEN>
Or:
    SUPABASE_ACCESS_TOKEN=xxx python execution/set_secrets.py

Get your access token at: https://supabase.com/dashboard/account/tokens
"""

import sys
import os
import json
import urllib.request
import urllib.error

PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "vplgtcguxujxwrgguxqq")

# Secrets to set in the Supabase Edge Functions environment.
# These are SERVER-SIDE env vars — different from the frontend VITE_* vars.
SECRETS = [
    {"name": "GEMINI_API_KEY", "value": os.environ.get("GEMINI_API_KEY", "AIzaSyDRoWrEpn4IA6LdVRBsaqldE1aAv2E9VPo")},
]


def set_secrets(token: str):
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/secrets"
    body = json.dumps(SECRETS).encode()

    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )

    print(f"[set_secrets] Setting {len(SECRETS)} secret(s) on project {PROJECT_REF}...")
    for s in SECRETS:
        print(f"  - {s['name']}")

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[set_secrets] SUCCESS — HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"[set_secrets] FAILED — HTTP {e.code}: {error_body}")
        sys.exit(1)


if __name__ == "__main__":
    token = (
        sys.argv[1]
        if len(sys.argv) > 1
        else os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    )
    if not token:
        print("ERROR: provide token as argument or SUPABASE_ACCESS_TOKEN env var")
        print("Get your token at: https://supabase.com/dashboard/account/tokens")
        sys.exit(1)
    set_secrets(token)
