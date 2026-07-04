import { listCreditOutstanding } from "@/actions/credit-payments";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { CreditOutstandingTable } from "@/components/credit-customers/credit-outstanding-table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function CreditCustomersPage() {
  const [rows, { business }] = await Promise.all([listCreditOutstanding(), getCurrentBusiness()]);
  const totalOutstanding = rows.reduce((sum, r) => sum + Number(r.balance_due), 0);
  const overdueCount = rows.filter((r) => r.is_overdue).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Credit Customers</h1>
        <p className="text-sm text-primary/50">Outstanding balances derived directly from your bills.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm text-primary/50">Total Outstanding</p>
            <p className="mt-1 text-2xl font-semibold text-danger">{formatCurrency(totalOutstanding, business.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-primary/50">Overdue Customers (30+ days)</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>
      <CreditOutstandingTable rows={rows} currency={business.currency} />
    </div>
  );
}
