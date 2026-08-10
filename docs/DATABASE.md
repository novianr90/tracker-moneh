# Database Specification: Personal Expense Tracker

**Version:** 0.4  
**Status:** Approved Architectural Spec  
**Base Docs:** [PRD-Personal-Expense-Tracker.md](PRD-Personal-Expense-Tracker.md), [TECHNICAL-SPECIFICATION.md](TECHNICAL-SPECIFICATION.md), [DECISIONS.md](DECISIONS.md)

---

## 1. Overview

Database uses **Supabase PostgreSQL**.
Source of truth for all transactional expense data, categories, and sync audit logs.
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

> **Note:** `auth.users` is a built-in schema provided and managed directly by Supabase Auth. It is referenced here for Foreign Key mapping and RLS logic.

```text
┌─────────────────────────────────┐         ┌────────────────────────┐
│   auth.users (Supabase Auth)    │         │       categories       │
├─────────────────────────────────┤         ├────────────────────────┤
│ id (PK)                         │◄────┐   │ id (PK)                │◄────┐
│ email                           │     │   │ user_id (FK)           │───┐ │
└─────────────────────────────────┘     │   │ name                   │   │ │
                                        │   │ icon                   │   │ │
                                        │   │ color                  │   │ │
                                        │   │ created_at             │   │ │
                                        │   └────────────────────────┘   │ │
                                        │                                │ │
                                        │   ┌────────────────────────┐   │ │
                                        │   │        expenses        │   │ │
                                        │   ├────────────────────────┤   │ │
                                        ├───┤ user_id (FK)           │   │ │
                                        │   │ category_id (FK)       │───┘ │
                                        │   │ amount (bigint)        │     │
                                        │   │ description            │     │
                                        │   │ expense_date           │     │
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

## 4. DDL Scripts

### 4.1 Extensions

```sql
create extension if not exists "uuid-ossp";
```

### 4.2 Categories Table

```sql
create table public.categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    icon text default 'tag',
    color text default '#6b7280',
    created_at timestamptz not null default now(),
    
    constraint categories_user_id_name_key unique (user_id, name)
);

comment on table public.categories is 'Master data categories created by users';
```

### 4.3 Expenses Table

```sql
create table public.expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    category_id uuid not null references public.categories(id) on delete restrict,
    amount bigint not null check (amount > 0),
    description text default '',
    payment_method text default 'Cash',
    expense_date date not null default current_date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.expenses is 'Personal transaction logs stored in IDR (bigint)';
```

### 4.4 Sync Logs Table

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

comment on table public.sync_logs is 'Audit and execution log for Google Sheets sync (30-day retention)';
```

---

## 5. Indexes

```sql
-- Category query optimization
create index idx_categories_user on public.categories (user_id);

-- Expense dashboard & filtering optimization
create index idx_expenses_user_date on public.expenses (user_id, expense_date desc);
create index idx_expenses_category on public.expenses (category_id);

-- Sync log user lookup optimization
create index idx_sync_logs_user_started on public.sync_logs (user_id, started_at desc);
```

---

## 6. Triggers & Functions

### 6.1 Updated At Trigger

```sql
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_expenses_updated_at
    before update on public.expenses
    for each row
    execute function public.update_updated_at_column();
```

### 6.2 Auto-Provision Default Categories on Registration & Failure Behavior

```sql
create or replace function public.handle_new_user_categories()
returns trigger as $$
begin
    insert into public.categories (user_id, name, icon, color) values
        (new.id, 'Food', 'utensils', '#ef4444'),
        (new.id, 'Coffee', 'coffee', '#8b5cf6'),
        (new.id, 'Transport', 'car', '#3b82f6'),
        (new.id, 'Bills', 'file-text', '#f59e0b'),
        (new.id, 'Entertainment', 'film', '#ec4899'),
        (new.id, 'Grocery', 'shopping-cart', '#10b981');
    return new;
exception
    when others then
        -- Transaction safety: raise exception causes registration rollback
        raise exception 'Failed to auto-provision user default categories: %', SQLERRM;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user_categories();
```

#### Trigger Failure & Registration Behavior:
- **Transaction Scope:** Executed inside the `auth.users` insert transaction.
- **Failure Consequence:** If category insertion fails, the entire user registration transaction **rolls back completely** (no partial orphaned user account).
- **User UX:** Frontend displays registration error (`AUTH001` / setup failure) prompting user to retry.

---

## 7. Database Views vs RPC Architecture

### 7.1 Database View (`recent_expenses`)
- **Rationale:** Exposes a static projection joining expenses with category names, icons, and colors. Accepts no dynamic parameters.

