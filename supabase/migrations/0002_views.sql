-- =============================================================================
-- Read-side aggregation views
-- Computed on read (not materialized) — data volume for a single store is
-- small enough that this stays fast; can be swapped to materialized views
-- later without touching application code.
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

-- Outstanding credit (derived directly from bills — no separate ledger to drift)
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

-- Expense breakdown by category (feeds monthly report + dashboard)
create or replace view v_expense_breakdown as
select
  business_id,
  date_trunc('month', date)::date as month,
  category,
  sum(amount) as total_amount
from expenses
group by business_id, date_trunc('month', date), category;
