"use client";

import * as React from "react";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductFormDialog } from "./product-form-dialog";
import { deleteProduct } from "@/actions/products";
import { formatCurrency } from "@/lib/utils";
import { Package, Pencil, Trash2 } from "lucide-react";
import type { Database } from "@/types/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function ProductsTable({ products, currency }: { products: Product[]; currency: string }) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteProduct(id);
    setDeletingId(null);
    if (result?.error) toast.error(result.error);
    else toast.success("Product deleted");
  }

  const columns = React.useMemo<ColumnDef<Product, any>[]>(
    () => [
      { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium text-primary">{row.original.name}</span> },
      { accessorKey: "category", header: "Category" },
      {
        accessorKey: "default_purchase_price",
        header: "Purchase Price",
        cell: ({ row }) => formatCurrency(row.original.default_purchase_price, currency),
      },
      {
        accessorKey: "default_selling_price",
        header: "Selling Price",
        cell: ({ row }) => formatCurrency(row.original.default_selling_price, currency),
      },
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
            <ProductFormDialog
              product={row.original}
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
      data={products}
      searchKey="name"
      searchPlaceholder="Search products..."
      emptyIcon={Package}
      emptyTitle="No products yet"
      emptyDescription="Add your first product to start billing."
      emptyAction={<ProductFormDialog />}
    />
  );
}
