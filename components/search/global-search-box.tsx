"use client";

import * as React from "react";
import Link from "next/link";
import { globalSearch } from "@/actions/search";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Receipt, Users, Package } from "lucide-react";

type Results = Awaited<ReturnType<typeof globalSearch>>;

export function GlobalSearchBox({ currency }: { currency: string }) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Results | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const r = await globalSearch(query);
      setResults(r);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/30" />
        <Input
          autoFocus
          placeholder="Search bill number, customer, employee, or product..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!loading && results && (
        <div className="grid gap-4 sm:grid-cols-3">
          <ResultSection title="Bills" icon={Receipt}>
            {results.bills.length === 0 && <EmptyRow />}
            {results.bills.map((b) => (
              <Link key={b.id} href={`/sales/${b.id}`} className="block rounded-lg p-2 hover:bg-background">
                <p className="text-sm font-medium text-primary">{b.bill_number}</p>
                <p className="text-xs text-primary/50">
                  {b.customer_name} · {formatDate(b.bill_date)} · {formatCurrency(b.grand_total, currency)}
                </p>
              </Link>
            ))}
          </ResultSection>

          <ResultSection title="Employees" icon={Users}>
            {results.employees.length === 0 && <EmptyRow />}
            {results.employees.map((e) => (
              <Link key={e.id} href="/employees" className="block rounded-lg p-2 hover:bg-background">
                <p className="text-sm font-medium text-primary">{e.name}</p>
                <p className="text-xs text-primary/50">{e.mobile}</p>
              </Link>
            ))}
          </ResultSection>

          <ResultSection title="Products" icon={Package}>
            {results.products.length === 0 && <EmptyRow />}
            {results.products.map((p) => (
              <Link key={p.id} href="/products" className="block rounded-lg p-2 hover:bg-background">
                <p className="text-sm font-medium text-primary">{p.name}</p>
                <p className="text-xs text-primary/50">{p.category} · {formatCurrency(p.default_selling_price, currency)}</p>
              </Link>
            ))}
          </ResultSection>
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary/70">
          <Icon className="h-4 w-4" /> {title}
        </div>
        <div className="space-y-1">{children}</div>
      </CardContent>
    </Card>
  );
}

function EmptyRow() {
  return <p className="px-2 py-1 text-xs text-primary/40">No matches</p>;
}
