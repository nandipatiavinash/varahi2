import { listAdvanceOrders } from "@/actions/advance-orders";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { AdvanceOrdersTable } from "@/components/advance-orders/advance-orders-table";
import { AdvanceOrderFormDialog } from "@/components/advance-orders/advance-order-form-dialog";

export default async function AdvanceOrdersPage() {
  const [orders, { business }] = await Promise.all([listAdvanceOrders(), getCurrentBusiness()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Advance Orders</h1>
          <p className="text-sm text-primary/50">Customer deposits collected ahead of delivery.</p>
        </div>
        <AdvanceOrderFormDialog />
      </div>
      <AdvanceOrdersTable orders={orders} currency={business.currency} />
    </div>
  );
}
