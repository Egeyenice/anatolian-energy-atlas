import { useQuery } from "@tanstack/react-query";

export type SimulatorData = {
  baseYear: number;
  baseDemandTWh: number;
  base: { coal: number; gas: number; hydro: number; wind: number; solar: number; other_renewables: number; other_fossil: number };
  solar: { defaultGW: number; min: number; max: number; capacityFactor: number };
  wind: { defaultGW: number; min: number; max: number; capacityFactor: number };
  hydroYears: Record<string, number>;
  nuclear: { unitGW: number; capacityFactor: number; maxUnits: number };
  demandGrowth: { defaultPct: number; min: number; max: number };
  fixed: { other_renewables: number; other_fossil: number; coalMax: number; gasMin: number };
  emissionFactors_gPerKWh: Record<string, number>;
  gas: { plantEfficiency: number; TWhThermalPerBcm: number };
  baseCarbonIntensity: number;
  presets: Record<string, { solarGW: number; windGW: number; hydroTWh: number; nuclearUnits: number; demandGrowthPct: number }>;
  notes: string[];
};

export type SimInputs = { solarGW: number; windGW: number; hydroTWh: number; nuclearUnits: number; growthPct: number };

export type SimResult = {
  demand: number;
  mix: Record<"coal" | "gas" | "other_fossil" | "hydro" | "wind" | "solar" | "other_renewables" | "nuclear", number>;
  unused: number;
  renewableShare: number;
  lowCarbonShare: number;
  carbonIntensity: number;
  gasChangeTWh: number;
  gasChangeBcm: number;
  emissionsChangePct: number;
};

const HOURS = 8.76; // 8760 hours, GW -> TWh

export function simulate(d: SimulatorData, inp: SimInputs): SimResult {
  const demand = d.baseDemandTWh * (1 + inp.growthPct / 100);
  let solar = inp.solarGW * HOURS * d.solar.capacityFactor;
  let wind = inp.windGW * HOURS * d.wind.capacityFactor;
  let nuclear = inp.nuclearUnits * d.nuclear.unitGW * HOURS * d.nuclear.capacityFactor;
  let hydro = inp.hydroTWh;
  let otherRen = d.fixed.other_renewables;
  const oil = d.fixed.other_fossil;
  const { coalMax, gasMin } = d.fixed;

  const clean = solar + wind + nuclear + hydro + otherRen;
  const residual = demand - clean - oil;

  let coal: number, gas: number, unused = 0;
  if (residual >= coalMax + gasMin) {
    coal = coalMax;
    gas = residual - coalMax;
  } else if (residual >= gasMin) {
    gas = gasMin;
    coal = residual - gasMin;
  } else {
    coal = 0;
    gas = gasMin;
    unused = gasMin - residual;
    const scale = clean > 0 ? (clean - unused) / clean : 0;
    solar *= scale;
    wind *= scale;
    nuclear *= scale;
    hydro *= scale;
    otherRen *= scale;
  }

  const mix = { coal, gas, other_fossil: oil, hydro, wind, solar, other_renewables: otherRen, nuclear };
  const totalGen = Object.values(mix).reduce((s, v) => s + v, 0);
  const f = d.emissionFactors_gPerKWh;
  const emissions = coal * f.coal + gas * f.gas + oil * f.other_fossil + hydro * f.hydro + wind * f.wind + solar * f.solar + otherRen * f.other_renewables + nuclear * f["nuclear"];
  const baseEmissions = d.baseCarbonIntensity * d.baseDemandTWh;

  const gasChangeTWh = gas - d.base.gas;
  return {
    demand,
    mix,
    unused,
    renewableShare: totalGen ? ((hydro + wind + solar + otherRen) / totalGen) * 100 : 0,
    lowCarbonShare: totalGen ? ((hydro + wind + solar + otherRen + nuclear) / totalGen) * 100 : 0,
    carbonIntensity: totalGen ? emissions / totalGen : 0,
    gasChangeTWh,
    gasChangeBcm: gasChangeTWh / d.gas.plantEfficiency / d.gas.TWhThermalPerBcm,
    emissionsChangePct: ((emissions - baseEmissions) / baseEmissions) * 100,
  };
}

export function useSimulatorData() {
  return useQuery({
    queryKey: ["simulator"],
    queryFn: async (): Promise<SimulatorData> => {
      const r = await fetch("/data/simulator.json");
      if (!r.ok) throw new Error("load failed");
      return r.json();
    },
    staleTime: 60 * 60 * 1000,
  });
}
