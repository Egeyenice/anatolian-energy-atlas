import { useQuery } from "@tanstack/react-query";

export type CapacityRow = {
  year: number;
  solar_capacity_gw: number;
  wind_capacity_gw: number;
  solar_generation_twh: number;
  wind_generation_twh: number;
  solar_capacity_factor: number | null;
  wind_capacity_factor: number | null;
};

export type CapacityData = {
  capacity_source: string;
  generation_source: string;
  capacity_factor_method: string;
  note: string;
  years: CapacityRow[];
};

export function comparisonYears(years: CapacityRow[]) {
  return years.filter((row) => row.year >= 2015 && row.year <= 2025).sort((a, b) => a.year - b.year);
}

export function useCapacityData() {
  return useQuery({
    queryKey: ["capacity"],
    queryFn: async (): Promise<CapacityData> => {
      const response = await fetch("/data/capacity.json");
      if (!response.ok) throw new Error("Could not load capacity data");
      return response.json();
    },
  });
}