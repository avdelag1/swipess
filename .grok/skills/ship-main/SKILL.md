---
name: ship-main
description: >-
  Verify, commit with conventional messages, and push Swipess to origin/main.
  Use when the user says ship, push to github, deploy web, commit and push,
  update github, or runs /ship-main.
---

# Ship to main (swipess)

## Preconditions

- Working directory: this repo (`swipess`).
- Remote: `origin` → `https://github.com/avdelag1/swipess.git`
- Default branch: `main` (no feature-branch workflow unless user asks).

## Steps

1. **Inspect**
   - `git status`
   - `git diff` and `git diff --staged`
   - `git log -5 --oneline` for message style
   - Confirm branch is `main` (or user-approved branch)

2. **Quality gates** (run what applies; skip only if change is docs-only / trivial)
   - Touched TS/TSX/JS: `npx tsc --noEmit`
   - Prefer `npm run lint` if time allows
   - Risky UI/build changes: `npm run build` (includes postbuild smoke)

3. **Stage intentionally**
   - Stage only relevant files
   - **Never** stage: `.env*`, `*.p8`, `*.key`, `*.pem`, keystores, secrets, accidental credentials

4. **Commit**
   - Conventional commit subject: `feat|fix|chore|refactor|docs|test|perf|style(scope): summary`
   - Body: complete sentences if non-obvious
   - Use a HEREDOC for the message (no interactive editor)

5. **Push**
   - `git pull --rebase origin main` if remote moved
   - `git push origin main`
   - Confirm with `git status` (clean, up to date with origin/main)

6. **Report**
   - Summarize what shipped, commit hash, and any checks skipped + why

## Failures

- Typecheck/lint/build fails → fix or ask user; do not push broken main.
- Push rejected → pull --rebase, resolve, re-run gates if needed, push again.
- Do **not** `--force` to main unless the user explicitly orders it.
