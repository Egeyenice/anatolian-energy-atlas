import { afterEach, describe, expect, it, vi } from "vitest";
import { fmtHistoryRange, historyHighlights, isDailyDataStale, isPartialMonth, latestHistoryDate, latestHistoryYear, type DailyHistoryDay } from "./daily";

function day(date: string, hoursAvailable = 24): DailyHistoryDay {
  return { date, hoursAvailable, totalGWh: 100, renewableShare: 50,
    totalsGWh: { coal: 50, gas: 0, hydro: 50, wind: 0, solar: 0, other_renewables: 0, other_fossil: 0, other: 0 } };
}
const monthDays = (year: number, month: number, count: number) =>
  Array.from({ length: count }, (_, i) => day(`${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`));

afterEach(() => vi.useRealTimers());

describe("Home daily history", () => {
  it("finds the highest and lowest rolling seven-day average, not fixed calendar weeks", () => {
    const days = monthDays(2026, 5, 14).map((d, i) => ({ ...d, renewableShare: i < 7 ? 20 : 80 }));
    const result = historyHighlights(days.reverse());
    expect(result.greenestWeek).toEqual({ start: "2026-05-08", end: "2026-05-14", average: 80 });
    expect(result.leastGreenWeek).toEqual({ start: "2026-05-01", end: "2026-05-07", average: 20 });
  });

  it("excludes incomplete days, older years, duplicates and periods with missing dates", () => {
    const days = monthDays(2026, 5, 8).filter((d) => d.date !== "2026-05-04");
    const result = historyHighlights([...days, day("2026-05-04", 23), day("2025-12-31"), day("2027-01-01", 12), days[0] ?? day("2026-05-01")]);
    expect(result.totalDays).toBe(7);
    expect(result.greenestWeek).toBeUndefined();
    expect(result.leastGreenWeek).toBeUndefined();
  });

  it("selects the record day by renewable share", () => {
    expect(historyHighlights([
      { ...day("2026-05-28"), renewableShare: 70 },
      { ...day("2026-05-29"), renewableShare: 90 },
      { ...day("2026-05-30"), renewableShare: 80 },
    ]).recordDay?.date).toBe("2026-05-29");
  });

  it("counts only shares strictly above 50 percent against all complete days", () => {
    const result = historyHighlights([49, 50, 51, 80].map((share, i) => ({ ...day(`2026-05-0${i + 1}`), renewableShare: share })));
    expect(result.above50).toBe(2);
    expect(result.totalDays).toBe(4);
    expect(historyHighlights([]).totalDays).toBe(0);
  });

  it("formats compact dates within and across months", () => {
    expect(fmtHistoryRange("2026-05-24", "2026-05-30")).toBe("24–30 May");
    expect(fmtHistoryRange("2026-05-29")).toBe("29 May");
    expect(fmtHistoryRange("2026-05-28", "2026-06-03")).toBe("28 May–3 June");
  });
  it("treats the data date as stale only when it is more than two calendar days old", () => {
    const now = new Date("2026-10-21T23:59:59Z");
    expect(isDailyDataStale("2026-10-21", now)).toBe(false);
    expect(isDailyDataStale("2026-10-19", now)).toBe(false);
    expect(isDailyDataStale("2026-10-18", now)).toBe(true);
    expect(isDailyDataStale("2026-12-31", new Date("2027-01-03T00:00:00Z"))).toBe(true);
  });

  it("takes the latest note date from history regardless of array order or chart-year filtering", () => {
    expect(latestHistoryDate([day("2026-10-21"), day("2025-12-31"), day("2026-10-20")])).toBe("2026-10-21");
    expect(latestHistoryDate([day("2026-12-31"), day("2027-01-01", 12)])).toBe("2027-01-01");
    expect(latestHistoryDate([])).toBeUndefined();
  });
  it("marks months partial only when complete daily data covers fewer than the calendar month's days", () => {
    expect(isPartialMonth(2026, 0, monthDays(2026, 1, 31))).toBe(false);
    expect(isPartialMonth(2026, 0, monthDays(2026, 1, 30))).toBe(true);
    expect(isPartialMonth(2026, 1, monthDays(2026, 2, 28))).toBe(false);
    expect(isPartialMonth(2024, 1, monthDays(2024, 2, 28))).toBe(true);
    expect(isPartialMonth(2024, 1, monthDays(2024, 2, 29))).toBe(false);
    expect(isPartialMonth(2026, 0, [...monthDays(2026, 1, 30), day("2026-01-30")])).toBe(true);
    expect(isPartialMonth(2026, 0, [...monthDays(2026, 1, 30), day("2026-01-31", 23)])).toBe(true);
  });

  it("keeps the most recent available calendar year on 1 January until new usable data arrives", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T12:00:00Z"));
    const history = [day("2026-12-31"), day("2025-12-31"), day("2026-01-01")];
    expect(latestHistoryYear(history).map((d) => d.date)).toEqual(["2026-01-01", "2026-12-31"]);
    expect(latestHistoryYear([...history, day("2027-01-01")]).map((d) => d.date)).toEqual(["2027-01-01"]);
    expect(latestHistoryYear([...history, day("2027-01-01", 12)]).map((d) => d.date)).toEqual(["2026-01-01", "2026-12-31"]);
    expect(latestHistoryYear([])).toEqual([]);
  });
});