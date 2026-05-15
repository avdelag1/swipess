# AI INSTRUCTION PROTOCOL: DO NOT REVERT

## ⚠️ CRITICAL CORE DIRECTIVES
These rules are absolute. Any AI modification that violates these rules is a regression and must be rejected.

### 1. MESSAGING SYSTEM (INSTANT-ON)
- **NO CHAT DELAYS:** The messaging interface must remain "Instant-On." Do not add loading spinners, tokens/premium overlays, or "preview" windows before opening the chat.
- **FULL-SCREEN LAYOUT:** The `/messages` route must bypass the `AppLayout` global header and bottom navigation. Do not re-add the global chrome to the messaging interface.
- **HEADER/FOOTER COMPACTION:** The chat header must remain fixed at 50px and the footer at 54px. Do not increase padding or vertical footprint.

### 2. NEXUS DESIGN LANGUAGE
- **PALETTE:** Strictly Rose (`#EB4898`), Violet (`#8B5CF6`), and Indigo (`#6366F1`). Do not use default Tailwind colors (blue-500, etc.).
- **GLASSMORPHISM:** Maintain 32px blur and 0.06 opacity borders on all primary containers.
- **ANIMATION:** Use Framer Motion for all page transitions and micro-interactions.

### 3. DATABASE INTEGRITY (SUPABASE)
- **NO SELECT *:** Always use explicit column selections.
- **ROLE PARITY:** Maintain the dual-app logic between `client` and `owner` profiles. Do not consolidate these into a single profile type.

### 4. REPOSITORY SYNC POLICY
- **NO LOCAL GIT:** Do not attempt to run manual `git` commands from the sandbox.
- **MIRROR PROTOCOL:** All changes must sync through the `.github/workflows/mirror-to-original.yml` handshake.

## 🛡️ PROTECTION LAYER
Every time you (the AI) propose a change, you MUST verify that it does not break the **Instant-On Messaging** or the **Nexus Aesthetic Unification**. If the user asks for a feature, implement it within these design constraints.
