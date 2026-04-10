---
description: Turbo Development Cycle for Auditing, Fixing, and Pushing
---

// turbo-all

1. Run an audit of the current state
   - Run `npm run lint` or `npm run build` to identify issues.
2. Fix identified issues automatically
   - Based on logs, apply fixes to components or backend scripts.
3. Commit and Push changes
   - Stage all changes: `git add .`
   - Commit with a meaningful message: `git commit -m "..."`
   - Push to the current branch: `git push origin [current-branch]`
4. Create Pull Request (Optional)
   - Use `gh pr create` to wrap up.
