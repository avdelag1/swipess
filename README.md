# SwipesS: Elite Multi-Vertical Marketplace 🚀

[![Vercel Deployment](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://swipess.com)
[![Capacitor Mobile](https://img.shields.io/badge/Mobile-Native-blue?logo=capacitor)](https://capacitorjs.com)
[![Supabase Backend](https://img.shields.io/badge/Backend-Supabase-emerald?logo=supabase)](https://supabase.com)
[![TypeScript Mastery](https://img.shields.io/badge/TypeScript-94%25-blue?logo=typescript)](https://www.typescriptlang.org)

**SwipesS** is a high-performance, mobile-first marketplace platform designed for high-end properties, vehicle rentals (motorcycles & bicycles), and premium services. It features a "Speed of Light" PWA experience with zero-latency swipe matching, real-time messaging, and an integrated AI concierge.

---

## 💎 Core Pillars

- **Speed of Light Performance**: Sub-100ms interaction latency with aggressive asset pre-warming and GPU-accelerated transitions.
- **Sentient HUD**: A gesture-driven navigation system that anticipates user intent, providing a distraction-free immersive experience.
- **Multi-Vertical Architecture**: Seamlessly switch between Property, Vehicle, and Service discovery within a unified UI.
- **Native-Grade PWA**: Built with Capacitor for deep iOS/Android integration (Camera, Haptics, Secure Storage).

---

## 🚀 Tech Stack

### Frontend
- **Framework**: `React 18` + `TypeScript`
- **Build Tool**: `Vite` (Next-gen bundling)
- **Styling**: `Tailwind CSS` (Custom design system)
- **Animations**: `Framer Motion` (GPU-interpolated physics)
- **State Management**: `Zustand` (Global) + `TanStack Query v5` (Server)

### Backend & Infrastructure
- **BaaS**: `Supabase` (PostgreSQL, Auth, Realtime, Edge Functions)
- **Deployment**: `Vercel` (Global Edge deployment)
- **AI**: `MiniMax` (via Supabase Edge Functions)
- **Multimedia**: Integrated Radio & Streaming Visualizer

---

## 🛡️ Security & Hardening

- **Row Level Security (RLS)**: Strictly enforced at the database level. Client-side access is limited via granular policies.
- **CSP & Headers**: Hardened `Content-Security-Policy` with secure framing and cross-origin protection.
- **Data Integrity**: Runtime validation via `Zod` schemas for all API and form interactions.
- **XSS Prevention**: DOMPurify sanitization on all user-generated content.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+)
- Supabase CLI
- Capacitor CLI (for mobile builds)

### Installation
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Mobile Build
```bash
# Sync web assets to native projects
npm run cap:sync

# Open in Xcode / Android Studio
npm run ios:open
npm run android:open
```

---

## 📖 Deployment SOP

Our deployment pipeline is synchronized with the `main` branch on GitHub:
1. **Frontend**: Auto-deployed to Vercel.
2. **AI Functions**: Deploy via `npm run deploy:ai`.
3. **Database**: Managed via Supabase Migrations (`/supabase/migrations`).

---

## 📜 Legal & Compliance

Refer to our local documentation for details on:
- [Privacy Policy](/privacy-policy)
- [Terms of Service](/terms-of-service)
- [Legal Page](/legal)

---

*© 2026 SwipesS Team. Built for the future of Direct Digital Deals.*
