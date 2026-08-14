# Architecture Decision Records (ADR)

**Project:** Personal Expense Tracker (TrackerMoneh)  
**Base Docs:** [PRD-Personal-Expense-Tracker.md](PRD-Personal-Expense-Tracker.md), [TECHNICAL-SPECIFICATION.md](TECHNICAL-SPECIFICATION.md), [DATABASE.md](DATABASE.md)

---

## ADR-001: Tech Stack Selection (SvelteKit 2 + Supabase)

- **Status:** Accepted
- **Context:** Need a fast, responsive mobile-friendly web application for personal expense tracking (< 10s entry goal).
- **Decision:** Use SvelteKit 2 with TypeScript, Tailwind CSS, and Supabase (PostgreSQL + Auth + Edge Functions).
- **Consequences:**
  - Fast page loads and minimal JavaScript bundle footprint.
  - Built-in authentication, PostgreSQL RLS, and serverless edge functions.

---

## ADR-002: Bigint Representation for Currency (IDR)

- **Status:** Accepted
- **Context:** Indonesian Rupiah (IDR) does not use fractional cents. Using `numeric(12,2)` or `float` introduces unnecessary rounding overhead and float precision issues.
- **Decision:** Store all expense amounts as `bigint` integers.
- **Consequences:**
  - Zero precision loss across all aggregations.
  - Faster indexing and compact storage.

---

## ADR-003: Row Level Security (RLS) for User Isolation

- **Status:** Accepted
- **Context:** The application is shared by 2 users (owner and spouse) who need isolated private records while sharing the same database infrastructure.
- **Decision:** Enforce PostgreSQL RLS on all tables where `user_id = auth.uid()`.
- **Consequences:**
  - Impossible for a user to query or mutate another user's records at the database level.

---

## ADR-004: Decoupled Google Spreadsheet Reporting Layer

- **Status:** Accepted
- **Context:** PostgreSQL is optimal for fast operational data, while Google Sheets is ideal for flexible reporting, formulas, and monthly budget reviews.
- **Decision:** Use PostgreSQL as the operational source of truth and sync to Google Sheets via Edge Functions.
- **Consequences:**
  - Fast app UI unaffected by Google API latency.
  - Spreadsheet remains accessible for manual review.

---

## ADR-005: Manual Trigger Synchronization for MVP

- **Status:** Accepted
- **Context:** Automated crons add initial operational overhead when spreadsheet reconciliation happens periodically.
- **Decision:** Implement manual trigger alongside scheduled pg_cron support.

---

## ADR-006: Supabase Auth with Restricted User Registration

- **Status:** Accepted
- **Context:** Application is private (strictly 2 users).
- **Decision:** Disable public registration in Supabase; manage users directly via dashboard or invitation.

---

## ADR-007: Database RPC Functions for Aggregations

- **Status:** Accepted
- **Context:** Aggregating monthly totals and category rollups on client-side JS wastes bandwidth and CPU.
- **Decision:** Move aggregations to PostgreSQL Stored Procedures (`get_monthly_summary`, `get_monthly_category_breakdown`).

---

## ADR-008: Payment Method & Dynamic User Wallet Management

- **Status:** Accepted
- **Context:** Need to track payment channels (Cash, QRIS, Bank, E-Wallets).
- **Decision:** Add `payment_method` tagging to `expenses` and a `payment_methods` master table.

---

## ADR-009: Interactive Daily Spending Velocity & Trend Analytics

- **Status:** Accepted
- **Context:** Monthly totals alone do not reveal daily velocity or peak spend days.
- **Decision:** Use `get_daily_expense_trends` RPC for date series and render interactive SVG charts.

---

## ADR-010: Decoupled Fastify API Gateway (`moneh-gateway`)

- **Status:** Accepted
- **Context:** Direct browser-to-Supabase connections expose Supabase publishable keys and credentials, while third-party integrations (Actual Budget SDK) cannot run in browser environments.
- **Decision:** Extract all backend communication, auth cookies, business logic, and third-party SDKs into a dedicated Fastify API Gateway (`moneh-gateway`).
- **Consequences:**
  - Zero sensitive credentials exposed on the frontend client.
  - Unified REST API surface for all frontend consumers.
  - Clean separation of concerns between UI client and backend orchestrator.

---

## ADR-011: Saga Dual-Write & Background Reconciliation for Actual Budget

- **Status:** Accepted
- **Context:** Synchronizing expense records with Actual Budget (Financial System of Record) without distributed transactions risks partial write failures, network timeouts, and ledger divergence.
- **Decision:** Implement a 4-phase Saga flow with client-side idempotency (`idempotency_key`), durable payee side-effects, state transitions (`PENDING`, `SYNCED`, `ROLLBACK_PENDING`, `SYNC_FAILED`, `RECONCILIATION_REQUIRED`), and an automated background reconciliation engine matching correlation IDs.
- **Consequences:**
  - Resilient dual-write with zero duplicate transactions in Actual Budget.
  - Transient network blips automatically self-heal via background reconciliation.

---

## ADR-012: Feature Flagging for Actual Budget (`USE_ACTUAL`)

- **Status:** Accepted
- **Context:** Deploying the gateway mid-month before transitioning financial ledger balances requires pausing Actual Budget transaction writes while keeping master data sync and Google Sheets reporting active.
- **Decision:** Introduce a lightweight environment-driven feature flag `USE_ACTUAL=false|true`.
- **Consequences:**
  - Gateway runs seamlessly in standalone mode without attempting Actual Budget ledger writes when disabled.
  - Instant zero-code activation when ready at the beginning of the month.

---

## ADR-013: Soft-Deactivation Master Data Synchronization (`is_active`)

- **Status:** Accepted
- **Context:** Deleting master categories or payment methods in Supabase when synchronizing from Actual Budget violates foreign key constraints (`on delete restrict`) on historical expenses.
- **Decision:** Add `is_active BOOLEAN NOT NULL DEFAULT true` to `categories` and `payment_methods`. When master data sync runs, items present in Actual Budget are activated (`is_active = true`), while redundant/closed items in Supabase are soft-deactivated (`is_active = false`).
- **Consequences:**
  - Historical expenses retain valid category and payment method references with zero data loss.
  - Expense entry dropdowns filter exclusively for active items.
