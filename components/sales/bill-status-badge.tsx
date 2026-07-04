import { Badge } from "@/components/ui/badge";

const VARIANT: Record<string, "success" | "accent" | "danger" | "outline"> = {
  paid: "success",
  partial: "accent",
  credit: "danger",
  voided: "outline",
};

export function BillStatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANT[status] ?? "outline"}>{status.toUpperCase()}</Badge>;
}
