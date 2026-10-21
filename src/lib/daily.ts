import { useQuery } from "@tanstack/react-query";
import type { Source } from "@/lib/energy";

export type DailySource = Source | "other";

export type DailyHour = { hour: string } & Record<DailySource, number>;

export type DailyLatest = {
  date: string; // YYYY-MM-DD
  hoursAvailable: number;
  unit: string;
  hours: DailyHour[];
  totalsGWh: Record<DailySource, number>;
  totalGWh: number;
  renewableShare: number;
};

export type DailyRecords = {
  year: number;
  daysCounted: number;
  recordWindDay: { date: string; windGWh: number };
  recordSolarDay: { date: string; solarGWh: number };
  recordRenewableShareDay: { date: string; renewableShare: number };
};

const BASE = "https://raw.githubusercontent.com/Egeyenice/anatolian-energy-atlas/main/public/data/daily";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load data");
  return (await res.json()) as T;
}

export function useDailyLatest() {
  return useQuery({
    queryKey: ["daily-latest"],
    queryFn: () => fetchJson<DailyLatest>(`${BASE}/latest.json`),
    retry: 1,
    staleTime: 30 * 60 * 1000,
  });
}

export function useDailyRecords() {
  return useQuery({
    queryKey: ["daily-records"],
    queryFn: () => fetchJson<DailyRecords>(`${BASE}/records.json`),
    retry: 1,
    staleTime: 30 * 60 * 1000,
  });
}

export type DailyHistoryDay = {
  date: string; // YYYY-MM-DD
  hoursAvailable: number;
  totalGWh: number;
  renewableShare: number;
  totalsGWh: Record<DailySource, number>;
};

export function useDailyHistory() {
  return useQuery({
    queryKey: ["daily-history"],
    queryFn: () => fetchJson<DailyHistoryDay[]>(`${BASE}/history.json`),
    retry: 1,
    staleTime: 30 * 60 * 1000,
  });
}

/** "2026-10-19" -> "19 October 2026" */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(y, m - 1, d),
  );
}
