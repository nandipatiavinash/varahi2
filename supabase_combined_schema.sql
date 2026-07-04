-- =============================================================================
-- Sri Varahi Building Solutions — Combined Schema (init.sql + views.sql)
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- businesses
-- -----------------------------------------------------------------------------
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default 'Sri Varahi Building Solutions',
  logo_url text,
  address text,
  phone text,
  email text,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- employees
-- -----------------------------------------------------------------------------
create table employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  mobile text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_employees_business_status on employees (business_id, status);

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  category text not null,
  default_purchase_price numeric(12, 2) not null default 0,
  default_selling_price numeric(12, 2) not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_business_category on products (business_id, category);
create index idx_products_business_name on products (business_id, name);

-- -----------------------------------------------------------------------------
-- bills (invoice header)
-- -----------------------------------------------------------------------------
create table bills (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  bill_number text not null,
  bill_date date not null default current_date,
  customer_name text not null,
  customer_mobile text,
  employee_id uuid references employees (id) on delete set null,
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  gross_profit numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  balance_due numeric(12, 2) generated always as (grand_total - paid_amount) stored,
  status text not null default 'paid' check (status in ('paid', 'partial', 'credit', 'voided')),
  notes text,
  voided_at timestamptz,
  locked boolean not null default false, -- true once the creation day has passed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_bills_business_date on bills (business_id, bill_date);
create index idx_bills_business_number on bills (business_id, bill_number);
create index idx_bills_business_employee on bills (business_id, employee_id);
create index idx_bills_business_status on bills (business_id, status);

-- -----------------------------------------------------------------------------
-- bill_items (immutable line-item snapshot)
-- -----------------------------------------------------------------------------
create table bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name_snapshot text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  purchase_price numeric(12, 2) not null,
  selling_price numeric(12, 2) not null,
  line_profit numeric(12, 2) generated always as ((selling_price - purchase_price) * quantity) stored,
  line_total numeric(12, 2) generated always as (selling_price * quantity) stored,
  created_at timestamptz not null default now()
);
create index idx_bill_items_bill on bill_items (bill_id);

-- -----------------------------------------------------------------------------
-- payment_splits
-- -----------------------------------------------------------------------------
create table payment_splits (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  method text not null check (method in ('cash', 'upi', 'bank', 'credit', 'advance')),
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);
create index idx_payment_splits_bill_method on payment_splits (bill_id, method);

-- -----------------------------------------------------------------------------
-- advance_orders
-- -----------------------------------------------------------------------------
create table advance_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_name text not null,
  customer_mobile text,
  advance_amount numeric(12, 2) not null default 0,
  expected_delivery_date date,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  converted_bill_id uuid references bills (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_advance_orders_business_status on advance_orders (business_id, status);

-- -----------------------------------------------------------------------------
-- credit_payments (partial payments against a bill's balance)
-- -----------------------------------------------------------------------------
create table credit_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null check (method in ('cash', 'upi', 'bank')),
  paid_at timestamptz not null default now(),
  notes text
);
create index idx_credit_payments_bill on credit_payments (bill_id);

-- -----------------------------------------------------------------------------
-- expenses
-- -----------------------------------------------------------------------------
create table expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  date date not null default current_date,
  category text not null check (
    category in ('Rent', 'Electricity', 'Fuel', 'Transport', 'Maintenance', 'Miscellaneous')
  ),
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_expenses_business_date on expenses (business_id, date);
create index idx_expenses_business_category on expenses (business_id, category);

-- -----------------------------------------------------------------------------
-- activity_log
-- -----------------------------------------------------------------------------
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('created', 'updated', 'voided', 'deleted')),
  detail jsonb,
  created_at timestamptz not null default now()
);
create index idx_activity_log_business_entity on activity_log (business_id, entity_type, entity_id);

-- =============================================================================
-- Same-day edit/delete enforcement for bills
-- =============================================================================

create or replace function bill_is_same_day(created timestamptz)
returns boolean
language sql
stable
as $$
  select created::date = now()::date;
$$;

create or replace function enforce_bill_lock()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'UPDATE' then
    if old.locked = true and not bill_is_same_day(old.created_at) then
      raise exception 'This bill is locked (created on a previous day). Void it instead of editing.';
    end if;
    -- Auto-lock the row the moment we detect it has crossed into a new day.
    if not bill_is_same_day(old.created_at) then
      new.locked := true;
    end if;
    new.updated_at := now();
    return new;
  end if;

  if TG_OP = 'DELETE' then
    if not bill_is_same_day(old.created_at) then
      raise exception 'This bill can no longer be deleted (created on a previous day). Void it instead.';
    end if;
    return old;
  end if;

  return null;
end;
$$;

create trigger trg_bill_lock_update
  before update on bills
  for each row
  execute function enforce_bill_lock();

create trigger trg_bill_lock_delete
  before delete on bills
  for each row
  execute function enforce_bill_lock();

-- bill_items inherit the same-day rule via their parent bill.
create or replace function enforce_bill_items_lock()
returns trigger
language plpgsql
as $$
declare
  parent_created timestamptz;
begin
  select created_at into parent_created
  from bills
  where id = coalesce(new.bill_id, old.bill_id);

  if parent_created is not null and not bill_is_same_day(parent_created) then
    raise exception 'Line items cannot be changed after the bill''s creation day has passed.';
  end if;

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger trg_bill_items_lock_write
  before insert or update or delete on bill_items
  for each row
  execute function enforce_bill_items_lock();

