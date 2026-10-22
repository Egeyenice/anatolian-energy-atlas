import { afterEach, describe, expect, it, vi } from "vitest";
import { hasHistoryNotes, defaultHistoryYear, historyYear, historyYears, monthlyHistoryHighlights, fmtHistoryRange, historyHighlights, isDailyDataStale, isPartialMonth, latestHistoryDate, latestHistoryYear, historyRecords, selectedHistoryYear, type DailyHistoryDay } from "./daily";

function day(date: string, hoursAvailable = 24): DailyHistoryDay {
  return { date, hoursAvailable, totalGWh: 100, renewableShare: 50,
    totalsGWh: { coal: 50, gas: 0, hydro: 50, wind: 0, solar: 0, other_renewables: 0, other_fossil: 0, other: 0 } };
}
const monthDays = (year: number, month: number, count: number) =>
  Array.from({ length: count }, (_, i) => day(`${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`));

afterEach(() => vi.useRealTimers());

describe("Home daily history", () => {
  it("makes the year-specific written notes available only for 2026", () => {
    expect(hasHistoryNotes(2026)).toBe(true);
    expect(hasHistoryNotes(2025)).toBe(false);
    expect(hasHistoryNotes(2027)).toBe(false);
  });
  it("defaults to the most recent year with at least 60 distinct complete days", () => {
    const previous = [...monthDays(2026, 1, 31), ...monthDays(2026, 2, 28), day("2026-03-01")];
    const next = [...monthDays(2027, 1, 31), ...monthDays(2027, 2, 28)];
    expect(defaultHistoryYear([...previous, ...next, next[0] ?? day("2027-01-01"), day("2027-03-01", 23)])).toBe(2026);
    expect(defaultHistoryYear([...previous, ...next, day("2027-03-01")])).toBe(2027);
    expect(defaultHistoryYear([day("2026-01-01")])).toBe(2026);
    expect(defaultHistoryYear([])).toBeUndefined();
  });

  it("lists every data year while selected-year calculations use distinct 24-hour days only", () => {
    const days = [day("2025-12-31"), day("2026-01-01"), day("2026-01-01"), day("2026-01-02", 23), day("2027-01-01", 12)];
    expect(historyYears(days)).toEqual([2025, 2026, 2027]);
    expect(historyYear(days, 2026).map((d) => d.date)).toEqual(["2026-01-01"]);
    expect(historyHighlights(historyYear(days, 2025)).recordDay?.date).toBe("2025-12-31");
  });

  it("counts months with at least 20 distinct complete days for monthly highlights", () => {
    const eligible = monthDays(2026, 1, 20);
    const short = monthDays(2026, 2, 19).map((d) => ({ ...d, totalsGWh: { ...d.totalsGWh, hydro: 100, coal: 0 } }));
    expect(monthlyHistoryHighlights([...eligible, ...short, short[0] ?? day("2026-02-01"), day("2026-02-20", 23)], 2026).hydro).toEqual({ month: "2026-01", share: 50 });
    expect(monthlyHistoryHighlights(short, 2026).hydro).toBeUndefined();
  });

  it("ranks hydro, gas and wind by aggregated monthly generation share for the selected year", () => {
    const month = (m: number, hydro: number, gas: number, wind: number) => monthDays(2026, m, 20).map((d) => ({ ...d, totalsGWh: { ...d.totalsGWh, coal: 0, hydro, gas, wind } }));
    const days = [...month(1, 60, 30, 10), ...month(2, 10, 70, 20), ...month(3, 20, 10, 70)];
    expect(monthlyHistoryHighlights(days, 2026)).toEqual({ hydro: { month: "2026-01", share: 60 }, gas: { month: "2026-02", share: 70 }, wind: { month: "2026-03", share: 70 } });
    expect(monthlyHistoryHighlights(days, 2025).gas).toBeUndefined();
    const weighted = monthDays(2026, 4, 20).map((d, i) => ({ ...d, totalsGWh: { ...d.totalsGWh, coal: i ? 1 : 100, hydro: i ? 1 : 0 } }));
    expect(monthlyHistoryHighlights(weighted, 2026).hydro?.share).toBeCloseTo(19 / 138 * 100);
  });

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

  it("computes record wind, solar and renewable-share days from complete days of the selected year only", () => {
    const rec = (date: string, hoursAvailable: number, wind: number, solar: number, renewableShare: number): DailyHistoryDay => ({
      ...day(date, hoursAvailable),
      totalsGWh: { ...day(date, hoursAvailable).totalsGWh, wind, solar },
      renewableShare,
    });
    const days = [
      rec("2025-07-30", 24, 400, 400, 99),
      rec("2026-07-30", 24, 263.12, 10, 40),
      rec("2026-06-30", 24, 100, 40.81, 40),
      rec("2026-05-29", 24, 500, 500, 99),
      rec("2026-05-29", 24, 50, 5, 78.2),
      rec("2026-08-01", 23, 999, 999, 99),
    ];
    expect(historyRecords(days, 2026)).toEqual({
      year: 2026,
      recordWindDay: { date: "2026-07-30", windGWh: 263.12 },
      recordSolarDay: { date: "2026-06-30", solarGWh: 40.81 },
      recordRenewableShareDay: { date: "2026-05-29", renewableShare: 78.2 },
    });
    expect(historyRecords(days, 2025)?.recordWindDay).toEqual({ date: "2025-07-30", windGWh: 400 });
    expect(historyRecords(days, 2024)).toBeUndefined();
    expect(historyRecords(days, undefined)).toBeUndefined();
  });

  it("uses the chosen year when it is one of the data years, otherwise the default year", () => {
    const days = [...monthDays(2026, 1, 31), ...monthDays(2026, 2, 29), ...monthDays(2027, 1, 31)];
    expect(selectedHistoryYear(days, undefined)).toBe(2026);
    expect(selectedHistoryYear(days, 2027)).toBe(2027);
    expect(selectedHistoryYear(days, 2025)).toBe(2026);
    expect(selectedHistoryYear([], undefined)).toBeUndefined();
  });

});
