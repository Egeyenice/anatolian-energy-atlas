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
  const year = Math.max(...days.filter((day) => day.hoursAvailable === 24).map((day) => Number(day.date.slice(0, 4))));
  return historyYear(days, year);
}

export function historyYears(days: DailyHistoryDay[]): number[] {
  return [...new Set(days.map((day) => Number(day.date.slice(0, 4))))].sort((a, b) => a - b);
}

export function historyYear(days: DailyHistoryDay[], year: number): DailyHistoryDay[] {
  return [...new Map(days.filter((day) => day.hoursAvailable === 24 && Number(day.date.slice(0, 4)) === year)
    .map((day) => [day.date, day])).values()]
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function defaultHistoryYear(days: DailyHistoryDay[]): number | undefined {
  const years = historyYears(days).reverse();
  return years.find((year) => historyYear(days, year).length >= 60)
    ?? years.find((year) => historyYear(days, year).length > 0);
}

/** Resolve the year every daily section shows: a tab choice that has data, otherwise the default year. */
export function selectedHistoryYear(days: DailyHistoryDay[], chosen: number | undefined): number | undefined {
  const years = historyYears(days);
  return chosen !== undefined && years.includes(chosen) ? chosen : defaultHistoryYear(days) ?? years.at(-1);
}

export function hasHistoryNotes(year: number): boolean {
  return year === 2026;
}

/** Rank source shares using aggregated generation, not averages of daily percentages. */
export function monthlyHistoryHighlights(history: DailyHistoryDay[], year: number) {
  const months = new Map<string, DailyHistoryDay[]>();
  for (const day of historyYear(history, year)) {
    const month = day.date.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), day]);
  }
  const eligible = [...months.entries()].filter(([, days]) => days.length >= 20).map(([month, days]) => {
    const total = days.reduce((sum, day) => sum + Object.values(day.totalsGWh).reduce((a, b) => a + b, 0), 0);
    const share = (source: DailySource) => total > 0 ? days.reduce((sum, day) => sum + day.totalsGWh[source], 0) / total * 100 : 0;
    return { month, hydro: share("hydro"), gas: share("gas"), wind: share("wind"), total };
  }).filter((month) => month.total > 0);
  const highest = (source: "hydro" | "gas" | "wind") => eligible.reduce<{ month: string; share: number } | undefined>((best, month) =>
    !best || month[source] > best.share ? { month: month.month, share: month[source] } : best, undefined);
  return { hydro: highest("hydro"), gas: highest("gas"), wind: highest("wind") };
}

type HighlightWeek = { start: string; end: string; average: number };

/** Rolling weeks require seven distinct, consecutive complete calendar days. */
export function historyHighlights(history: DailyHistoryDay[]) {
  const days = [...new Map(latestHistoryYear(history).map((day) => [day.date, day])).values()];
  let greenestWeek: HighlightWeek | undefined;
  let leastGreenWeek: HighlightWeek | undefined;
  let recordDay: DailyHistoryDay | undefined;
  for (const day of days) {
    if (!recordDay || day.renewableShare > recordDay.renewableShare) recordDay = day;
  }
  for (let i = 0; i <= days.length - 7; i++) {
    const week = days.slice(i, i + 7);
    const start = week[0];
    const end = week[6];
    if (!start || !end || Date.parse(end.date) - Date.parse(start.date) !== 6 * 86400000) continue;
    const result = { start: start.date, end: end.date, average: week.reduce((sum, day) => sum + day.renewableShare, 0) / 7 };
    if (!greenestWeek || result.average > greenestWeek.average) greenestWeek = result;
    if (!leastGreenWeek || result.average < leastGreenWeek.average) leastGreenWeek = result;
  }
  return { greenestWeek, leastGreenWeek, recordDay, above50: days.filter((day) => day.renewableShare > 50).length, totalDays: days.length };
}

export type DailyRecordSet = {
  year: number;
  recordWindDay: { date: string; windGWh: number };
  recordSolarDay: { date: string; solarGWh: number };
  recordRenewableShareDay: { date: string; renewableShare: number };
};

/** Highest single-day wind, solar and renewable-share values among one year's complete days. */
export function historyRecords(days: DailyHistoryDay[], year: number | undefined): DailyRecordSet | undefined {
  if (year === undefined) return undefined;
  const yearDays = historyYear(days, year);
  if (yearDays.length === 0) return undefined;
  const highest = (value: (day: DailyHistoryDay) => number) =>
    yearDays.reduce<DailyHistoryDay>((best, d) => (value(d) > value(best) ? d : best), yearDays[0]!);
  const wind = highest((d) => d.totalsGWh.wind ?? 0);
  const solar = highest((d) => d.totalsGWh.solar ?? 0);
  const share = highest((d) => d.renewableShare);
  return {
    year,
    recordWindDay: { date: wind.date, windGWh: wind.totalsGWh.wind ?? 0 },
    recordSolarDay: { date: solar.date, solarGWh: solar.totalsGWh.solar ?? 0 },
    recordRenewableShareDay: { date: share.date, renewableShare: share.renewableShare },
  };
}

export function fmtHistoryRange(start: string, end = start): string {
  const format = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  if (start === end) return format(start);
  return start.slice(0, 7) === end.slice(0, 7)
    ? `${Number(start.slice(8, 10))}–${format(end)}`
    : `${format(start)}–${format(end)}`;
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
