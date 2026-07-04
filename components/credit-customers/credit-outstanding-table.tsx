"use client";

import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecordPaymentDialog } from "@/components/sales/record-payment-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, Eye } from "lucide-react";
import type { Database } from "@/types/database.types";

type CreditRow = Database["public"]["Views"]["v_credit_outstanding"]["Row"];

export function CreditOutstandingTable({ rows, currency }: { rows: CreditRow[]; currency: string }) {
  const columns = React.useMemo<ColumnDef<CreditRow, any>[]>(
    () => [
      {
        accessorKey: "bill_number",
        header: "Bill #",
        cell: ({ row }) => <span className="font-medium text-primary">{row.original.bill_number}</span>,
      },
      {
        accessorKey: "customer_name",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <p>{row.original.customer_name}</p>
            <p className="text-xs text-primary/50">{row.original.customer_mobile}</p>
          </div>
        ),
      },
      { accessorKey: "bill_date", header: "Bill Date", cell: ({ row }) => formatDate(row.original.bill_date), sortingFn: "datetime" },
      { accessorKey: "grand_total", header: "Grand Total", cell: ({ row }) => formatCurrency(row.original.grand_total, currency) },
      { accessorKey: "paid_amount", header: "Paid", cell: ({ row }) => formatCurrency(row.original.paid_amount, currency) },
      {
        accessorKey: "balance_due",
        header: "Balance Due",
        cell: ({ row }) => <span className="font-medium text-danger">{formatCurrency(row.original.balance_due, currency)}</span>,
      },
      {
        accessorKey: "is_overdue",
        header: "Status",
        cell: ({ row }) => (row.original.is_overdue ? <Badge variant="danger">Overdue</Badge> : <Badge variant="accent">Pending</Badge>),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/sales/${row.original.bill_id}`}><Eye className="h-4 w-4" /></Link>
            </Button>
            <RecordPaymentDialog billId={row.original.bill_id} balanceDue={row.original.balance_due} />
          </div>
        ),
      },
    ],
    [currency]
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchKey="customer_name"
      searchPlaceholder="Search by customer..."
      emptyIcon={CreditCard}
      emptyTitle="No outstanding credit"
      emptyDescription="All customer balances are settled."
    />
  );
}
