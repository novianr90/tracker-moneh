-- Add is_upload column to public.expenses
alter table public.expenses 
add column if not exists is_upload boolean not null default false;

-- Create index for filtering un-uploaded transactions efficiently
create index if not exists idx_expenses_user_is_upload 
on public.expenses (user_id, is_upload);

-- Drop view cascade to prevent column ordering conflicts in PostgreSQL
drop view if exists public.recent_expenses cascade;

-- Recreate recent_expenses view with is_upload included
create view public.recent_expenses as
select 
    e.id,
    e.user_id,
    e.amount,
    e.description,
    e.expense_date,
    e.is_upload,
    e.created_at,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon
from public.expenses e
join public.categories c on e.category_id = c.id;

-- Recreate RPC function depending on recent_expenses view
create or replace function public.get_recent_transactions(p_limit int default 10)
returns setof public.recent_expenses
language sql security invoker as $$
    select *
    from public.recent_expenses
    where user_id = auth.uid()
    order by expense_date desc, id desc
    limit p_limit;
$$;
