import { listProducts } from "@/actions/products";
import { listEmployees } from "@/actions/employees";
import { suggestNextBillNumber } from "@/actions/bills";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { BillForm } from "@/components/billing/bill-form";

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{
    advance_order_id?: string;
    customer_name?: string;
    customer_mobile?: string;
    advance_amount?: string;
  }>;
}) {
  const params = await searchParams;
  const [products, employees, suggestedBillNumber, { business }] = await Promise.all([
    listProducts(),
    listEmployees(),
    suggestNextBillNumber(),
    getCurrentBusiness(),
  ]);

  const fromAdvance = Boolean(params.advance_order_id);
  const advanceAmount = Number(params.advance_amount || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">New Sale</h1>
        <p className="text-sm text-primary/50">
          {fromAdvance
            ? "Converting an advance order into a sale — the advance amount is pre-filled as a payment method."
            : "Add products, adjust pricing, and record payment."}
        </p>
      </div>
      <BillForm
        mode="create"
        products={products}
        employees={employees}
        currency={business.currency}
        suggestedBillNumber={suggestedBillNumber}
        advanceOrderId={params.advance_order_id}
        defaultValues={
          fromAdvance
            ? {
                bill_number: suggestedBillNumber,
                bill_date: new Date().toISOString().slice(0, 10),
                customer_name: params.customer_name ?? "",
                customer_mobile: params.customer_mobile ?? "",
                employee_id: null,
                items: [{ product_id: null, product_name_snapshot: "", quantity: 1, purchase_price: 0, selling_price: 0 }],
                discount: 0,
                grand_total_override: null,
                payment_splits: [{ method: "advance", amount: advanceAmount }],
                notes: "Converted from advance order.",
              }
            : undefined
        }
      />
    </div>
  );
}
