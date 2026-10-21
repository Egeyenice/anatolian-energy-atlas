import { useQuery } from "@tanstack/react-query";

export type Metric = "renewableShare" | "carbonIntensity";
export type Country = {
  name: string;
  highlight: boolean;
  isAggregate: boolean;
  renewableShare: Record<string, number | null>;
  carbonIntensity: Record<string, number | null>;
};
export type ComparisonData = {
  source: string;
  units: Record<Metric, string>;
  referenceLines2025: { worldRenewableShare: number; worldSource: string };
  countries: Country[];
};

export const METRIC_LABELS: Record<Metric, string> = {
  renewableShare: "Renewable share (%)",
  carbonIntensity: "Carbon intensity (gCO2e/kWh)",
};

export function latestYear(d: ComparisonData, m: Metric): number {
  let max = 0;
  for (const c of d.countries) for (const [y, v] of Object.entries(c[m])) if (v != null && +y > max) max = +y;
  return max;
}

export function ranking(d: ComparisonData, m: Metric, year: number) {
  return d.countries
    .map((c) => ({ name: c.name, highlight: c.highlight, isAggregate: c.isAggregate, value: c[m][String(year)] }))
    .filter((r): r is typeof r & { value: number } => r.value != null)
    .sort((a, b) => b.value - a.value);
}

export function timeSeries(d: ComparisonData, m: Metric) {
  const years = new Set<number>();
  d.countries.forEach((c) => Object.keys(c[m]).forEach((y) => years.add(+y)));
  return [...years].sort((a, b) => a - b).map((year) => {
    const row: Record<string, number | null> = { year };
    d.countries.forEach((c) => (row[c.name] = c[m][String(year)] ?? null));
    return row;
  });
}

export function useComparisonData() {
  return useQuery({
    queryKey: ["comparison"],
    queryFn: async (): Promise<ComparisonData> => {
      const r = await fetch("/data/comparison.json");
      if (!r.ok) throw new Error("load failed");
      return r.json();
    },
    staleTime: 60 * 60 * 1000,
  });
}
