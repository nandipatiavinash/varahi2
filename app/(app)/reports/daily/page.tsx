import { getDailyEODReport } from "@/actions/reports";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { ReportShell, ReportStat } from "@/components/reports/report-shell";
import { ReportDatePicker } from "@/components/reports/report-date-picker";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DailyEODReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam || new Date().toISOString().slice(0, 10);

  const [report, { business }] = await Promise.all([getDailyEODReport(date), getCurrentBusiness()]);
  const currency = business.currency;

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-end">
        <ReportDatePicker paramName="date" label="Date" />
      </div>
      <ReportShell
        businessName={business.name}
        businessAddress={business.address}
        title="Daily End of Day Report"
        appliedFilters={formatDate(date)}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ReportStat label="Number of Bills" value={String(report.billCount)} />
          <ReportStat label="Total Revenue" value={formatCurrency(report.totalRevenue, currency)} />
          <ReportStat label="Gross Profit" value={formatCurrency(report.grossProfit, currency)} valueClass="text-success" />
          <ReportStat label="Total Expenses" value={formatCurrency(report.totalExpenses, currency)} valueClass="text-danger" />
          <ReportStat
            label="Net Profit"
            value={formatCurrency(report.netProfit, currency)}
            valueClass={report.netProfit >= 0 ? "text-success" : "text-danger"}
          />
          <ReportStat label="Cash Collection" value={formatCurrency(report.cashCollection, currency)} />
          <ReportStat label="UPI Collection" value={formatCurrency(report.upiCollection, currency)} />
          <ReportStat label="Bank Collection" value={formatCurrency(report.bankCollection, currency)} />
          <ReportStat label="Credit Sales" value={formatCurrency(report.creditSales, currency)} />
          <ReportStat label="Advance Payments" value={formatCurrency(report.advancePayments, currency)} />
          <ReportStat label="Outstanding Credit" value={formatCurrency(report.outstandingCredit, currency)} valueClass="text-danger" />
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-primary/70">Employee-wise Sales Summary</p>
          {report.employeeSummary.length === 0 ? (
            <p className="text-sm text-primary/40">No sales recorded on this date.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Bills</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.employeeSummary.map((e) => (
                  <TableRow key={e.employeeName}>
                    <TableCell>{e.employeeName}</TableCell>
                    <TableCell>{e.billCount}</TableCell>
                    <TableCell>{formatCurrency(e.revenue, currency)}</TableCell>
                    <TableCell className="text-success">{formatCurrency(e.profit, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </ReportShell>
    </div>
  );
}
