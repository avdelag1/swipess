# Branch Cleanup Guide

## Current Branches Status

**Total Branches**: 16 (1 primary, 14 stale, 1 duplicate)

---

## 🗑️ Branches to Delete

### Tier 1: Delete Immediately (AI-Generated Experiments)

These are Claude AI-generated branches that don't belong in production:

```bash
# 3 Claude AI branches
git push origin --delete claude/glassmorphic-message-buttons-tcmy2
git push origin --delete claude/refine-header-profile-scroll-550NR
git push origin --delete claude/style-heather-buttons-zyAkD
```

### Tier 2: Delete Soon (Feature/Fix Branches)

These feature branches appear incomplete or merged. Verify content before deletion:

```bash
# Feature branches (likely merged or abandoned)
git push origin --delete feat/immersive-roommates-contrast-polish
git push origin --delete feature/photo-management-reordering

# Fix branches (9 total - all should be consolidated)
git push origin --delete fix/accessibility-contrast-step1
git push origin --delete fix/chat-send-btn-topbar-style
git push origin --delete fix/concierge-chat-icons-polish
git push origin --delete fix/concierge-chat-premium-footer
git push origin --delete fix/listing-form-ui-polish
git push origin --delete fix/roommate-refresh-loop-and-400-errors
git push origin --delete fix/scroll-all-pages
git push origin --delete fix/swipes-profile-scroll
git push origin --delete fix/ui-polish-speed
```

### Tier 3: Delete ASAP (Duplicate)

```bash
# Remove duplicate default branch - main is the actual default
git push origin --delete master
```

---

## 📋 Consolidated Deletion Script

Run all deletions at once:

```bash
#!/bin/bash
# Delete all stale branches

echo "🧹 Deleting AI-generated branches..."
git push origin --delete claude/glassmorphic-message-buttons-tcmy2 claude/refine-header-profile-scroll-550NR claude/style-heather-buttons-zyAkD

echo "🧹 Deleting feature branches..."
git push origin --delete feat/immersive-roommates-contrast-polish feature/photo-management-reordering

echo "🧹 Deleting fix branches..."
git push origin --delete \
  fix/accessibility-contrast-step1 \
  fix/chat-send-btn-topbar-style \
  fix/concierge-chat-icons-polish \
  fix/concierge-chat-premium-footer \
  fix/listing-form-ui-polish \
  fix/roommate-refresh-loop-and-400-errors \
  fix/scroll-all-pages \
  fix/swipes-profile-scroll \
  fix/ui-polish-speed

echo "🧹 Deleting duplicate master branch..."
git push origin --delete master

echo "✅ All stale branches deleted!"
```

---

## ✅ What Will Remain

After cleanup, only **1 branch** remains:
- `main` (production default branch)

### New Branching Strategy (Recommended)

Going forward, use this convention:

```
main/
├── feature/name-of-feature       (features)
├── fix/name-of-bug               (bug fixes)
├── docs/name-of-documentation    (documentation)
├── chore/name-of-chore           (maintenance)
└── refactor/name-of-refactoring  (refactoring)
```

**Rules**:
1. Never commit directly to `main`
2. Always create a feature branch
3. Use PR review before merging
4. Delete branch after merge (GitHub setting: "Automatically delete head branches")

---

## 🔒 Protect Main Branch

After cleanup, configure branch protection:

**GitHub Settings** → **Branches** → **Add Rule**:

1. ✅ Require pull request reviews before merging (1+ approval)
2. ✅ Require status checks to pass (lint, test, build)
3. ✅ Require branches to be up to date before merging
4. ✅ Require code reviews from CODEOWNERS
5. ✅ Automatically delete head branches

---

## 📊 Impact Analysis

| Metric | Before | After |
|--------|--------|-------|
| **Total Branches** | 16 | 1 |
| **Stale Branches** | 14 | 0 |
| **AI Branches** | 3 | 0 |
| **Fix Branches** | 9 | 0 |
| **Feature Branches** | 2 | 0 |
| **Duplicates** | 1 | 0 |
| **Repository Clarity** | ⚠️ Low | ✅ High |

---

## 🚀 Post-Cleanup Verification

After running the deletion script:

```bash
# List remaining branches
git branch -a

# Should only show:
# * main
#   remotes/origin/main
```

---

**Last Updated**: 2026-05-23
**Next Review**: After 1 month to ensure branching discipline is maintained
