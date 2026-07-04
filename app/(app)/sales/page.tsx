import Link from "next/link";
import { listBills } from "@/actions/bills";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { BillsTable } from "@/components/sales/bills-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const [bills, { business }] = await Promise.all([
    listBills(search ? { search } : undefined),
    getCurrentBusiness(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Sales</h1>
          <p className="text-sm text-primary/50">
            Bills can be edited or deleted only on the day they&apos;re created — after that they lock.
          </p>
        </div>
        <Button asChild>
          <Link href="/sales/new"><Plus className="h-4 w-4" /> New Sale</Link>
        </Button>
      </div>
      <BillsTable bills={bills} currency={business.currency} />
    </div>
  );
}
