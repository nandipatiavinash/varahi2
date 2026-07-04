import { getCurrentBusiness } from "@/lib/supabase/server";
import { GlobalSearchBox } from "@/components/search/global-search-box";

export default async function SearchPage() {
  const { business } = await getCurrentBusiness();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Search</h1>
        <p className="text-sm text-primary/50">Find bills, customers, employees, or products instantly.</p>
      </div>
      <GlobalSearchBox currency={business.currency} />
    </div>
  );
}
