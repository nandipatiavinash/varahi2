import { getProfitLossReport } from "@/actions/reports";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { ReportShell } from "@/components/reports/report-shell";
import { ReportRangePicker } from "@/components/reports/report-date-picker";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ProfitLossReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const monthStart = new Date();
  monthStart.setDate(1);
  const from = params.from || monthStart.toISOString().slice(0, 10);
  const to = params.to || new Date().toISOString().slice(0, 10);

  const [report, { business }] = await Promise.all([getProfitLossReport(from, to), getCurrentBusiness()]);
  const currency = business.currency;

  const rows = [
    { label: "Revenue", value: report.revenue, sign: "+" },
    { label: "Cost of Goods Sold", value: report.costOfGoodsSold, sign: "-" },
    { label: "Gross Profit", value: report.grossProfit, bold: true },
    { label: "Expenses", value: report.expenses, sign: "-" },
    { label: "Net Profit", value: report.netProfit, bold: true, final: true },
  ];

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-end">
        <ReportRangePicker />
      </div>
      <ReportShell
        businessName={business.name}
        businessAddress={business.address}
        title="Profit & Loss Report"
        appliedFilters={`${formatDate(from)} – ${formatDate(to)}`}
      >
        <div className="mx-auto max-w-md divide-y divide-border">
          {rows.map((r) => (
            <div
              key={r.label}
              className={`flex items-center justify-between py-3 ${r.final ? "border-t-2 border-primary pt-4" : ""}`}
            >
              <span className={r.bold ? "font-semibold text-primary" : "text-primary/70"}>{r.label}</span>
              <span
                className={
                  r.final
                    ? report.netProfit >= 0
                      ? "text-lg font-bold text-success"
                      : "text-lg font-bold text-danger"
                    : r.bold
                    ? "font-semibold text-primary"
                    : "text-primary/70"
                }
              >
                {r.sign === "-" ? "− " : ""}
                {formatCurrency(Math.abs(r.value), currency)}
              </span>
            </div>
          ))}
        </div>
      </ReportShell>
    </div>
  );
}
