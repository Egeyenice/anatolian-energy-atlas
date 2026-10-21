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

export function latestHistoryDate(days: DailyHistoryDay[]): string | undefined {
  return days.reduce<string | undefined>((latest, day) =>
    !latest || day.date > latest ? day.date : latest, undefined);
}

/** Compare date-only calendar days so a two-day-old date stays fresh throughout the day. */
export function isDailyDataStale(date: string, now: Date): boolean {
  const dataDay = Date.parse(`${date}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return today - dataDay > 2 * 86400000;
}

/** Select the latest year represented by usable daily data, independent of today's date. */
export function latestHistoryYear(days: DailyHistoryDay[]): DailyHistoryDay[] {
  const complete = days.filter((day) => day.hoursAvailable === 24);
  const year = Math.max(...complete.map((day) => Number(day.date.slice(0, 4))));
  return complete
    .filter((day) => Number(day.date.slice(0, 4)) === year)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function isPartialMonth(year: number, month: number, days: DailyHistoryDay[]): boolean {
  const dates = new Set(days.filter((day) =>
    day.hoursAvailable === 24 && Number(day.date.slice(0, 4)) === year &&
    Number(day.date.slice(5, 7)) - 1 === month,
  ).map((day) => day.date));
  return dates.size < new Date(year, month + 1, 0).getDate();
}

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
