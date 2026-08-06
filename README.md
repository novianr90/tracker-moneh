# Personal Expense Tracker (TrackerMoneh)

A lightweight, high-performance personal expense tracker built for private use (2 users: owner and spouse). Focuses on rapid expense entry (< 10s goal) on mobile and desktop web, backed by Supabase and reporting to Google Spreadsheet.

---

## Architecture Overview

```text
               User (Browser)
                     │
                     ▼
             SvelteKit Web App
    (SvelteKit 2 + @supabase/ssr)
                     │
                     ▼
           Supabase Platform
   ┌─────────────────────────────────┐
   │ - PostgreSQL (bigint currency)  │
   │ - Auth (@supabase/ssr Cookies)  │
   │ - RPCs & Views                  │
   │ - Row Level Security (RLS)      │
   │ - Edge Function (Sync)          │
   └────────────────┬────────────────┘
                    │ (API Key Auth)
                    ▼
        Google Apps Script Web App
                    │
                    ▼
          Google Spreadsheet
     (Reporting & Monthly Review)
```

---

## Features (MVP)

- **SSR & Cookie Authentication:** Secure auth using `@supabase/ssr` server-side session cookies & reactive SvelteKit state invalidation.
- **Rapid Expense Capture:** Add expense entries in under 10 seconds.
- **Dynamic Categories:** Custom categories with icons and color tags.
- **Dashboard:** Instant spending aggregates via server-side database RPCs and metric summary cards.
- **Google Spreadsheet Sync:** One-way manual reconciliation to Google Sheets via Supabase Edge Function & Google Apps Script Web App with API Key protection.

---

## Tech Stack

- **Frontend Framework:** [SvelteKit 2](https://kit.svelte.dev/) (Svelte 4)
- **UI Components & Styling:** Tailwind CSS, Lucide Icons
- **State & Data Fetching:** [TanStack Query (Svelte)](https://tanstack.com/query/latest)
- **Backend & Auth:** [Supabase](https://supabase.com/) (`@supabase/ssr`, PostgreSQL, RLS, Edge Functions)
- **Reporting Target:** Google Spreadsheet via Google Apps Script Web App

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
   PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
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

Detailed architectural specs and setup guidelines:

- 📋 [PRD-Personal-Expense-Tracker.md](docs/PRD-Personal-Expense-Tracker.md) — Product Requirements Document
- 📐 [TECHNICAL-SPECIFICATION.md](docs/TECHNICAL-SPECIFICATION.md) — System & Service Layer Technical Spec
- 🗄️ [DATABASE.md](docs/DATABASE.md) — PostgreSQL Schema, RLS, Views, & RPC Specs
- 🧱 [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Visual Architecture Diagrams & Data Flows
- 📁 [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) — Directory Layout & Code Responsibility Guidelines
- ⚡ [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) — Supabase CLI, Migrations, & Secrets Setup
- 📊 [SPREADSHEET.md](docs/SPREADSHEET.md) — Google Sheets & Apps Script Sync Setup Guide
- 🚀 [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Deployment Sequence & Recovery Procedures
- ⚖️ [DECISIONS.md](docs/DECISIONS.md) — Architecture Decision Records (ADRs)
