import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { BillStatusBadge } from "@/components/sales/bill-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt } from "lucide-react";
import type { Database } from "@/types/database.types";

type Bill = Database["public"]["Tables"]["bills"]["Row"];

export function RecentBillsTable({ bills, currency }: { bills: Bill[]; currency: string }) {
  if (bills.length === 0) {
    return <EmptyState icon={Receipt} title="No recent sales" description="Bills in this date range will appear here." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bill #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((b) => (
          <TableRow key={b.id}>
            <TableCell>
              <Link href={`/sales/${b.id}`} className="font-medium text-primary hover:underline">{b.bill_number}</Link>
            </TableCell>
            <TableCell>{formatDate(b.bill_date)}</TableCell>
            <TableCell>{b.customer_name}</TableCell>
            <TableCell>{formatCurrency(b.grand_total, currency)}</TableCell>
            <TableCell><BillStatusBadge status={b.status} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
