"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { billSchema, type BillInput } from "@/lib/validations/bill";
import { createBill, updateBill, checkDuplicateBillNumber } from "@/actions/bills";
import { markAdvanceOrderConverted } from "@/actions/advance-orders";
import { calculateBill, calculateLine, calculatePaidAmount } from "@/lib/billing/calculate";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import type { Database } from "@/types/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Employee = Database["public"]["Tables"]["employees"]["Row"];

const PAYMENT_METHODS = ["cash", "upi", "bank", "credit", "advance"] as const;

interface BillFormProps {
  products: Product[];
  employees: Employee[];
  currency: string;
  suggestedBillNumber: string;
  defaultValues?: Partial<BillInput> & { id?: string };
  mode: "create" | "edit";
  advanceOrderId?: string;
}

export function BillForm({ products, employees, currency, suggestedBillNumber, defaultValues, mode, advanceOrderId }: BillFormProps) {
  const router = useRouter();
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BillInput>({
    resolver: zodResolver(billSchema),
    defaultValues: defaultValues ?? {
      bill_number: suggestedBillNumber,
      bill_date: new Date().toISOString().slice(0, 10),
      customer_name: "",
      customer_mobile: "",
      employee_id: null,
      items: [{ product_id: null, product_name_snapshot: "", quantity: 1, purchase_price: 0, selling_price: 0 }],
      discount: 0,
      grand_total_override: null,
      payment_splits: [{ method: "cash", amount: 0 }],
      notes: "",
    },
  });

  const itemsArray = useFieldArray({ control, name: "items" });
  const splitsArray = useFieldArray({ control, name: "payment_splits" });

  const items = watch("items");
  const discount = watch("discount");
  const grandTotalOverride = watch("grand_total_override");
  const paymentSplits = watch("payment_splits");
  const billNumber = watch("bill_number");

  const calc = React.useMemo(
    () =>
      calculateBill({
        items: items.map((i) => ({
          quantity: Number(i.quantity) || 0,
          purchasePrice: Number(i.purchase_price) || 0,
          sellingPrice: Number(i.selling_price) || 0,
        })),
        discount: Number(discount) || 0,
        grandTotalOverride: grandTotalOverride ? Number(grandTotalOverride) : null,
      }),
    [items, discount, grandTotalOverride]
  );

  const paidAmount = calculatePaidAmount(paymentSplits.map((s) => ({ method: s.method, amount: Number(s.amount) || 0 })));
  const balanceDue = calc.grandTotal - paidAmount;

  React.useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!billNumber) return;
      const isDup = await checkDuplicateBillNumber(billNumber, defaultValues?.id);
      setDuplicateWarning(isDup ? `Bill number "${billNumber}" is already used on another invoice.` : null);
    }, 400);
    return () => clearTimeout(timeout);
  }, [billNumber, defaultValues?.id]);

  function handleProductSelect(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setValue(`items.${index}.product_id`, product.id);
    setValue(`items.${index}.product_name_snapshot`, product.name);
    setValue(`items.${index}.purchase_price`, product.default_purchase_price);
    setValue(`items.${index}.selling_price`, product.default_selling_price);
  }

  async function onSubmit(values: BillInput) {
    const result =
      mode === "edit" && defaultValues?.id
        ? await updateBill(defaultValues.id, values)
        : await createBill(values);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    if (mode === "create" && advanceOrderId && "id" in result) {
      await markAdvanceOrderConverted(advanceOrderId, (result as { id: string }).id);
    }

    toast.success(mode === "edit" ? "Bill updated" : "Bill created");
    router.push(mode === "edit" && defaultValues?.id ? `/sales/${defaultValues.id}` : "/sales");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bill_number">Bill Number</Label>
              <Input id="bill_number" {...register("bill_number")} />
              {errors.bill_number && <p className="text-xs text-danger">{errors.bill_number.message}</p>}
              {duplicateWarning && (
                <p className="flex items-center gap-1 text-xs text-accent"><AlertTriangle className="h-3 w-3" /> {duplicateWarning}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill_date">Bill Date</Label>
              <Input id="bill_date" type="date" {...register("bill_date")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input id="customer_name" {...register("customer_name")} placeholder="e.g. Chandra Constructions" />
              {errors.customer_name && <p className="text-xs text-danger">{errors.customer_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer_mobile">Customer Mobile</Label>
              <Input id="customer_mobile" {...register("customer_mobile")} placeholder="9000011111" />
            </div>
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Controller
                control={control}
                name="employee_id"
                render={({ field }) => (
                  <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Products</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  itemsArray.append({ product_id: null, product_name_snapshot: "", quantity: 1, purchase_price: 0, selling_price: 0 })
                }
              >
                <Plus className="h-4 w-4" /> Add Line
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-28">Purchase ₹</TableHead>
                  <TableHead className="w-28">Selling ₹</TableHead>
                  <TableHead className="w-28">Profit</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsArray.fields.map((field, index) => {
                  const line = items[index];
                  const lineCalc = calculateLine({
                    quantity: Number(line?.quantity) || 0,
                    purchasePrice: Number(line?.purchase_price) || 0,
                    sellingPrice: Number(line?.selling_price) || 0,
                  });
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select
                          value={items[index]?.product_id ?? "custom"}
                          onValueChange={(v) => (v === "custom" ? undefined : handleProductSelect(index, v))}
                        >
                          <SelectTrigger className="mb-1"><SelectValue placeholder="Choose product" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom item</SelectItem>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          {...register(`items.${index}.product_name_snapshot`)}
                          placeholder="Item name"
                        />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" {...register(`items.${index}.quantity`)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" {...register(`items.${index}.purchase_price`)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" {...register(`items.${index}.selling_price`)} />
                      </TableCell>
                      <TableCell className={lineCalc.lineProfit >= 0 ? "text-success" : "text-danger"}>
                        {formatCurrency(lineCalc.lineProfit, currency)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={itemsArray.fields.length === 1}
                          onClick={() => itemsArray.remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {errors.items && <p className="text-xs text-danger">{errors.items.message as string}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Payment Split</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => splitsArray.append({ method: "cash", amount: 0 })}
              >
                <Plus className="h-4 w-4" /> Add Method
              </Button>
            </div>
            {splitsArray.fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Controller
                  control={control}
                  name={`payment_splits.${index}.method`}
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Input type="number" step="0.01" {...register(`payment_splits.${index}.amount`)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={splitsArray.fields.length === 1}
                  onClick={() => splitsArray.remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            ))}
            {errors.payment_splits && <p className="text-xs text-danger">{errors.payment_splits.message as string}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Optional notes for this bill" />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="sticky top-20">
          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-primary/70">Invoice Summary</p>
            <div className="space-y-2 text-sm">
              <Row label="Revenue (Subtotal)" value={formatCurrency(calc.subtotal, currency)} />
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="discount" className="text-primary/60">Discount</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  className="w-32 text-right"
                  {...register("discount")}
                />
              </div>
              <Row label="Gross Profit" value={formatCurrency(calc.grossProfit, currency)} valueClass="text-success font-medium" />
              <Row label="Computed Total" value={formatCurrency(calc.computedGrandTotal, currency)} />
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="grand_total_override" className="text-primary/60">Grand Total (editable)</Label>
                <Input
                  id="grand_total_override"
                  type="number"
                  step="0.01"
                  className="w-32 text-right"
                  placeholder={String(calc.computedGrandTotal)}
                  {...register("grand_total_override")}
                />
              </div>
              <hr className="border-border" />
              <Row label="Amount Received" value={formatCurrency(paidAmount, currency)} />
              <Row
                label="Balance Due"
                value={formatCurrency(balanceDue, currency)}
                valueClass={balanceDue > 0 ? "text-danger font-semibold" : "text-success font-semibold"}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Bill"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-primary/60">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
