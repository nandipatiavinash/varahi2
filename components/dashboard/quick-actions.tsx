import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Package, Wrench, FileBarChart } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <Link href="/sales/new"><Plus className="h-4 w-4" /> New Sale</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/products"><Package className="h-4 w-4" /> Add Product</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/expenses"><Wrench className="h-4 w-4" /> Add Expense</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/reports"><FileBarChart className="h-4 w-4" /> Reports</Link>
      </Button>
    </div>
  );
}
