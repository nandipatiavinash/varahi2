"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReportDatePicker({ paramName = "date", label = "Date" }: { paramName?: string; label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="no-print flex items-center gap-2">
      <Label htmlFor={paramName}>{label}</Label>
      <Input
        id={paramName}
        type={paramName === "month" ? "month" : "date"}
        className="w-44"
        defaultValue={searchParams.get(paramName) ?? ""}
        onChange={(e) => update(e.target.value)}
      />
    </div>
  );
}

export function ReportRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="no-print flex items-center gap-2">
      <Label>From</Label>
      <Input type="date" className="w-40" defaultValue={searchParams.get("from") ?? ""} onChange={(e) => update("from", e.target.value)} />
      <Label>To</Label>
      <Input type="date" className="w-40" defaultValue={searchParams.get("to") ?? ""} onChange={(e) => update("to", e.target.value)} />
    </div>
  );
}
