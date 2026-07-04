import { getMonthlyReport } from "@/actions/reports";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { ReportShell, ReportStat } from "@/components/reports/report-shell";
import { ReportDatePicker } from "@/components/reports/report-date-picker";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam || new Date().toISOString().slice(0, 7);

  const [report, { business }] = await Promise.all([getMonthlyReport(month), getCurrentBusiness()]);
  const currency = business.currency;

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-end">
        <ReportDatePicker paramName="month" label="Month" />
      </div>
      <ReportShell
        businessName={business.name}
        businessAddress={business.address}
        title="Monthly Report"
        appliedFilters={month}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ReportStat label="Revenue" value={formatCurrency(report.revenue, currency)} />
          <ReportStat label="Gross Profit" value={formatCurrency(report.grossProfit, currency)} valueClass="text-success" />
          <ReportStat label="Expenses" value={formatCurrency(report.expenses, currency)} valueClass="text-danger" />
          <ReportStat
            label="Net Profit"
            value={formatCurrency(report.netProfit, currency)}
            valueClass={report.netProfit >= 0 ? "text-success" : "text-danger"}
          />
          <ReportStat label="Total Bills" value={String(report.totalBills)} />
          <ReportStat label="Average Bill Value" value={formatCurrency(report.avgBillValue, currency)} />
          <ReportStat label="Credit Outstanding" value={formatCurrency(report.creditOutstanding, currency)} valueClass="text-danger" />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-primary/70">Expense Breakdown</p>
            {report.expenseBreakdown.length === 0 ? (
              <p className="text-sm text-primary/40">No expenses recorded this month.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.expenseBreakdown.map((e) => (
                    <TableRow key={e.category}>
                      <TableCell>{e.category}</TableCell>
                      <TableCell className="text-danger">{formatCurrency(e.amount, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-primary/70">Employee Performance Summary</p>
            {report.employeePerformance.length === 0 ? (
              <p className="text-sm text-primary/40">No sales recorded this month.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Bills</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.employeePerformance.map((e) => (
                    <TableRow key={e.employeeName}>
                      <TableCell>{e.employeeName}</TableCell>
                      <TableCell>{e.billsCreated}</TableCell>
                      <TableCell>{formatCurrency(e.revenue, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </ReportShell>
    </div>
  );
}
