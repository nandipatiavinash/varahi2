import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wrench } from "lucide-react";
import type { Database } from "@/types/database.types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];

export function RecentExpensesTable({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  if (expenses.length === 0) {
    return <EmptyState icon={Wrench} title="No recent expenses" description="Expenses in this date range will appear here." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((e) => (
          <TableRow key={e.id}>
            <TableCell>{formatDate(e.date)}</TableCell>
            <TableCell><Badge>{e.category}</Badge></TableCell>
            <TableCell className="text-primary/60">{e.description || "—"}</TableCell>
            <TableCell className="font-medium text-danger">{formatCurrency(e.amount, currency)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
