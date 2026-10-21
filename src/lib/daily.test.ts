import { afterEach, describe, expect, it, vi } from "vitest";
import { isPartialMonth, latestHistoryYear, type DailyHistoryDay } from "./daily";

function day(date: string, hoursAvailable = 24): DailyHistoryDay {
  return { date, hoursAvailable, totalGWh: 100, renewableShare: 50,
    totalsGWh: { coal: 50, gas: 0, hydro: 50, wind: 0, solar: 0, other_renewables: 0, other_fossil: 0, other: 0 } };
}
const monthDays = (year: number, month: number, count: number) =>
  Array.from({ length: count }, (_, i) => day(`${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`));

afterEach(() => vi.useRealTimers());

describe("Home daily history", () => {
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