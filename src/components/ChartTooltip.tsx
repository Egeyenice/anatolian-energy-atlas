import { fmt } from "@/lib/energy";

type P = { name?: string; value?: number; color?: string; payload?: unknown };

export function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: P[]; label?: string | number; unit: string }) {
  if (!active || !payload?.length) return null;
  const items = [...payload].reverse();
  return (
    <div className="rounded-sm border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold text-popover-foreground">{label}</p>
      {items.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium tabular-nums text-popover-foreground">{fmt(Number(p.value))}{unit}</span>
        </div>
      ))}
    </div>
  );
}
