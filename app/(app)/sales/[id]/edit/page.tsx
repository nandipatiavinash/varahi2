import { notFound, redirect } from "next/navigation";
import { getBill } from "@/actions/bills";
import { listProducts } from "@/actions/products";
import { listEmployees } from "@/actions/employees";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { BillForm } from "@/components/billing/bill-form";
import { isSameDay } from "@/lib/utils";

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bill, products, employees, { business }] = await Promise.all([
    getBill(id),
    listProducts(),
    listEmployees(),
    getCurrentBusiness(),
  ]);

  if (!bill) notFound();

  if (bill.locked || !isSameDay(bill.created_at) || bill.status === "voided") {
    redirect(`/sales/${id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Edit Bill {bill.bill_number}</h1>
        <p className="text-sm text-primary/50">Editable only today — locks automatically after midnight.</p>
      </div>
      <BillForm
        mode="edit"
        products={products}
        employees={employees}
        currency={business.currency}
        suggestedBillNumber={bill.bill_number}
        defaultValues={{
          id: bill.id,
          bill_number: bill.bill_number,
          bill_date: bill.bill_date,
          customer_name: bill.customer_name,
          customer_mobile: bill.customer_mobile ?? "",
          employee_id: bill.employee_id,
          items: bill.bill_items.map((i) => ({
            product_id: i.product_id,
            product_name_snapshot: i.product_name_snapshot,
            quantity: i.quantity,
            purchase_price: i.purchase_price,
            selling_price: i.selling_price,
          })),
          discount: bill.discount,
          grand_total_override: bill.grand_total,
          payment_splits: bill.payment_splits.map((s) => ({ method: s.method, amount: s.amount })),
          notes: bill.notes ?? "",
        }}
      />
    </div>
  );
}
