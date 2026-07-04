"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { creditPaymentSchema, type CreditPaymentInput } from "@/lib/validations/credit-payment";
import { recordCreditPayment } from "@/actions/credit-payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet } from "lucide-react";

export function RecordPaymentDialog({ billId, balanceDue }: { billId: string; balanceDue: number }) {
  const [open, setOpen] = React.useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<CreditPaymentInput>({
      resolver: zodResolver(creditPaymentSchema),
      defaultValues: { bill_id: billId, amount: balanceDue, method: "cash", notes: "" },
    });

  React.useEffect(() => {
    if (open) reset({ bill_id: billId, amount: balanceDue, method: "cash", notes: "" });
  }, [open, billId, balanceDue, reset]);

  async function onSubmit(values: CreditPaymentInput) {
    const result = await recordCreditPayment(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Payment recorded");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="accent"><Wallet className="h-4 w-4" /> Record Payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("bill_id")} />
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={watch("method")} onValueChange={(v) => setValue("method", v as CreditPaymentInput["method"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register("notes")} placeholder="Optional" />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
