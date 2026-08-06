# Visual Architecture & Data Flows

**Version:** 0.1  
**Status:** Approved Specification  
**Base Specs:** [TECHNICAL-SPECIFICATION.md](TECHNICAL-SPECIFICATION.md), [DATABASE.md](DATABASE.md), [DECISIONS.md](DECISIONS.md)

---

## 1. System Layer Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                       UI Layer                          │
│   SvelteKit Components & Pages (shadcn-svelte + Tailwind)│
└───────────┬─────────────────────────────────────────────┘
            │ Reactivity & UI State
            ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Query Layer                     │
│                     TanStack Query                      │
└───────────┬─────────────────────────────────────────────┘
            │ Centralized Service Wrapper Invocation
            ▼
┌─────────────────────────────────────────────────────────┐
│                     Service Layer                       │
│     (src/lib/services/expenses.ts, categories.ts, auth) │
└───────────┬─────────────────────────────────┬───────────┘
            │ supabase-js (JWT Header)        │ Edge Function POST
            ▼                                 ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase Backend                     │
│  - PostgreSQL (bigint Amount, Views, RPCs, RLS)        │
│  - Edge Function: sync-google-sheets                    │
└─────────────────────────────────────────────┬───────────┘
                                              │ Google Sheets API v4
                                              ▼
                                ┌─────────────────────────┐
                                │   Google Spreadsheet    │
                                └─────────────────────────┘
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as SvelteKit App
    participant Supabase as Supabase Auth
    participant DB as PostgreSQL (RLS)

    User->>App: Enter Email & Password
    App->>Supabase: signInWithPassword({ email, password })
    Supabase-->>App: Return Session JWT + Auth User Token
    App->>App: Store Session Token in LocalStorage/Cookie
    App->>DB: Fetch Dashboard Data (JWT Bearer Token)
    DB-->>App: Return User Scoped Data via RLS
    App-->>User: Render Dashboard
```

---

## 3. Expense Creation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Form as Expense Form UI
    participant Service as Expense Service (lib/services/expenses.ts)
    participant Client as Supabase Client
    participant DB as PostgreSQL
    participant Query as TanStack Query

    User->>Form: Submit Expense Entry
    Form->>Service: createExpense(payload)
    Service->>Client: supabase.from('expenses').insert(...)
    Client->>DB: SQL INSERT (RLS check: auth.uid() = user_id)
    DB-->>Client: Success (201 Created)
    Client-->>Service: Return Inserted Row
    Service-->>Query: Invalidate Query Keys ('expenses', 'dashboard')
    Query->>DB: Refetch RPC (get_monthly_summary)
    DB-->>Query: Return Updated Aggregations
    Query-->>Form: Re-render UI (< 200ms Optimistic/Cached)
```

---

## 4. Google Spreadsheet Synchronization Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as SvelteKit App
    participant Edge as Edge Function (sync-google-sheets)
    participant DB as PostgreSQL
    participant GSheets as Google Sheets API v4

    User->>App: Click "Sync to Spreadsheet"
    App->>Edge: POST /functions/v1/sync-google-sheets (Bearer JWT)
    Edge->>DB: Insert sync_logs entry (status: 'in_progress')
    Edge->>DB: Query user expenses & categories
    DB-->>Edge: Return expense dataset
    Edge->>GSheets: Read existing Sheet rows & index expense_id
    GSheets-->>Edge: Return current Sheet rows
    Edge->>Edge: Reconcile (Upsert matched IDs, Mark soft-deleted [DELETED])
    Edge->>GSheets: Batch Update values & styles
    GSheets-->>Edge: 200 OK Response
    Edge->>DB: Update sync_logs (status: 'success', synced_count: N)
    Edge-->>App: Return Sync Result Summary
    App-->>User: Display Toast Notification
```
