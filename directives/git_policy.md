# OPERATIONAL SOP: Git Branch Policy

To maintain synchronization between the active session and the production `main` branch, all changes MUST be pushed to both locations simultaneously.

## 📋 The Mirror Protocol

Whenever you finish a task and are ready to commit:

1. **Commit your changes locally**
   ```bash
   git add .
   git commit -m "feat: your description"
   ```

2. **Push to both targets**
   ```bash
   # Push to the main branch
   git push origin HEAD:main
   
   # Push to the session branch
   git push origin HEAD
   ```

## ⚠️ Why this matters
- **`HEAD:main`**: Keeps the live production/main environment up to date with your improvements.
- **`HEAD`**: Keeps the specific collaboration branch in sync so stop-hooks and PR automation stay green.

Never skip either push.

---

*Last Updated: 2026-04-21*
