export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
}

export function resolveDateRange(preset: DateRangePreset, custom?: DateRange): DateRange {
  const today = new Date();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  switch (preset) {
    case "today":
      return { from: toISO(today), to: toISO(today) };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: toISO(y), to: toISO(y) };
    }
    case "last7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { from: toISO(start), to: toISO(today) };
    }
    case "thisMonth": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toISO(start), to: toISO(today) };
    }
    case "lastMonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toISO(start), to: toISO(end) };
    }
    case "custom":
      return custom ?? { from: toISO(today), to: toISO(today) };
  }
}
