# Repository Cleanup Checklist

## 🧹 Cleanup Tasks Completed

- ✅ Fixed README.md - removed broken links to /privacy-policy, /terms-of-service, /legal
- ✅ Updated SECURITY.md - removed exposed email, added private vulnerability reporting
- ✅ Created .npmrc - configure npm to use package-lock.json exclusively
- ✅ Updated .gitignore - consolidated lock files (pnpm-lock.yaml, bun.lock)
- ✅ Added .husky/pre-commit - prevent commits of lock files and .env
- ✅ Added .lintstagedrc.json - run linting on staged files
- ✅ Added .github/workflows/ci.yml - automated testing and build verification
- ✅ Created BRANCH_CLEANUP.md - guide for removing stale branches

## 🚨 Manual Tasks (Requires Direct Push Access)

### 1. Remove Duplicate/Stale Lock Files
```bash
git rm pnpm-lock.yaml bun.lock
git commit -m "build: remove pnpm and bun lock files, consolidate on npm"
git push origin main
```

### 2. Delete Stale Branches
See `BRANCH_CLEANUP.md` for complete list and commands.

**Priority**: Delete `master` branch first (duplicate of `main`)

### 3. Remove Obsolete Root-Level Files
Candidates for deletion (if content is properly documented elsewhere):
- `old_card.tsx` - backup/obsolete component
- `pr_body.md` - template artifact
- `deploy.ps1` - Windows deployment script (use CI/CD instead)
- `generate_icons.js` - check if scripts/generate-ios-assets.sh is sufficient

### 4. Clean Up Duplicate Documentation
Files to consolidate:
- `AGENTS.md` ✓ Keep (primary)
- `CLAUDE.md` → Delete (identical to AGENTS.md)
- `GEMINI.md` → Delete (identical to AGENTS.md)

### 5. Configure Repository Settings
In GitHub Settings:
- ✅ Set `main` as default branch
- ⏳ Enable branch protection rules for `main`
- ⏳ Enable automatic branch deletion on PR merge
- ⏳ Require status checks to pass

### 6. Code Quality Improvements
Already configured:
- ✅ ESLint with TypeScript support
- ✅ Type checking via TypeScript
- ⏳ Consider adding Prettier for consistent formatting
- ⏳ Set up code coverage reporting

## 📋 Files Created in This Audit

1. `.npmrc` - npm package manager configuration
2. `.husky/pre-commit` - git hook for pre-commit validation
3. `.lintstagedrc.json` - lint-staged configuration
4. `.github/workflows/ci.yml` - GitHub Actions CI/CD workflow
5. `BRANCH_CLEANUP.md` - guide for branch management
6. `CLEANUP_CHECKLIST.md` - this file

## 🔍 Repository Health Status

| Category | Status | Notes |
|----------|--------|-------|
| **Package Management** | ⚠️ Partial | Multiple lock files present; npm-only now recommended |
| **Code Quality** | ✅ Good | ESLint + TypeScript configured |
| **CI/CD** | ✅ New | GitHub Actions workflow added |
| **Security** | ✅ Good | RLS, Zod validation, CSP configured |
| **Documentation** | ✅ Good | README and SECURITY.md updated |
| **Branch Management** | ⚠️ Needs Work | 14 stale branches to clean up |
| **Git Hooks** | ✅ New | Pre-commit hooks configured |

## 🎯 Next Steps

1. **Immediate** (This Sprint)
   - Review and merge this audit
   - Delete `master` and duplicate lock files
   - Set up branch protection rules

2. **Short-term** (Next 2 Weeks)
   - Review stale branches and consolidate work
   - Delete obsolete branches
   - Configure automated branch cleanup

3. **Medium-term** (This Quarter)
   - Add Prettier for code formatting
   - Implement code coverage tracking
   - Set up automated dependency updates
   - Document commit message conventions

---

**Last Updated**: 2026-05-23
**Audit By**: Repository Audit & Fix
