import { describe, expect, it } from "vitest";
import { simulate, type SimulatorData } from "./simulator";
import data from "../../public/data/simulator.json";

const d = data as SimulatorData;
const baseInputs = { solarGW: 22.9, windGW: 13.8, hydroTWh: 57.3, nuclearUnits: 0, growthPct: 0 };

describe("simulate", () => {
  it("base-year inputs reproduce 2025: coal at max, gas fills the rest", () => {
    const r = simulate(d, baseInputs);
    expect(r.mix.coal).toBeCloseTo(121.4, 1);
    expect(r.mix.gas).toBeCloseTo(78.4, 0);
    expect(r.unused).toBe(0);
    expect(r.gasChangeTWh).toBeCloseTo(0, 1);
    expect(r.emissionsChangePct).toBeCloseTo(0, 0);
  });

  it("scales clean sources down proportionally when demand is exceeded", () => {
    const r = simulate(d, { solarGW: 90, windGW: 60, hydroTWh: 88.6, nuclearUnits: 4, growthPct: 0 });
    expect(r.mix.coal).toBe(0);
    expect(r.mix.gas).toBe(30);
    expect(r.unused).toBeGreaterThan(0);
    const clean = r.mix.solar + r.mix.wind + r.mix.nuclear + r.mix.hydro + r.mix.other_renewables;
    expect(clean + r.mix.gas + r.mix.other_fossil).toBeCloseTo(r.demand, 6);
  });

  it("gas conversion uses plant efficiency and thermal content", () => {
    const r = simulate(d, { ...baseInputs, growthPct: 40 });
    expect(r.gasChangeBcm).toBeCloseTo(r.gasChangeTWh / 0.5 / 10.55, 6);
  });
});
