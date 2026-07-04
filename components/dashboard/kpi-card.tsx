import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  sublabel,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "danger" | "accent" | "info";
  sublabel?: string;
}) {
  const toneClass = {
    default: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    danger: "text-danger bg-danger/10",
    accent: "text-accent bg-accent/10",
    info: "text-info bg-info/10",
  }[tone];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-primary/50">{label}</p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-primary/40">{sublabel}</p>}
    </div>
  );
}
