import { describe, expect, it } from "vitest";
import data from "../../public/data/capacity.json";
import { comparisonYears } from "./capacity";

describe("capacity comparison", () => {
  it("includes only 2015–2025 in chronological order", () => {
    expect(comparisonYears([...data.years].reverse()).map((row) => row.year)).toEqual([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]);
  });
  it("preserves missing solar capacity factors rather than converting to zero", () => {
    expect(comparisonYears(data.years).find((row) => row.year === 2015)?.solar_capacity_factor).toBeNull();
    expect(comparisonYears(data.years).find((row) => row.year === 2016)?.solar_capacity_factor).toBe(21.1);
  });
  it("rounds the 2025 capacity figures to the requested stats", () => {
    const latest = data.years.find((row) => row.year === 2025);
    expect(latest?.solar_capacity_gw.toFixed(1)).toBe("25.5");
    expect(latest?.wind_capacity_gw.toFixed(1)).toBe("14.8");
    expect(latest?.solar_generation_twh).toBe(37.3);
    expect(latest?.wind_generation_twh).toBe(39.4);
  });
});