-- =============================================================================
-- updated_at maintenance
-- =============================================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_businesses_updated_at before update on businesses
  for each row execute function set_updated_at();
create trigger trg_employees_updated_at before update on employees
  for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_advance_orders_updated_at before update on advance_orders
  for each row execute function set_updated_at();
create trigger trg_expenses_updated_at before update on expenses
  for each row execute function set_updated_at();

-- =============================================================================
-- Row Level Security — every table scoped to the authenticated owner
-- =============================================================================
alter table businesses enable row level security;
alter table employees enable row level security;
alter table products enable row level security;
alter table bills enable row level security;
alter table bill_items enable row level security;
alter table payment_splits enable row level security;
alter table advance_orders enable row level security;
alter table credit_payments enable row level security;
alter table expenses enable row level security;
alter table activity_log enable row level security;

create policy "owner manages own business" on businesses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner manages own employees" on employees
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner manages own products" on products
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner manages own bills" on bills
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner manages own bill_items" on bill_items
  for all using (bill_id in (
    select b.id from bills b
    join businesses biz on biz.id = b.business_id
    where biz.owner_id = auth.uid()
  ))
  with check (bill_id in (
    select b.id from bills b
    join businesses biz on biz.id = b.business_id
    where biz.owner_id = auth.uid()
  ));

create policy "owner manages own payment_splits" on payment_splits
  for all using (bill_id in (
    select b.id from bills b
    join businesses biz on biz.id = b.business_id
    where biz.owner_id = auth.uid()
  ))
  with check (bill_id in (
    select b.id from bills b
    join businesses biz on biz.id = b.business_id
    where biz.owner_id = auth.uid()
  ));

create policy "owner manages own advance_orders" on advance_orders
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner manages own credit_payments" on credit_payments
  for all using (bill_id in (
    select b.id from bills b
    join businesses biz on biz.id = b.business_id
    where biz.owner_id = auth.uid()
  ))
  with check (bill_id in (
    select b.id from bills b
    join businesses biz on biz.id = b.business_id
    where biz.owner_id = auth.uid()
  ));

create policy "owner manages own expenses" on expenses
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner manages own activity_log" on activity_log
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

-- =============================================================================
-- Auto-create a business row the moment a new owner signs up
-- =============================================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.businesses (owner_id, name)
  values (new.id, 'Sri Varahi Building Solutions');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================================================
-- Read-side aggregation views
-- =============================================================================

-- Daily summary: one row per business_id + bill_date
create or replace view v_daily_summary as
select
  b.business_id,
  b.bill_date as date,
  count(*) filter (where b.status <> 'voided') as bill_count,
  coalesce(sum(b.grand_total) filter (where b.status <> 'voided'), 0) as revenue,
  coalesce(sum(b.gross_profit) filter (where b.status <> 'voided'), 0) as gross_profit,
  coalesce(sum(ps.amount) filter (where ps.method = 'cash'), 0) as cash_collection,
  coalesce(sum(ps.amount) filter (where ps.method = 'upi'), 0) as upi_collection,
  coalesce(sum(ps.amount) filter (where ps.method = 'bank'), 0) as bank_collection,
  coalesce(sum(ps.amount) filter (where ps.method = 'credit'), 0) as credit_sales,
  coalesce(sum(ps.amount) filter (where ps.method = 'advance'), 0) as advance_payments
from bills b
left join payment_splits ps on ps.bill_id = b.id
group by b.business_id, b.bill_date;

-- Monthly summary
create or replace view v_monthly_summary as
select
  b.business_id,
  date_trunc('month', b.bill_date)::date as month,
  count(*) filter (where b.status <> 'voided') as bill_count,
  coalesce(sum(b.grand_total) filter (where b.status <> 'voided'), 0) as revenue,
  coalesce(sum(b.gross_profit) filter (where b.status <> 'voided'), 0) as gross_profit,
  coalesce(avg(b.grand_total) filter (where b.status <> 'voided'), 0) as avg_bill_value
from bills b
group by b.business_id, date_trunc('month', b.bill_date);

-- Employee performance
create or replace view v_employee_performance as
select
  e.id as employee_id,
  e.business_id,
  e.name as employee_name,
  count(b.id) filter (where b.status <> 'voided') as bills_created,
  coalesce(sum(b.grand_total) filter (where b.status <> 'voided'), 0) as sales_amount,
  coalesce(sum(b.grand_total) filter (where b.status <> 'voided'), 0) as revenue_generated,
  coalesce(sum(b.gross_profit) filter (where b.status <> 'voided'), 0) as profit_generated,
  coalesce(avg(b.grand_total) filter (where b.status <> 'voided'), 0) as avg_bill_value,
  count(b.id) filter (where b.status = 'credit') as credit_sales_count
from employees e
left join bills b on b.employee_id = e.id
group by e.id, e.business_id, e.name;

-- Outstanding credit
create or replace view v_credit_outstanding as
select
  b.id as bill_id,
  b.business_id,
  b.bill_number,
  b.customer_name,
  b.customer_mobile,
  b.grand_total,
  b.paid_amount,
  b.balance_due,
  b.bill_date,
  case
    when b.balance_due > 0 and b.bill_date < (current_date - interval '30 days')
    then true else false
  end as is_overdue
from bills b
where b.status in ('credit', 'partial')
  and b.balance_due > 0;

-- Expense breakdown by category
create or replace view v_expense_breakdown as
select
  business_id,
  date_trunc('month', date)::date as month,
  category,
  sum(amount) as total_amount
from expenses
group by business_id, date_trunc('month', date), category;
