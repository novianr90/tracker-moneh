# Project Structure & Directory Guidelines

**Version:** 0.1  
**Status:** Approved Specification  
**Base Docs:** [TECHNICAL-SPECIFICATION.md](file:///D:/Code/projects/tracker-moneh/docs/TECHNICAL-SPECIFICATION.md), [README.md](file:///D:/Code/projects/tracker-moneh/README.md)

---

## 1. Directory Tree Overview

```text
tracker-moneh/
├── docs/                      # Architectural specifications & guides
├── supabase/                  # Supabase CLI configuration, migrations, & functions
│   ├── functions/             # Deno Edge Functions (sync-google-sheets)
│   ├── migrations/            # Version-controlled DDL migration files
│   └── seed.sql               # Local development seed data
├── src/
│   ├── hooks.server.ts        # Server-side auth verification & session guards
│   ├── app.d.ts               # SvelteKit global type declarations
│   ├── lib/
│   │   ├── components/        # Svelte UI components
│   │   │   ├── ui/            # shadcn-svelte atomic design primitives
│   │   │   ├── forms/         # ExpenseForm.svelte, CategoryForm.svelte
│   │   │   └── dashboard/     # SummaryCards.svelte, CategoryChart.svelte
│   │   ├── services/          # API & database service layer
│   │   │   ├── supabase.ts    # Supabase client instances (browser/server)
│   │   │   ├── expenses.ts    # Expense RPC & View query calls
│   │   │   ├── categories.ts  # Category CRUD queries
│   │   │   ├── auth.ts        # Login/Logout auth methods
│   │   │   └── sync.ts        # Edge Function caller
│   │   ├── stores/            # Client-side UI state stores
│   │   ├── types/             # TypeScript definitions
│   │   │   └── database.types.ts # Generated Supabase schema types
│   │   └── utils/             # Helper utilities (currency, date formatters)
│   └── routes/                # SvelteKit page routes & layouts
│       ├── +layout.svelte     # App shell & auth state provider
│       ├── +page.svelte       # Dashboard view
│       ├── auth/              # Login route
│       ├── expenses/          # Expense list & filter routes
│       └── categories/        # Master data management routes
```

---

## 2. Directory Responsibilities & Rules

| Directory | Primary Responsibility | What BELONGS Here | What MUST NOT Belong Here |
| :--- | :--- | :--- | :--- |
| `src/lib/components/` | Visual presentation & user interactions | Svelte components, form fields, charts, layout frames | Direct `supabase.from()` calls, complex aggregation math |
| `src/lib/services/` | API communication & data fetching | Supabase queries, RPC invokers, Edge Function callers | Component rendering logic, raw DOM manipulations |
| `src/lib/stores/` | Local UI state management | Active filters, modal dialog open states, toast queues | Server database data caching (handled by TanStack Query) |
| `src/lib/types/` | TypeScript type contracts | `database.types.ts`, form interfaces, DTO definitions | Implementations or function bodies |
| `src/lib/utils/` | Pure utility functions | Currency formatters (IDR), date formatters, validators | State mutations, API requests |
| `src/routes/` | Page routing & layout composition | SvelteKit `+page.svelte`, `+layout.svelte`, `+page.ts` | Inline SQL queries, raw business logic |

---

## 3. Strict Architectural Rules

1. **Rule 1: UI Components Never Call Supabase Directly**
   - Components MUST NOT import `supabase` client or invoke `.from('expenses')` directly.
   - All data fetching must call a function inside `src/lib/services/` (e.g. `expenseService.getMonthlySummary()`).

2. **Rule 2: Services Own All API & DB Communication**
   - `src/lib/services/` is the single source of truth for backend communication.
   - Converts raw Supabase responses into strongly typed DTOs.

3. **Rule 3: Business Logic Lives in Database or Services**
   - Math calculations, category grouping, and monthly rollups belong in PostgreSQL RPCs or service wrappers, NEVER inside Svelte components.

4. **Rule 4: Mandatory Reuse of Generated Supabase Types**
   - Always import types from `src/lib/types/database.types.ts`.
   - Never write manual duplicated interfaces for database tables or views.
