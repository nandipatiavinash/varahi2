"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

export function DateRangeFilter({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = React.useState(current === "custom");

  function updateParam(preset: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", preset);
    setShowCustom(preset === "custom");
    if (preset !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  function updateCustomDate(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    params.set(key, value);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={current} onValueChange={updateParam}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showCustom && (
        <>
          <Input type="date" className="w-40" defaultValue={searchParams.get("from") ?? ""} onChange={(e) => updateCustomDate("from", e.target.value)} />
          <span className="text-primary/40">to</span>
          <Input type="date" className="w-40" defaultValue={searchParams.get("to") ?? ""} onChange={(e) => updateCustomDate("to", e.target.value)} />
        </>
      )}
    </div>
  );
}
