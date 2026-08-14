# Database Specification: Personal Expense Tracker

**Version:** 1.1  
**Status:** Approved Architectural Spec  
**Base Docs:** [PRD-Personal-Expense-Tracker.md](PRD-Personal-Expense-Tracker.md), [TECHNICAL-SPECIFICATION.md](TECHNICAL-SPECIFICATION.md), [DECISIONS.md](DECISIONS.md)

---

## 1. Overview

Database uses **Supabase PostgreSQL**.
Source of truth for all transactional expense data, categories, payment methods, and sync audit logs.
Security enforced via PostgreSQL **Row Level Security (RLS)** tied to Supabase Auth (`auth.users`).

> **Environment Isolation Note:**  
> Environments are separated by **distinct Supabase projects** (Development vs Production), not PostgreSQL schemas. All application tables reside in the standard `public` schema.

---

## 2. Data Type Rationale: Currency (`bigint`)

All monetary amounts (`expenses.amount`) use **`bigint`** instead of `numeric(12,2)`:

- **Target Currency:** Indonesian Rupiah (IDR).
- **No Fractional Cents:** IDR does not use decimal cents.
- **Advantages:**
  - Zero floating-point rounding or precision errors.
  - Reduced storage footprint (8 bytes per row).
  - Faster indexing and sum/aggregation performance in PostgreSQL.

---

## 3. Entity Relationship Diagram (ERD)

```text
┌─────────────────────────────────┐         ┌────────────────────────┐
│   auth.users (Supabase Auth)    │         │       categories       │
├─────────────────────────────────┤         ├────────────────────────┤
│ id (PK)                         │◄────┐   │ id (PK)                │◄────┐
│ email                           │     │   │ user_id (FK)           │───┐ │
└─────────────────────────────────┘     │   │ name                   │   │ │
                                        │   │ icon                   │   │ │
                                        │   │ color                  │   │ │
                                        │   │ is_active (boolean)    │   │ │
                                        │   │ created_at             │   │ │
                                        │   └────────────────────────┘   │ │
                                        │                                │ │
                                        │   ┌────────────────────────┐   │ │
                                        │   │    payment_methods     │   │ │
                                        │   ├────────────────────────┤   │ │
                                        ├───┤ id (PK)                │   │ │
                                        │   │ user_id (FK)           │   │ │
                                        │   │ name                   │   │ │
                                        │   │ is_active (boolean)    │   │ │
                                        │   │ created_at             │   │ │
                                        │   └────────────────────────┘   │ │
                                        │                                │ │
                                        │   ┌────────────────────────┐   │ │
                                        │   │        expenses        │   │ │
                                        │   ├────────────────────────┤   │ │
                                        ├───┤ id (PK)                │   │ │
                                        │   │ user_id (FK)           │   │ │
                                        │   │ category_id (FK)       │───┘ │
                                        │   │ amount (bigint)        │     │
                                        │   │ description            │     │
                                        │   │ expense_date           │     │
                                        │   │ payment_method         │     │
                                        │   │ is_upload (Y/N)        │     │
                                        │   │ actual_transaction_id  │     │
                                        │   │ sync_status            │     │
                                        │   │ sync_failure_type      │     │
                                        │   │ sync_error             │     │
                                        │   │ synced_at              │     │
                                        │   │ idempotency_key (UQ)   │     │
                                        │   │ created_at             │     │
                                        │   │ updated_at             │     │
                                        │   └────────────────────────┘     │
                                        │                                  │
                                        │   ┌────────────────────────┐     │
                                        │   │       sync_logs        │     │
                                        │   ├────────────────────────┤     │
                                        └───┤ user_id (FK)           │     │
                                            │ started_at             │     │
                                            │ finished_at            │     │
                                            │ status                 │     │
                                            │ synced_count           │     │
                                            │ error_message          │     │
                                            └────────────────────────┘     │
```

---

## 4. Table Definitions

### 4.1 Categories Table (`public.categories`)

```sql
create table public.categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    icon text default 'tag',
    color text default '#6b7280',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    
    constraint categories_user_id_name_key unique (user_id, name)
);
```

### 4.2 Payment Methods Table (`public.payment_methods`)

```sql
create table public.payment_methods (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),

    constraint payment_methods_user_id_name_key unique (user_id, name)
);
```

### 4.3 Expenses Table (`public.expenses`)

```sql
create table public.expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    category_id uuid not null references public.categories(id) on delete restrict,
    amount bigint not null check (amount > 0),
    description text default '',
    payment_method text default 'Cash',
    expense_date date not null default current_date,
    is_upload text not null default 'N' check (is_upload in ('Y', 'N')),
    
    -- Actual Budget Synchronization Fields
    actual_transaction_id text,
    sync_status text not null default 'PENDING' check (sync_status in ('PENDING', 'SYNCED', 'ROLLBACK_PENDING', 'SYNC_FAILED', 'RECONCILIATION_REQUIRED')),
    sync_failure_type text check (sync_failure_type in ('DEFINITE_FAILURE', 'RECONCILIATION_EXHAUSTED')),
    sync_error text,
    synced_at timestamptz,
    idempotency_key text unique,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

### 4.4 Sync Logs Table (`public.sync_logs`)

```sql
create table public.sync_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    status text not null check (status in ('in_progress', 'success', 'failed')),
    synced_count integer default 0,
    error_message text,
    created_at timestamptz not null default now()
);
```

---

## 5. Security & Views

### 5.1 `recent_expenses` View

```sql
create or replace view public.recent_expenses
with (security_invoker = true)
as
select 
    e.id,
    e.user_id,
    e.category_id,
    e.amount,
    e.description,
    e.payment_method,
    e.expense_date,
    e.is_upload,
    e.actual_transaction_id,
    e.sync_status,
    e.sync_failure_type,
    e.sync_error,
    e.synced_at,
    e.idempotency_key,
    e.created_at,
    e.updated_at,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon
from public.expenses e
left join public.categories c on e.category_id = c.id;
```
