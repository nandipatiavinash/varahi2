"use server";

import { getCurrentBusiness } from "@/lib/supabase/server";
import type { DateRange } from "@/lib/dashboard/date-range";

export type { DateRangePreset, DateRange } from "@/lib/dashboard/date-range";

export async function getDashboardData(range: DateRange) {
  const { supabase, business } = await getCurrentBusiness();
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const [todaySummary, monthSummaries, rangeBills, rangeExpenses, creditOutstanding, advancePending, employeePerf] =
    await Promise.all([
      supabase.from("v_daily_summary").select("*").eq("business_id", business.id).eq("date", todayStr).maybeSingle(),
      supabase
        .from("v_daily_summary")
        .select("*")
        .eq("business_id", business.id)
        .gte("date", monthStartStr)
        .lte("date", todayStr),
      supabase
        .from("bills")
        .select("*")
        .eq("business_id", business.id)
        .gte("bill_date", range.from)
        .lte("bill_date", range.to)
        .neq("status", "voided")
        .order("bill_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("expenses")
        .select("*")
        .eq("business_id", business.id)
        .gte("date", range.from)
        .lte("date", range.to),
      supabase.from("v_credit_outstanding").select("*").eq("business_id", business.id),
      supabase.from("advance_orders").select("*").eq("business_id", business.id).eq("status", "pending"),
      supabase.from("v_employee_performance").select("*").eq("business_id", business.id),
    ]);

  const todayRevenue = Number(todaySummary.data?.revenue ?? 0);
  const todayGrossProfit = Number(todaySummary.data?.gross_profit ?? 0);
  const todayBillCount = Number(todaySummary.data?.bill_count ?? 0);
  const todayCreditSales = Number(todaySummary.data?.credit_sales ?? 0);
  const todayAdvancePayments = Number(todaySummary.data?.advance_payments ?? 0);

  const { data: todayExpensesData } = await supabase
    .from("expenses")
    .select("amount")
    .eq("business_id", business.id)
    .eq("date", todayStr);
  const todayExpenses = (todayExpensesData ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const todayNetProfit = todayGrossProfit - todayExpenses;

  const monthlyRows = monthSummaries.data ?? [];
  const monthlyRevenue = monthlyRows.reduce((sum, r) => sum + Number(r.revenue), 0);
  const monthlyGrossProfit = monthlyRows.reduce((sum, r) => sum + Number(r.gross_profit), 0);
  const monthlyExpenses = (rangeExpenses.data ?? [])
    .filter((e) => e.date >= monthStartStr)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const monthlyNetProfit = monthlyGrossProfit - monthlyExpenses;

  const outstandingCredit = (creditOutstanding.data ?? []).reduce(
    (sum, c) => sum + Number(c.balance_due),
    0
  );

  const bills = rangeBills.data ?? [];
  const expensesInRange = rangeExpenses.data ?? [];
  const rangeRevenue = bills.reduce((sum, b) => sum + Number(b.grand_total), 0);
  const rangeGrossProfit = bills.reduce((sum, b) => sum + Number(b.gross_profit), 0);
  const rangeExpenseTotal = expensesInRange.reduce((sum, e) => sum + Number(e.amount), 0);

  // Revenue/profit trend for charts — bucket by date within range
  const trendMap = new Map<string, { date: string; revenue: number; profit: number; bills: number }>();
  for (const bill of bills) {
    const key = bill.bill_date;
    const entry = trendMap.get(key) ?? { date: key, revenue: 0, profit: 0, bills: 0 };
    entry.revenue += Number(bill.grand_total);
    entry.profit += Number(bill.gross_profit);
    entry.bills += 1;
    trendMap.set(key, entry);
  }
  const trend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const employees = (employeePerf.data ?? []).slice().sort((a, b) => b.revenue_generated - a.revenue_generated);
  const topEmployee = employees[0] ?? null;

  return {
    today: {
      revenue: todayRevenue,
      grossProfit: todayGrossProfit,
      expenses: todayExpenses,
      netProfit: todayNetProfit,
      bills: todayBillCount,
      creditSales: todayCreditSales,
      advancePayments: todayAdvancePayments,
    },
    monthly: {
      revenue: monthlyRevenue,
      grossProfit: monthlyGrossProfit,
      expenses: monthlyExpenses,
      netProfit: monthlyNetProfit,
    },
    outstandingCredit,
    pendingAdvanceOrders: (advancePending.data ?? []).length,
    topEmployee,
    employeeLeaderboard: employees,
    range: {
      revenue: rangeRevenue,
      grossProfit: rangeGrossProfit,
      expenses: rangeExpenseTotal,
      netProfit: rangeGrossProfit - rangeExpenseTotal,
      billCount: bills.length,
    },
    trend,
    recentBills: bills.slice(0, 8),
    recentExpenses: expensesInRange
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8),
  };
}
