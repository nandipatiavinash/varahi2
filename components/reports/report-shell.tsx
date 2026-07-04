import { PrintButton } from "@/components/sales/print-button";
import { formatDateTime } from "@/lib/utils";

export function ReportShell({
  businessName,
  businessAddress,
  title,
  appliedFilters,
  children,
}: {
  businessName: string;
  businessAddress?: string | null;
  title: string;
  appliedFilters: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="no-print flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        <PrintButton />
      </div>

      <div className="print-page rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="mb-6 flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              SV
            </div>
            <div>
              <p className="font-semibold text-primary">{businessName}</p>
              {businessAddress && <p className="text-xs text-primary/50">{businessAddress}</p>}
            </div>
          </div>
          <div className="text-right text-xs text-primary/50">
            <p className="text-sm font-medium text-primary">{title}</p>
            <p>Generated {formatDateTime(new Date())}</p>
            <p>Filters: {appliedFilters}</p>
          </div>
        </div>

        {children}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-3 text-xs text-primary/40">
          <span>{businessName} — Sales & Profit Management System</span>
          <span>Page 1</span>
        </div>
      </div>
    </div>
  );
}

export function ReportStat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-xl bg-background p-3">
      <p className="text-xs text-primary/50">{label}</p>
      <p className={`mt-1 text-lg font-semibold text-primary ${valueClass ?? ""}`}>{value}</p>
    </div>
  );
}
