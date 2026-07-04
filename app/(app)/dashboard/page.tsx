import { getDashboardData } from "@/actions/dashboard";
import { resolveDateRange, type DateRangePreset } from "@/lib/dashboard/date-range";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { RevenueProfitChart, DailySalesChart, EmployancePerformanceChart } from "@/components/dashboard/trend-charts";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentBillsTable } from "@/components/dashboard/recent-bills-table";
import { RecentExpensesTable } from "@/components/dashboard/recent-expenses-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  IndianRupee,
  TrendingUp,
  Receipt,
  Wallet,
  CreditCard,
  Trophy,
  Wrench,
  PiggyBank,
} from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: DateRangePreset; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const preset = params.range ?? "today";
  const range = resolveDateRange(preset, params.from && params.to ? { from: params.from, to: params.to } : undefined);

  const [data, { business }] = await Promise.all([getDashboardData(range), getCurrentBusiness()]);
  const currency = business.currency;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
          <p className="text-sm text-primary/50">Welcome back — here&apos;s how {business.name} is performing.</p>
        </div>
        <DateRangeFilter current={preset} />
      </div>

      <QuickActions />

      <div>
        <p className="mb-3 text-sm font-medium text-primary/60">Today</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Today's Revenue" value={formatCurrency(data.today.revenue, currency)} icon={IndianRupee} tone="info" />
          <KpiCard label="Today's Gross Profit" value={formatCurrency(data.today.grossProfit, currency)} icon={TrendingUp} tone="success" />
          <KpiCard label="Today's Expenses" value={formatCurrency(data.today.expenses, currency)} icon={Wrench} tone="danger" />
          <KpiCard
            label="Today's Net Profit"
            value={formatCurrency(data.today.netProfit, currency)}
            icon={PiggyBank}
            tone={data.today.netProfit >= 0 ? "success" : "danger"}
          />
          <KpiCard label="Today's Bills" value={String(data.today.bills)} icon={Receipt} />
          <KpiCard label="Today's Credit Sales" value={formatCurrency(data.today.creditSales, currency)} icon={CreditCard} tone="accent" />
          <KpiCard label="Today's Advance Payments" value={formatCurrency(data.today.advancePayments, currency)} icon={Wallet} tone="info" />
          <KpiCard
            label="Top Employee"
            value={data.topEmployee?.employee_name ?? "—"}
            sublabel={data.topEmployee ? formatCurrency(data.topEmployee.revenue_generated, currency) : undefined}
            icon={Trophy}
            tone="accent"
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-primary/60">This Month</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Monthly Revenue" value={formatCurrency(data.monthly.revenue, currency)} icon={IndianRupee} tone="info" />
          <KpiCard label="Monthly Gross Profit" value={formatCurrency(data.monthly.grossProfit, currency)} icon={TrendingUp} tone="success" />
          <KpiCard label="Monthly Expenses" value={formatCurrency(data.monthly.expenses, currency)} icon={Wrench} tone="danger" />
          <KpiCard
            label="Monthly Net Profit"
            value={formatCurrency(data.monthly.netProfit, currency)}
            icon={PiggyBank}
            tone={data.monthly.netProfit >= 0 ? "success" : "danger"}
          />
          <KpiCard label="Outstanding Credit" value={formatCurrency(data.outstandingCredit, currency)} icon={CreditCard} tone="danger" />
          <KpiCard label="Pending Advance Orders" value={String(data.pendingAdvanceOrders)} icon={Wallet} tone="accent" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueProfitChart data={data.trend} currency={currency} />
        <DailySalesChart data={data.trend} />
      </div>
      <EmployancePerformanceChart data={data.employeeLeaderboard} currency={currency} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Sales</CardTitle></CardHeader>
          <CardContent><RecentBillsTable bills={data.recentBills} currency={currency} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Expenses</CardTitle></CardHeader>
          <CardContent><RecentExpensesTable expenses={data.recentExpenses} currency={currency} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
