"use server";

import { getCurrentBusiness } from "@/lib/supabase/server";

export interface DailyEODReport {
  date: string;
  billCount: number;
  totalRevenue: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  cashCollection: number;
  upiCollection: number;
  bankCollection: number;
  creditSales: number;
  advancePayments: number;
  outstandingCredit: number;
  employeeSummary: { employeeName: string; billCount: number; revenue: number; profit: number }[];
}

export async function getDailyEODReport(date: string): Promise<DailyEODReport> {
  const { supabase, business } = await getCurrentBusiness();

  const [summaryRes, expensesRes, creditRes, billsRes] = await Promise.all([
    supabase.from("v_daily_summary").select("*").eq("business_id", business.id).eq("date", date).maybeSingle(),
    supabase.from("expenses").select("amount").eq("business_id", business.id).eq("date", date),
    supabase.from("v_credit_outstanding").select("balance_due").eq("business_id", business.id),
    supabase
      .from("bills")
      .select("grand_total, gross_profit, employee_id, employees(name)")
      .eq("business_id", business.id)
      .eq("bill_date", date)
      .neq("status", "voided"),
  ]);

  const totalExpenses = (expensesRes.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const outstandingCredit = (creditRes.data ?? []).reduce((sum, c) => sum + Number(c.balance_due), 0);
  const grossProfit = Number(summaryRes.data?.gross_profit ?? 0);

  const employeeMap = new Map<string, { employeeName: string; billCount: number; revenue: number; profit: number }>();
  for (const bill of billsRes.data ?? []) {
    const name = (bill.employees as { name: string } | null)?.name ?? "Unassigned";
    const entry = employeeMap.get(name) ?? { employeeName: name, billCount: 0, revenue: 0, profit: 0 };
    entry.billCount += 1;
    entry.revenue += Number(bill.grand_total);
    entry.profit += Number(bill.gross_profit);
    employeeMap.set(name, entry);
  }

  return {
    date,
    billCount: Number(summaryRes.data?.bill_count ?? 0),
    totalRevenue: Number(summaryRes.data?.revenue ?? 0),
    grossProfit,
    totalExpenses,
    netProfit: grossProfit - totalExpenses,
    cashCollection: Number(summaryRes.data?.cash_collection ?? 0),
    upiCollection: Number(summaryRes.data?.upi_collection ?? 0),
    bankCollection: Number(summaryRes.data?.bank_collection ?? 0),
    creditSales: Number(summaryRes.data?.credit_sales ?? 0),
    advancePayments: Number(summaryRes.data?.advance_payments ?? 0),
    outstandingCredit,
    employeeSummary: Array.from(employeeMap.values()).sort((a, b) => b.revenue - a.revenue),
  };
}

export interface MonthlyReport {
  month: string;
  revenue: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  totalBills: number;
  avgBillValue: number;
  creditOutstanding: number;
  expenseBreakdown: { category: string; amount: number }[];
  employeePerformance: { employeeName: string; billsCreated: number; revenue: number; profit: number; avgBillValue: number }[];
}

export async function getMonthlyReport(month: string): Promise<MonthlyReport> {
  const { supabase, business } = await getCurrentBusiness();
  const monthStart = `${month}-01`;

  const [summaryRes, breakdownRes, creditRes, empRes] = await Promise.all([
    supabase.from("v_monthly_summary").select("*").eq("business_id", business.id).eq("month", monthStart).maybeSingle(),
    supabase.from("v_expense_breakdown").select("*").eq("business_id", business.id).eq("month", monthStart),
    supabase.from("v_credit_outstanding").select("balance_due").eq("business_id", business.id),
    supabase.from("v_employee_performance").select("*").eq("business_id", business.id),
  ]);

  const revenue = Number(summaryRes.data?.revenue ?? 0);
  const grossProfit = Number(summaryRes.data?.gross_profit ?? 0);
  const expenses = (breakdownRes.data ?? []).reduce((sum, r) => sum + Number(r.total_amount), 0);
  const outstandingCredit = (creditRes.data ?? []).reduce((sum, c) => sum + Number(c.balance_due), 0);

  return {
    month,
    revenue,
    grossProfit,
    expenses,
    netProfit: grossProfit - expenses,
    totalBills: Number(summaryRes.data?.bill_count ?? 0),
    avgBillValue: Number(summaryRes.data?.avg_bill_value ?? 0),
    creditOutstanding: outstandingCredit,
    expenseBreakdown: (breakdownRes.data ?? []).map((r) => ({ category: r.category, amount: Number(r.total_amount) })),
    employeePerformance: (empRes.data ?? [])
      .map((e) => ({
        employeeName: e.employee_name,
        billsCreated: e.bills_created,
        revenue: Number(e.revenue_generated),
        profit: Number(e.profit_generated),
        avgBillValue: Number(e.avg_bill_value),
      }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}

export async function getEmployeePerformanceReport(from: string, to: string) {
  const { supabase, business } = await getCurrentBusiness();

  const { data: bills, error } = await supabase
    .from("bills")
    .select("employee_id, employees(name), grand_total, gross_profit")
    .eq("business_id", business.id)
    .gte("bill_date", from)
    .lte("bill_date", to)
    .neq("status", "voided");

  if (error) throw new Error(error.message);

  const map = new Map<string, { employeeName: string; billsCreated: number; salesAmount: number; revenue: number; profit: number }>();
  for (const bill of bills ?? []) {
    const name = (bill.employees as { name: string } | null)?.name ?? "Unassigned";
    const entry = map.get(name) ?? { employeeName: name, billsCreated: 0, salesAmount: 0, revenue: 0, profit: 0 };
    entry.billsCreated += 1;
    entry.salesAmount += Number(bill.grand_total);
    entry.revenue += Number(bill.grand_total);
    entry.profit += Number(bill.gross_profit);
    map.set(name, entry);
  }

  return Array.from(map.values())
    .map((e) => ({ ...e, avgBillValue: e.billsCreated ? e.revenue / e.billsCreated : 0 }))
    .sort((a, b) => b.revenue - a.revenue);
}

export interface ProfitLossReport {
  from: string;
  to: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export async function getProfitLossReport(from: string, to: string): Promise<ProfitLossReport> {
  const { supabase, business } = await getCurrentBusiness();

  const [billsRes, expensesRes] = await Promise.all([
    supabase
      .from("bills")
      .select("grand_total, gross_profit, subtotal")
      .eq("business_id", business.id)
      .gte("bill_date", from)
      .lte("bill_date", to)
      .neq("status", "voided"),
    supabase.from("expenses").select("amount").eq("business_id", business.id).gte("date", from).lte("date", to),
  ]);

  const revenue = (billsRes.data ?? []).reduce((sum, b) => sum + Number(b.grand_total), 0);
  const grossProfit = (billsRes.data ?? []).reduce((sum, b) => sum + Number(b.gross_profit), 0);
  const costOfGoodsSold = revenue - grossProfit;
  const expenses = (expensesRes.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    from,
    to,
    revenue,
    costOfGoodsSold,
    grossProfit,
    expenses,
    netProfit: grossProfit - expenses,
  };
}
