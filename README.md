# Personal Expense Tracker

A lightweight, high-performance personal expense tracker built for private use (2 users: owner and spouse). Focuses on rapid expense entry (< 10s goal) on mobile and desktop web, backed by Supabase and reporting to Google Spreadsheet.

---

## Architecture Overview

```text
               User (Browser)
                     │
                     ▼
             SvelteKit Web App
 (shadcn-svelte + Tailwind + TanStack Query)
                     │
                     ▼
           Supabase Platform
   ┌─────────────────────────────────┐
   │ - PostgreSQL (bigint currency)  │
   │ - Auth (Email/Password)         │
   │ - RPCs & Views                  │
   │ - Row Level Security (RLS)      │
   │ - Edge Function (Sync)          │
   └────────────────┬────────────────┘
                    │
                    ▼
          Google Spreadsheet API v4
     (Reporting & Monthly Review)
```

---

## Features (MVP)

- **Authentication:** Email & Password login via Supabase Auth (Public registration disabled).
- **Rapid Expense Capture:** Add expense entries in under 10 seconds.
- **Dynamic Categories:** Custom categories with icons and color tags.
- **Dashboard:** Instant spending aggregates via server-side database RPCs.
- **Google Spreadsheet Sync:** One-way reconciliation with soft-delete marking (`[DELETED]`).

---

## Tech Stack

- **Frontend Framework:** [SvelteKit](https://kit.svelte.dev/)
- **UI Components & Styling:** [shadcn-svelte](https://shadcn-svelte.com/), Tailwind CSS, Lucide Icons
- **State & Data Fetching:** [TanStack Query (Svelte)](https://tanstack.com/query/latest)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge Functions, RLS)
- **Reporting Target:** Google Spreadsheet API v4

---

## Non-Goals (Out of Scope for MVP)

To prevent scope creep, the MVP explicitly does **NOT** support:
- ❌ Offline mode / PWA sync
- ❌ Multi-currency conversion (IDR only)
- ❌ OCR receipt scanning
- ❌ AI automatic categorization
- ❌ Public user registration
- ❌ Shared household / multi-tenant organizations

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm / pnpm / yarn
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Installation

1. **Clone repository & install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```env
   PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ENABLE_SYNC=true
   ENABLE_DEBUG=false
   ```

3. **Supabase Local Development:**
   ```bash
   # Start local Supabase containers
   supabase start

   # Apply database migrations
   supabase db push

   # Generate TypeScript types
   supabase gen types typescript --local > src/lib/types/database.types.ts
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

## Documentation Index

Detailed architectural specs and guidelines:

- 📋 [PRD-Personal-Expense-Tracker.md](file:///D:/Code/projects/tracker-moneh/docs/PRD-Personal-Expense-Tracker.md) — Product Requirements Document
- 📐 [TECHNICAL-SPECIFICATION.md](file:///D:/Code/projects/tracker-moneh/docs/TECHNICAL-SPECIFICATION.md) — System & Service Layer Technical Spec
- 🗄️ [DATABASE.md](file:///D:/Code/projects/tracker-moneh/docs/DATABASE.md) — PostgreSQL Schema, RLS, Views, & RPC Specs
- 🧱 [ARCHITECTURE.md](file:///D:/Code/projects/tracker-moneh/docs/ARCHITECTURE.md) — Visual Architecture Diagrams & Data Flows
- 📁 [PROJECT_STRUCTURE.md](file:///D:/Code/projects/tracker-moneh/docs/PROJECT_STRUCTURE.md) — Directory Layout & Code Responsibility Guidelines
- ⚡ [SUPABASE_SETUP.md](file:///D:/Code/projects/tracker-moneh/docs/SUPABASE_SETUP.md) — Supabase CLI, Migrations, & Secrets Setup
- 🚀 [DEPLOYMENT.md](file:///D:/Code/projects/tracker-moneh/docs/DEPLOYMENT.md) — Deployment Sequence & Recovery Procedures
- ⚖️ [DECISIONS.md](file:///D:/Code/projects/tracker-moneh/docs/DECISIONS.md) — Architecture Decision Records (ADRs)
