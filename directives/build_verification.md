# QUALITY SOP: Build & Health Verification

Before pushing to `main`, the following checks must be performed to ensure architectural integrity.

## 📋 Verification Checklist

### 1. Static Analysis
Run the linter to catch unused variables and syntax errors:
```bash
npm run lint
```
*Goal: Zero critical errors.*

### 2. Production Build
Ensure the Vite build pipeline is healthy:
```bash
npm run build
```
*Goal: Successfully generated `dist/` folder.*

### 3. Mobile Sync (If Applicable)
If changes affect native UI:
```bash
npx cap sync
```

## 🚨 Critical Architecture Check
Ensure all **Layer 3 (Execution)** scripts are documented in a **Layer 1 (Directive)** file.
If you create a script in `execution/`, you MUST create/update a corresponding `.md` in `directives/`.

---

*Last Updated: 2026-04-21*
