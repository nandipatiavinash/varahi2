"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AdvanceOrderFormDialog } from "./advance-order-form-dialog";
import { cancelAdvanceOrder } from "@/actions/advance-orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, Pencil, XCircle, ArrowRightCircle } from "lucide-react";
import type { Database } from "@/types/database.types";

type AdvanceOrder = Database["public"]["Tables"]["advance_orders"]["Row"];

const STATUS_VARIANT: Record<string, "success" | "accent" | "outline"> = {
  pending: "accent",
  completed: "success",
  cancelled: "outline",
};

export function AdvanceOrdersTable({ orders, currency }: { orders: AdvanceOrder[]; currency: string }) {
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this advance order?")) return;
    setBusyId(id);
    const result = await cancelAdvanceOrder(id);
    setBusyId(null);
    if (result?.error) toast.error(result.error);
    else toast.success("Advance order cancelled");
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No advance orders"
        description="Record a customer advance to track pending deliveries."
        action={<AdvanceOrderFormDialog />}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Advance Amount</TableHead>
          <TableHead>Expected Delivery</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id}>
            <TableCell>
              <p className="font-medium text-primary">{o.customer_name}</p>
              <p className="text-xs text-primary/50">{o.customer_mobile}</p>
            </TableCell>
            <TableCell>{formatCurrency(o.advance_amount, currency)}</TableCell>
            <TableCell>{o.expected_delivery_date ? formatDate(o.expected_delivery_date) : "—"}</TableCell>
            <TableCell><Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge></TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                {o.status === "pending" && (
                  <>
                    <Button variant="ghost" size="icon" asChild title="Convert to sale">
                      <Link href={`/sales/new?advance_order_id=${o.id}&customer_name=${encodeURIComponent(o.customer_name)}&customer_mobile=${encodeURIComponent(o.customer_mobile ?? "")}&advance_amount=${o.advance_amount}`}>
                        <ArrowRightCircle className="h-4 w-4 text-info" />
                      </Link>
                    </Button>
                    <AdvanceOrderFormDialog order={o} trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>} />
                    <Button variant="ghost" size="icon" disabled={busyId === o.id} onClick={() => handleCancel(o.id)}>
                      <XCircle className="h-4 w-4 text-danger" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
