import { useQuery } from "@tanstack/react-query";

export const SOURCES = ["coal", "gas", "other_fossil", "hydro", "wind", "solar", "other_renewables"] as const;
export type Source = (typeof SOURCES)[number];
export const RENEWABLES: Source[] = ["hydro", "wind", "solar", "other_renewables"];

export const SOURCE_LABELS: Record<Source, string> = {
  coal: "Coal",
  gas: "Gas",
  other_fossil: "Other fossil",
  hydro: "Hydro",
  wind: "Wind",
  solar: "Solar",
  other_renewables: "Other renewables",
};

export const SOURCE_COLORS: Record<Source, string> = {
  coal: "var(--src-coal)",
  gas: "var(--src-gas)",
  other_fossil: "var(--src-other-fossil)",
  hydro: "var(--src-hydro)",
  wind: "var(--src-wind)",
  solar: "var(--src-solar)",
  other_renewables: "var(--src-other-renewables)",
};

export type YearRow = { year: number } & Record<Source, number>;
export type EnergyData = { source: string; years: YearRow[] };

export const total = (r: YearRow) => SOURCES.reduce((s, k) => s + (Number(r[k]) || 0), 0);

export function renewableShare(r: YearRow): number {
  const t = total(r);
  if (!t) return 0;
  return (RENEWABLES.reduce((s, k) => s + (Number(r[k]) || 0), 0) / t) * 100;
}

export function toShares(r: YearRow): YearRow {
  const t = total(r);
  const out = { year: r.year } as YearRow;
  for (const k of SOURCES) out[k] = t ? ((Number(r[k]) || 0) / t) * 100 : 0;
  return out;
}

export function largestSource(r: YearRow): Source {
  return SOURCES.reduce((a, b) => ((r[b] || 0) > (r[a] || 0) ? b : a), SOURCES[0]);
}

export function computeStats(years: YearRow[]) {
  const sorted = [...years].sort((a, b) => a.year - b.year);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const base = sorted.find((y) => y.year === 2000) ?? first;
  return {
    latestYear: last.year,
    baseYear: base.year,
    renewableShare: renewableShare(last),
    largest: largestSource(last),
    largestShare: toShares(last)[largestSource(last)],
    changePp: renewableShare(last) - renewableShare(base),
  };
}

export const fmt = (n: number, d = 1) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

export function useEnergyData() {
  return useQuery({
    queryKey: ["energy"],
    queryFn: async (): Promise<EnergyData> => {
      const res = await fetch("/data/energy.json");
      if (!res.ok) throw new Error("Could not load data");
      const d = (await res.json()) as EnergyData;
      return { ...d, years: [...d.years].sort((a, b) => a.year - b.year) };
    },
  });
}
