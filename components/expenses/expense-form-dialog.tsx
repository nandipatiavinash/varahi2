"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { expenseSchema, type ExpenseInput, EXPENSE_CATEGORIES } from "@/lib/validations/expense";
import { createExpense, updateExpense } from "@/actions/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Database } from "@/types/database.types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];

function toFormValues(expense: Expense | undefined, todayStr: string): ExpenseInput {
  return {
    date: expense?.date ?? todayStr,
    category: expense?.category ?? "Miscellaneous",
    amount: expense?.amount ?? 0,
    description: expense?.description ?? "",
  };
}

export function ExpenseFormDialog({ expense, trigger }: { expense?: Expense; trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(expense);
  const todayStr = new Date().toISOString().slice(0, 10);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<ExpenseInput>({
      resolver: zodResolver(expenseSchema),
      defaultValues: toFormValues(expense, todayStr),
    });

  React.useEffect(() => {
    if (open) reset(toFormValues(expense, todayStr));
  }, [open, expense, reset, todayStr]);

  async function onSubmit(values: ExpenseInput) {
    const result = isEdit ? await updateExpense(expense!.id, values) : await createExpense(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Expense updated" : "Expense recorded");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm"><Plus className="h-4 w-4" /> Add Expense</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={watch("category")} onValueChange={(v) => setValue("category", v as ExpenseInput["category"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} placeholder="Optional note" />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
