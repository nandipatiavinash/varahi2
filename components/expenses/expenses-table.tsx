"use client";

import * as React from "react";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { deleteExpense } from "@/actions/expenses";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wrench, Pencil, Trash2 } from "lucide-react";
import type { Database } from "@/types/database.types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];

const CATEGORY_VARIANT: Record<string, "default" | "danger" | "accent" | "info"> = {
  Rent: "default",
  Electricity: "info",
  Fuel: "accent",
  Transport: "accent",
  Maintenance: "danger",
  Miscellaneous: "default",
};

export function ExpensesTable({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteExpense(id);
    setDeletingId(null);
    if (result?.error) toast.error(result.error);
    else toast.success("Expense deleted");
  }

  const columns = React.useMemo<ColumnDef<Expense, any>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.date),
        sortingFn: "datetime",
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <Badge variant={CATEGORY_VARIANT[row.original.category] ?? "default"}>{row.original.category}</Badge>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <span className="text-primary/70">{row.original.description || "—"}</span>,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => <span className="font-medium text-danger">{formatCurrency(row.original.amount, currency)}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <ExpenseFormDialog
              expense={row.original}
              trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
            />
            <Button
              variant="ghost"
              size="icon"
              disabled={deletingId === row.original.id}
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        ),
      },
    ],
    [currency, deletingId]
  );

  return (
    <DataTable
      columns={columns}
      data={expenses}
      searchKey="description"
      searchPlaceholder="Search expenses..."
      emptyIcon={Wrench}
      emptyTitle="No expenses recorded"
      emptyDescription="Track rent, electricity, fuel and other costs here."
      emptyAction={<ExpenseFormDialog />}
    />
  );
}
