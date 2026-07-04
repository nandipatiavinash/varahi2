-- =============================================================================
-- Demo data for Sri Varahi Building Solutions
--
-- Run this AFTER the owner has signed up at least once (the
-- handle_new_user() trigger auto-creates the businesses row). This script
-- assumes a single business row exists and seeds against it.
-- =============================================================================

do $$
declare
  v_business_id uuid;
  v_emp_ravi uuid;
  v_emp_suresh uuid;
  v_emp_lakshmi uuid;
  v_prod_cement uuid;
  v_prod_tmt uuid;
  v_prod_paint uuid;
  v_prod_tile uuid;
  v_prod_pipe uuid;
  v_bill1 uuid;
  v_bill2 uuid;
  v_bill3 uuid;
  v_bill4 uuid;
begin
  select id into v_business_id from businesses limit 1;
  if v_business_id is null then
    raise exception 'No business found — sign in once before running the seed.';
  end if;

  update businesses
  set address = '12-4-56, NH Road, Vijayawada, Andhra Pradesh',
      phone = '+91 98765 43210',
      email = 'contact@srivarahibuilding.in',
      currency = 'INR'
  where id = v_business_id;

  -- Employees
  insert into employees (business_id, name, mobile, status)
  values (v_business_id, 'Ravi Kumar', '9876500001', 'active')
  returning id into v_emp_ravi;

  insert into employees (business_id, name, mobile, status)
  values (v_business_id, 'Suresh Babu', '9876500002', 'active')
  returning id into v_emp_suresh;

  insert into employees (business_id, name, mobile, status)
  values (v_business_id, 'Lakshmi Devi', '9876500003', 'active')
  returning id into v_emp_lakshmi;

  -- Products
  insert into products (business_id, name, category, default_purchase_price, default_selling_price, status)
  values (v_business_id, 'UltraTech Cement (50kg)', 'Cement', 340, 380, 'active')
  returning id into v_prod_cement;

  insert into products (business_id, name, category, default_purchase_price, default_selling_price, status)
  values (v_business_id, 'TMT Steel Bar 12mm (per kg)', 'Steel', 62, 68, 'active')
  returning id into v_prod_tmt;

  insert into products (business_id, name, category, default_purchase_price, default_selling_price, status)
  values (v_business_id, 'Asian Paints Emulsion (20L)', 'Paints', 3200, 3750, 'active')
  returning id into v_prod_paint;

  insert into products (business_id, name, category, default_purchase_price, default_selling_price, status)
  values (v_business_id, 'Vitrified Floor Tile 2x2ft', 'Tiles', 55, 72, 'active')
  returning id into v_prod_tile;

  insert into products (business_id, name, category, default_purchase_price, default_selling_price, status)
  values (v_business_id, 'PVC Pipe 4inch (per ft)', 'Plumbing', 85, 105, 'active')
  returning id into v_prod_pipe;

  insert into products (business_id, name, category, default_purchase_price, default_selling_price, status)
  values (v_business_id, 'Hardware Assorted Kit', 'Hardware', 450, 600, 'active');

  -- Bill 1: fully paid, cash
  insert into bills (business_id, bill_number, bill_date, customer_name, customer_mobile, employee_id,
                      subtotal, discount, grand_total, gross_profit, paid_amount, status)
  values (v_business_id, 'INV-1001', current_date - interval '2 days', 'Chandra Constructions', '9000011111',
          v_emp_ravi, 20800, 0, 20800, 2400, 20800, 'paid')
  returning id into v_bill1;

  insert into bill_items (bill_id, product_id, product_name_snapshot, quantity, purchase_price, selling_price)
  values
    (v_bill1, v_prod_cement, 'UltraTech Cement (50kg)', 50, 340, 380),
    (v_bill1, v_prod_tmt, 'TMT Steel Bar 12mm (per kg)', 20, 62, 68);

  insert into payment_splits (bill_id, method, amount) values (v_bill1, 'cash', 20800);

  -- Bill 2: partial credit
  insert into bills (business_id, bill_number, bill_date, customer_name, customer_mobile, employee_id,
                      subtotal, discount, grand_total, gross_profit, paid_amount, status)
  values (v_business_id, 'INV-1002', current_date - interval '1 day', 'Venkatesh Traders', '9000022222',
          v_emp_suresh, 11250, 250, 11000, 1650, 5000, 'partial')
  returning id into v_bill2;

  insert into bill_items (bill_id, product_id, product_name_snapshot, quantity, purchase_price, selling_price)
  values (v_bill2, v_prod_paint, 'Asian Paints Emulsion (20L)', 3, 3200, 3750);

  insert into payment_splits (bill_id, method, amount) values (v_bill2, 'cash', 5000);
  insert into payment_splits (bill_id, method, amount) values (v_bill2, 'credit', 6000);

  insert into credit_payments (bill_id, amount, method, notes)
  values (v_bill2, 5000, 'cash', 'Initial payment at billing');

  -- Bill 3: today, UPI, employee Lakshmi
  insert into bills (business_id, bill_number, bill_date, customer_name, customer_mobile, employee_id,
                      subtotal, discount, grand_total, gross_profit, paid_amount, status)
  values (v_business_id, 'INV-1003', current_date, 'Ramesh Homes', '9000033333',
          v_emp_lakshmi, 7920, 0, 7920, 1224, 7920, 'paid')
  returning id into v_bill3;

  insert into bill_items (bill_id, product_id, product_name_snapshot, quantity, purchase_price, selling_price)
  values (v_bill3, v_prod_tile, 'Vitrified Floor Tile 2x2ft', 110, 55, 72);

  insert into payment_splits (bill_id, method, amount) values (v_bill3, 'upi', 7920);

  -- Bill 4: today, plumbing, credit only
  insert into bills (business_id, bill_number, bill_date, customer_name, customer_mobile, employee_id,
                      subtotal, discount, grand_total, gross_profit, paid_amount, status)
  values (v_business_id, 'INV-1004', current_date, 'Padma Builders', '9000044444',
          v_emp_ravi, 6300, 0, 6300, 1260, 0, 'credit')
  returning id into v_bill4;

  insert into bill_items (bill_id, product_id, product_name_snapshot, quantity, purchase_price, selling_price)
  values (v_bill4, v_prod_pipe, 'PVC Pipe 4inch (per ft)', 60, 85, 105);

  insert into payment_splits (bill_id, method, amount) values (v_bill4, 'credit', 6300);

  -- Advance order
  insert into advance_orders (business_id, customer_name, customer_mobile, advance_amount,
                               expected_delivery_date, notes, status)
  values (v_business_id, 'Krishna Reddy', '9000055555', 5000, current_date + interval '5 days',
          'Advance for bulk TMT steel order', 'pending');

  -- Expenses
  insert into expenses (business_id, date, category, amount, description) values
    (v_business_id, current_date - interval '3 days', 'Rent', 25000, 'Monthly shop rent'),
    (v_business_id, current_date - interval '2 days', 'Electricity', 4200, 'EB bill'),
    (v_business_id, current_date - interval '1 day', 'Transport', 1800, 'Lorry hire for cement delivery'),
    (v_business_id, current_date, 'Fuel', 900, 'Delivery vehicle diesel');

end $$;
