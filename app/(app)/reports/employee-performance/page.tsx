import { getEmployeePerformanceReport } from "@/actions/reports";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { ReportShell } from "@/components/reports/report-shell";
import { ReportRangePicker } from "@/components/reports/report-date-picker";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function EmployeePerformanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const monthStart = new Date();
  monthStart.setDate(1);
  const from = params.from || monthStart.toISOString().slice(0, 10);
  const to = params.to || new Date().toISOString().slice(0, 10);

  const [rows, { business }] = await Promise.all([
    getEmployeePerformanceReport(from, to),
    getCurrentBusiness(),
  ]);
  const currency = business.currency;

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-end">
        <ReportRangePicker />
      </div>
      <ReportShell
        businessName={business.name}
        businessAddress={business.address}
        title="Employee Performance Report"
        appliedFilters={`${formatDate(from)} – ${formatDate(to)}`}
      >
        {rows.length === 0 ? (
          <p className="text-sm text-primary/40">No sales recorded in this range.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Bills Created</TableHead>
                <TableHead>Sales Amount</TableHead>
                <TableHead>Revenue Generated</TableHead>
                <TableHead>Profit Generated</TableHead>
                <TableHead>Average Bill Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.employeeName}>
                  <TableCell className="font-medium text-primary">{r.employeeName}</TableCell>
                  <TableCell>{r.billsCreated}</TableCell>
                  <TableCell>{formatCurrency(r.salesAmount, currency)}</TableCell>
                  <TableCell>{formatCurrency(r.revenue, currency)}</TableCell>
                  <TableCell className="text-success">{formatCurrency(r.profit, currency)}</TableCell>
                  <TableCell>{formatCurrency(r.avgBillValue, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ReportShell>
    </div>
  );
}
