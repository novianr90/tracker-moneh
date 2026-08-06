# Architecture Decision Records (ADR)

**Project:** Personal Expense Tracker  
**Status:** Living Document  
**Base Specs:** [PRD-Personal-Expense-Tracker.md](PRD-Personal-Expense-Tracker.md), [TECHNICAL-SPECIFICATION.md](TECHNICAL-SPECIFICATION.md)

---

## ADR-001: Use Supabase Instead of Custom Backend Server

- **Status:** Accepted
- **Context:** The application is a lightweight personal expense tracker for 2 users (owner and spouse). Building a dedicated Node.js/Go backend server introduces deployment, maintenance, and hosting overhead.
- **Decision:** Use Supabase (PostgreSQL, Auth, PostgREST, RLS, Edge Functions) as the complete backend platform.
- **Consequences:**
  - Zero backend server maintenance or infrastructure management.
  - Security model strictly relies on PostgreSQL Row Level Security (RLS).
  - Business logic is encapsulated in database RPC functions and Edge Functions.

---

## ADR-002: Select SvelteKit as Frontend Framework

- **Status:** Accepted
- **Context:** The frontend needs fast page loads, reactive UI for quick expense entry (< 10s goal), and excellent developer ergonomics on both mobile and desktop.
- **Decision:** Build the frontend application using SvelteKit with Tailwind CSS, shadcn-svelte, and TanStack Query.
- **Consequences:**
  - Minimal bundle size and high performance on mobile web.
  - Clean separation of server state (TanStack Query) and component state.
  - Native support for SSR and static adapter deployment.

---

## ADR-003: PostgreSQL as Single Source of Truth

- **Status:** Accepted
- **Context:** Data integrity and security are critical. Financial records must be strictly isolated per user and resistant to accidental overwrites.
- **Decision:** PostgreSQL database inside Supabase is the sole, authoritative Source of Truth for all expenses, categories, and audit logs.
- **Consequences:**
  - All user queries interact directly with PostgreSQL via Supabase client.
  - Reporting layers (Google Spreadsheet) act strictly as read-only or push destinations.

---

## ADR-004: Google Spreadsheet as Reporting & Reconciliation Layer

- **Status:** Accepted
- **Context:** The users prefer reviewing monthly budgets and expense totals in spreadsheet layout for manual reconciliation, while needing fast mobile entry on the web app.
- **Decision:** Treat Google Spreadsheet strictly as an asynchronous reporting destination synced from PostgreSQL via Supabase Edge Function.
- **Consequences:**
  - Web app UI stays fast and focused on rapid expense capture.
  - Spreadsheet remains accessible for custom manual formulas and monthly review.
  - One-way synchronization avoids complex bi-directional sync conflicts.

---

## ADR-005: Manual Trigger Synchronization for MVP

- **Status:** Accepted
- **Context:** Setting up automated cron infrastructure for 2 users adds initial setup complexity when spreadsheet reconciliation only happens monthly.
- **Decision:** Implement a manual "Sync to Spreadsheet" button in the web UI for MVP, while structuring Edge Functions to support future cron triggers.
- **Consequences:**
  - Zero unnecessary background execution or API quota usage.
  - Simple, predictable execution under direct user control.

---

## ADR-006: Supabase Auth with Restricted User Registration

- **Status:** Accepted
- **Context:** Application is private, strictly designed for 2 users (owner and spouse). Public sign-up creates security risks.
- **Decision:** Use Supabase Email & Password Auth with public user registration disabled in Supabase dashboard after initial user creation.
- **Consequences:**
  - Prevents unauthorized sign-ups completely.
  - Row Level Security (`auth.uid() = user_id`) isolates data between the 2 authorized users.

---

## ADR-007: Database RPC Functions for Aggregations

- **Status:** Accepted
- **Context:** Performing complex math, category percentage breakdowns, and monthly totals on client-side JS wastes mobile battery, increases payload sizes, and duplicates logic.
- **Decision:** Move all dashboard metrics and aggregated data queries into PostgreSQL Stored Procedures (RPC Functions).
- **Consequences:**
  - Frontend receives pre-calculated JSON payloads in a single network request.
  - Aggregations execute at database speed leveraging PostgreSQL indexes.
