"""
Deploy a Supabase Edge Function via the Management API.
Usage: python execution/deploy_edge_function.py <SUPABASE_ACCESS_TOKEN>
Or:    SUPABASE_ACCESS_TOKEN=xxx python execution/deploy_edge_function.py
"""

import sys
import os
import zipfile
import io
import json
import urllib.request
import urllib.error

PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "")
FUNCTION_SLUG = os.environ.get("SUPABASE_FUNCTION_SLUG", "ai-orchestrator")
FUNCTION_PATH = os.environ.get("SUPABASE_FUNCTION_PATH", "supabase/functions/ai-orchestrator/index.ts")

def deploy(token: str):
    # Read the function source
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    func_file = os.path.join(repo_root, FUNCTION_PATH)

    with open(func_file, "r") as f:
        source = f.read()

    print(f"[deploy] Read {len(source)} chars from {FUNCTION_PATH}")

    # Create a zip archive in memory
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("index.ts", source)
    zip_bytes = buf.getvalue()

    print(f"[deploy] Created zip ({len(zip_bytes)} bytes)")

    # Build multipart form body
    boundary = "----FormBoundary7MA4YWxkTrZu0gW"
    body_parts = []

    # Metadata part
    metadata = json.dumps({
        "entrypoint_path": "index.ts",
        "import_map": False,
        "verify_jwt": False,
    })
    body_parts.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="metadata"\r\n'
        f"Content-Type: application/json\r\n\r\n"
        f"{metadata}\r\n"
    )

    # File part
    body_parts.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="index.ts.zip"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n"
    )

    body = b"".join(p.encode() if isinstance(p, str) else p for p in body_parts)
    body += zip_bytes
    body += f"\r\n--{boundary}--\r\n".encode()

    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/functions/{FUNCTION_SLUG}"

    req = urllib.request.Request(
        url,
        data=body,
        method="PATCH",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )

    print(f"[deploy] Sending PATCH to {url} ...")
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            response_body = resp.read().decode()
            print(f"[deploy] SUCCESS — HTTP {status}")
            print(f"[deploy] Response: {response_body[:500]}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"[deploy] FAILED — HTTP {e.code}: {error_body}")
        sys.exit(1)

if __name__ == "__main__":
    token = (
        sys.argv[1]
        if len(sys.argv) > 1
        else os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    )
    if not token:
        print("ERROR: provide token as argument or SUPABASE_ACCESS_TOKEN env var")
        sys.exit(1)
    if not PROJECT_REF:
        print("ERROR: set SUPABASE_PROJECT_REF env var to your Supabase project reference ID")
        sys.exit(1)
    deploy(token)
