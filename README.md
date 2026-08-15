# Personal Expense Tracker (TrackerMoneh)

A lightweight, high-performance personal expense tracker built for private use (owner and spouse). Focuses on rapid expense entry (< 10s goal) on mobile and desktop web, powered by a dedicated Fastify API Gateway, backed by Supabase PostgreSQL, synchronized with Actual Budget (Financial Ledger), and reporting to Google Spreadsheet.

---

## 🏛️ System Architecture

```text
               User (Browser / Mobile Web)
                           │
                           ▼
                 SvelteKit Frontend App
                    (tracker-moneh)
                           │
                           │  HTTP / REST (Session Cookies)
                           ▼
                  Fastify API Gateway
                    (moneh-gateway)
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
Supabase Operational Store           Actual Budget Server
 (PostgreSQL, RLS, Views, RPCs)      (System of Record / Ledger)
        │                                     │
        │ Edge Function                       │ REST / WebSocket
        ▼                                     ▼
Google Spreadsheet Reporting             Local SQLite Cache
  (Analytics & Review)               (budget.novianlabs.my.id)
```

---

## ✨ Features

- **Decoupled API Gateway:** Fastify-powered gateway encapsulates master credentials, eliminates CORS exposure, and acts as the central business logic orchestrator.
- **Saga Dual-Write & Ledger Sync:** Resilient dual-write to Supabase and Actual Budget with client-side idempotency (`idempotency_key`), automatic rollback detection, and background reconciliation.
- **Master Data Smart Sync:** One-click synchronization of Categories and Payment Methods from Actual Budget with `is_active` soft-activation/deactivation.
- **Google Spreadsheet Reporting:** Preserved one-way reconciliation to Google Sheets for monthly reviews and financial dashboards.
- **Feature Flagging (`USE_ACTUAL`):** Ability to toggle Actual Budget integration on/off seamlessly via environment variables without interrupting standalone operation.
- **Rapid Expense Capture:** Add expense entries in under 10 seconds with automatic category coloring, account selection, and quick edit.
- **Session-Based Authentication:** Secure authentication using HTTP-only cookies and route guarding.

---

## 🛠️ Tech Stack

- **Frontend Framework:** [SvelteKit 2](https://kit.svelte.dev/) (Svelte 4)
- **Styling & UI:** Tailwind CSS, Lucide Icons
- **Backend API Gateway:** [Fastify](https://fastify.dev/) (`moneh-gateway`) on Node.js 22
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, RLS, Views, RPCs)
- **Financial Ledger:** [Actual Budget](https://actualbudget.org/) (`@actual-app/api`)
- **Reporting Target:** Google Spreadsheet via Google Apps Script Web App

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 22
- npm / pnpm

### 1. Configure Environment Variables

Create `.env` inside `tracker-moneh`:
```env
PUBLIC_GATEWAY_URL=http://localhost:4000
ENABLE_SYNC=true
ENABLE_DEBUG=false
PORT=3004
```

### 2. Install Dependencies & Run Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be accessible at `http://localhost:5173` (or `http://localhost:3004` in preview/docker).

---

## 🧪 Verification & Checks

```bash
# SvelteKit sync & TypeScript diagnostics
npm run check

# Production bundle build
npm run build

# Preview production build
npm run preview
```

---

## 📚 Documentation

Detailed documentation is available in the [`docs/`](file:///D:/Code/projects/moneh/tracker-moneh/docs) directory:
- [System Architecture](file:///D:/Code/projects/moneh/tracker-moneh/docs/ARCHITECTURE.md)
- [Database Schema & Migrations](file:///D:/Code/projects/moneh/tracker-moneh/docs/DATABASE.md)
- [Deployment Guide (Coolify)](file:///D:/Code/projects/moneh/tracker-moneh/docs/DEPLOYMENT.md)
- [Project Structure](file:///D:/Code/projects/moneh/tracker-moneh/docs/PROJECT_STRUCTURE.md)
- [Architecture Decisions (ADR)](file:///D:/Code/projects/moneh/tracker-moneh/docs/DECISIONS.md)
- [Actual Budget Integration Spec](file:///D:/Code/projects/moneh/moneh-gateway/docs/ACTUAL_BUDGET_INTEGRATION.md)