```sql
create or replace view public.recent_expenses as
select 
    e.id,
    e.user_id,
    e.amount,
    e.description,
    e.expense_date,
    coalesce(e.payment_method, 'Cash') as payment_method,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon
from public.expenses e
join public.categories c on e.category_id = c.id;
```

### 7.2 RPC Functions (Dynamic Aggregations)
All parametrized aggregations are encapsulated in RPCs rather than client-side calculations:

#### A. `get_monthly_summary(p_month date)`
```sql
create or replace function public.get_monthly_summary(p_month date default current_date)
returns table (
    total_amount bigint,
    transaction_count bigint,
    prev_month_total bigint
) language plpgsql security invoker as $$
declare
    v_start_date date := date_trunc('month', p_month)::date;
    v_end_date date := (date_trunc('month', p_month) + interval '1 month')::date;
    v_prev_start date := (date_trunc('month', p_month) - interval '1 month')::date;
begin
    return query
    select 
        coalesce(sum(case when expense_date >= v_start_date and expense_date < v_end_date then amount else 0 end), 0)::bigint as total_amount,
        count(case when expense_date >= v_start_date and expense_date < v_end_date then id else null end)::bigint as transaction_count,
        coalesce(sum(case when expense_date >= v_prev_start and expense_date < v_start_date then amount else 0 end), 0)::bigint as prev_month_total
    from public.expenses
    where user_id = auth.uid();
end;
$$;
```

#### B. `get_monthly_category_breakdown(p_month date)`
```sql
create or replace function public.get_monthly_category_breakdown(p_month date default current_date)
returns table (
    category_id uuid,
    category_name text,
    color text,
    icon text,
    total_amount bigint
) language plpgsql security invoker as $$
begin
    return query
    select 
        c.id as category_id,
        c.name as category_name,
        c.color,
        c.icon,
        coalesce(sum(e.amount), 0)::bigint as total_amount
    from public.categories c
    left join public.expenses e 
        on c.id = e.category_id 
       and e.expense_date >= date_trunc('month', p_month)::date
       and e.expense_date < (date_trunc('month', p_month) + interval '1 month')::date
    where c.user_id = auth.uid()
    group by c.id, c.name, c.color, c.icon
    order by total_amount desc;
end;
$$;
```

#### C. `get_recent_transactions(p_limit int default 10)`
```sql
create or replace function public.get_recent_transactions(p_limit int default 10)
returns setof public.recent_expenses
language sql security invoker as $$
    select *
    from public.recent_expenses
    where user_id = auth.uid()
    order by expense_date desc, id desc
    limit p_limit;
$$;
```

---

## 8. Row Level Security (RLS)

```sql
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.sync_logs enable row level security;

-- Categories RLS
create policy "Categories: select own" on public.categories for select using (auth.uid() = user_id);
create policy "Categories: insert own" on public.categories for insert with check (auth.uid() = user_id);
create policy "Categories: update own" on public.categories for update using (auth.uid() = user_id);
create policy "Categories: delete own" on public.categories for delete using (auth.uid() = user_id);

-- Expenses RLS
create policy "Expenses: select own" on public.expenses for select using (auth.uid() = user_id);
create policy "Expenses: insert own" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Expenses: update own" on public.expenses for update using (auth.uid() = user_id);
create policy "Expenses: delete own" on public.expenses for delete using (auth.uid() = user_id);

-- Sync Logs RLS
create policy "SyncLogs: select own" on public.sync_logs for select using (auth.uid() = user_id);
create policy "SyncLogs: insert own" on public.sync_logs for insert with check (auth.uid() = user_id);
```

---

## 9. Migration Lifecycle & Strategy

Database schema migrations are managed exclusively using the **official Supabase CLI**. Custom migration tracking tables are not used.

```bash
# Create new migration script
supabase migration new <migration_name>

# Apply pending migrations
supabase db push
```

---

## 10. Sync Log Retention Policy (30 Days)

Audit records in `sync_logs` are retained for **30 days**:
- **Rationale:** For 2 users executing manual monthly syncs, 30 days provides ample history to audit recent sync runs without database bloat.
- **Cleanup Trigger:**
  ```sql
  delete from public.sync_logs where created_at < now() - interval '30 days';
  ```

---

## 11. Future Schema Considerations

- **`categories` Table:** `sort_order integer default 0`, `is_default boolean default false`, `is_archived boolean default false`.
- **`expenses` Table:** `merchant text`, `attachment_url text`, `location text`.
