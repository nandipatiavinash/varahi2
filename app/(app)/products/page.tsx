import { listProducts } from "@/actions/products";
import { getCurrentBusiness } from "@/lib/supabase/server";
import { ProductsTable } from "@/components/products/products-table";
import { ProductFormDialog } from "@/components/products/product-form-dialog";

export default async function ProductsPage() {
  const [products, { business }] = await Promise.all([listProducts(), getCurrentBusiness()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Products</h1>
          <p className="text-sm text-primary/50">
            Manage your product catalog. Prices here are defaults only — editable per bill.
          </p>
        </div>
        <ProductFormDialog />
      </div>
      <ProductsTable products={products} currency={business.currency} />
    </div>
  );
}
