"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { advanceOrderSchema, type AdvanceOrderInput } from "@/lib/validations/advance-order";
import { createAdvanceOrder, updateAdvanceOrder } from "@/actions/advance-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Database } from "@/types/database.types";

type AdvanceOrder = Database["public"]["Tables"]["advance_orders"]["Row"];

function toFormValues(order?: AdvanceOrder): AdvanceOrderInput {
  return {
    customer_name: order?.customer_name ?? "",
    customer_mobile: order?.customer_mobile ?? "",
    advance_amount: order?.advance_amount ?? 0,
    expected_delivery_date: order?.expected_delivery_date ?? "",
    notes: order?.notes ?? "",
    status: order?.status ?? "pending",
  };
}

export function AdvanceOrderFormDialog({ order, trigger }: { order?: AdvanceOrder; trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(order);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AdvanceOrderInput>({
    resolver: zodResolver(advanceOrderSchema),
    defaultValues: toFormValues(order),
  });

  React.useEffect(() => {
    if (open) {
      reset(toFormValues(order));
    }
  }, [open, order, reset]);

  async function onSubmit(values: AdvanceOrderInput) {
    const result = isEdit ? await updateAdvanceOrder(order!.id, values) : await createAdvanceOrder(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Advance order updated" : "Advance order recorded");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> New Advance Order</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Advance Order" : "New Advance Order"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customer_name">Customer Name</Label>
            <Input id="customer_name" {...register("customer_name")} />
            {errors.customer_name && <p className="text-xs text-danger">{errors.customer_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer_mobile">Mobile Number</Label>
            <Input id="customer_mobile" {...register("customer_mobile")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="advance_amount">Advance Amount</Label>
            <Input id="advance_amount" type="number" step="0.01" {...register("advance_amount")} />
            {errors.advance_amount && <p className="text-xs text-danger">{errors.advance_amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
            <Input id="expected_delivery_date" type="date" {...register("expected_delivery_date")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Record Advance"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
