export type Plant = {
  name: string;
  type: "hydro" | "coal" | "gas" | "solar" | "nuclear";
  fuel: string;
  capacity_mw: number;
  lat: number;
  lon: number;
  status: string;
  source: string;
  note: string;
};

export type PlantsData = { note: string; plants: Plant[] };

export const PLANT_COLORS: Record<Plant["type"], string> = {
  hydro: "var(--src-hydro)",
  coal: "var(--src-coal)",
  gas: "var(--src-gas)",
  solar: "var(--src-solar)",
  nuclear: "var(--src-nuclear)",
};

export const PLANT_LABELS: Record<Plant["type"], string> = {
  hydro: "Hydro",
  coal: "Coal",
  gas: "Gas",
  solar: "Solar",
  nuclear: "Nuclear",
};

export const PLANT_TYPES = Object.keys(PLANT_LABELS) as Plant["type"][];

export function plantRadius(capacityMw: number): number {
  return Math.max(6, Math.sqrt(capacityMw) / 3.2);
}

export async function fetchPlants(): Promise<PlantsData> {
  const res = await fetch("/data/plants.json");
  if (!res.ok) throw new Error(`plants.json: ${res.status}`);
  return (await res.json()) as PlantsData;
}
