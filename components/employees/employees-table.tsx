"use client";

import * as React from "react";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { deleteEmployee } from "@/actions/employees";
import { Users, Pencil, Trash2 } from "lucide-react";
import type { Database } from "@/types/database.types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

export function EmployeesTable({ employees }: { employees: Employee[] }) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteEmployee(id);
    setDeletingId(null);
    if (result?.error) toast.error(result.error);
    else toast.success("Employee removed");
  }

  const columns = React.useMemo<ColumnDef<Employee, any>[]>(
    () => [
      { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium text-primary">{row.original.name}</span> },
      { accessorKey: "mobile", header: "Mobile", cell: ({ row }) => row.original.mobile || "—" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "active" ? "success" : "outline"}>{row.original.status}</Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <EmployeeFormDialog
              employee={row.original}
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
    [deletingId]
  );

  return (
    <DataTable
      columns={columns}
      data={employees}
      searchKey="name"
      searchPlaceholder="Search employees..."
      emptyIcon={Users}
      emptyTitle="No employees yet"
      emptyDescription="Add employees to track who sold what."
      emptyAction={<EmployeeFormDialog />}
    />
  );
}
