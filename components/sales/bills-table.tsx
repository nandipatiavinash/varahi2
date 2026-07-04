"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { BillStatusBadge } from "./bill-status-badge";
import { deleteBill, voidBill } from "@/actions/bills";
import { formatCurrency, formatDate, isSameDay } from "@/lib/utils";
import { Receipt, Eye, Trash2, Ban } from "lucide-react";
import type { Database } from "@/types/database.types";

type Bill = Database["public"]["Tables"]["bills"]["Row"] & { employees?: { name: string } | null };

export function BillsTable({ bills, currency }: { bills: Bill[]; currency: string }) {
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this bill permanently? This can only be done on the same day it was created.")) return;
    setBusyId(id);
    const result = await deleteBill(id);
    setBusyId(null);
    if (result?.error) toast.error(result.error);
    else toast.success("Bill deleted");
  }

  async function handleVoid(id: string) {
    if (!confirm("Void this bill? It will be excluded from revenue but kept for history.")) return;
    setBusyId(id);
    const result = await voidBill(id);
    setBusyId(null);
    if (result?.error) toast.error(result.error);
    else toast.success("Bill voided");
  }

  const columns = React.useMemo<ColumnDef<Bill, any>[]>(
    () => [
      {
        accessorKey: "bill_number",
        header: "Bill #",
        cell: ({ row }) => (
          <Link href={`/sales/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.bill_number}
          </Link>
        ),
      },
      { accessorKey: "bill_date", header: "Date", cell: ({ row }) => formatDate(row.original.bill_date), sortingFn: "datetime" },
      { accessorKey: "customer_name", header: "Customer" },
      { id: "employee", header: "Employee", enableSorting: false, cell: ({ row }) => row.original.employees?.name ?? "—" },
      {
        accessorKey: "grand_total",
        header: "Grand Total",
        cell: ({ row }) => formatCurrency(row.original.grand_total, currency),
      },
      {
        accessorKey: "balance_due",
        header: "Balance Due",
        cell: ({ row }) => (
          <span className={row.original.balance_due > 0 ? "text-danger" : "text-success"}>
            {formatCurrency(row.original.balance_due, currency)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <BillStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const bill = row.original;
          const editable = !bill.locked && isSameDay(bill.created_at) && bill.status !== "voided";
          return (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/sales/${bill.id}`}><Eye className="h-4 w-4" /></Link>
              </Button>
              {bill.status !== "voided" && (
                <Button variant="ghost" size="icon" disabled={busyId === bill.id} onClick={() => handleVoid(bill.id)}>
                  <Ban className="h-4 w-4 text-accent" />
                </Button>
              )}
              {editable && (
                <Button variant="ghost" size="icon" disabled={busyId === bill.id} onClick={() => handleDelete(bill.id)}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [currency, busyId]
  );

  return (
    <DataTable
      columns={columns}
      data={bills}
      searchKey="customer_name"
      searchPlaceholder="Search by customer..."
      emptyIcon={Receipt}
      emptyTitle="No sales recorded"
      emptyDescription="Create your first bill to start tracking revenue and profit."
      emptyAction={
        <Button asChild size="sm">
          <Link href="/sales/new">New Sale</Link>
        </Button>
      }
    />
  );
}
