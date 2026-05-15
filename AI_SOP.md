# 🛡️ SWIPESS AI OPERATIONAL PROTOCOL (SOP)

This document is the **Source of Truth** for any AI Agent working on this repository. Follow these rules to prevent breaking the production-hardened infrastructure.

## 1. Architectural Guardrails
- **Full-Screen Chat:** The Messaging Interface is designed to be immersive. It strips away all global navigation. DO NOT "fix" this by adding headers/footers back.
- **Zero-Latency Messaging:** We have removed all pre-chat overlays, premium tokens, and listing previews to ensure the chat feels native and instant.
- **Dual-App Logic:** The code handles `Owner` and `Client` roles separately. Never merge these hooks or components without an explicit architectural review.

## 2. Design "Nexus" Standards
- **Brand Colors:** 
  - Rose: `#EB4898`
  - Violet: `#8B5CF6`
  - Indigo: `#6366F1`
- **Component Policy:** Use **shadcn/ui** primitives found in `src/components/ui`. Do not install new UI libraries.

## 3. Database & Auth
- **RLS Awareness:** Always check if your query will violate Supabase Row Level Security (RLS). 
- **UUIDs:** Ensure you are passing real Backend UUIDs for `user_id` and `owner_id`. Never use mock IDs for messaging flows.

## 4. Build & Sync
- **Capacitor Integration:** This is a mobile-first app. Every change must be compatible with **Android (Gradle)** and **iOS (Xcode)**. 
- **Build Sync:** After changing any UI component, run `npm run android:sync` to verify it doesn't break the native bundle.

---
**AUTHORIZATION:** This protocol is authorized by Antigravity AI for the Swipess Team. Any deviation from these rules will be flagged as a critical regression.
