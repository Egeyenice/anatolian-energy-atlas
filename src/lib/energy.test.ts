import { describe, expect, it } from "vitest";
import { computeStats, renewableShare, type YearRow } from "./energy";

const row = (year: number, v: Partial<YearRow>): YearRow =>
  ({ year, coal: 0, gas: 0, hydro: 0, wind: 0, solar: 0, other_renewables: 0, other_fossil: 0, ...v }) as YearRow;

describe("energy calculations", () => {
  it("renewable share = hydro+wind+solar+other_renewables over total", () => {
    expect(renewableShare(row(2000, { coal: 50, hydro: 25, wind: 15, solar: 5, other_renewables: 5 }))).toBe(50);
  });
  it("stats use latest year and pp change since 2000", () => {
    const s = computeStats([row(2025, { gas: 40, solar: 60 }), row(2000, { coal: 80, hydro: 20 })]);
    expect(s.latestYear).toBe(2025);
    expect(s.largest).toBe("solar");
    expect(s.changePp).toBe(40);
  });
});
