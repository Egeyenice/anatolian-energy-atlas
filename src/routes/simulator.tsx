import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Analysis, DataState, PageHeader } from "@/components/site";
import { ChartTooltip } from "@/components/ChartTooltip";
import { fmt, SOURCE_COLORS, SOURCE_LABELS } from "@/lib/energy";
import { simulate, useSimulatorData, type SimInputs, type SimulatorData } from "@/lib/simulator";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Simulator – Turkey Energy Atlas" },
      { name: "description", content: "What if Türkiye built more solar, wind or nuclear? A simplified model of the electricity mix, gas use and emissions." },
      { property: "og:title", content: "Türkiye electricity simulator – Turkey Energy Atlas" },
      { property: "og:description", content: "Explore how more solar, wind and nuclear capacity would change Türkiye's electricity mix, gas imports and emissions." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimulatorPage,
});

const MIX_KEYS = ["coal", "gas", "other_fossil", "hydro", "wind", "solar", "other_renewables", "nuclear"] as const;
const MIX_LABELS: Record<(typeof MIX_KEYS)[number], string> = { ...SOURCE_LABELS, nuclear: "Nuclear" };
const MIX_COLORS: Record<(typeof MIX_KEYS)[number], string> = { ...SOURCE_COLORS, nuclear: "var(--src-nuclear)" };

function defaults(d: SimulatorData): SimInputs {
  return { solarGW: d.solar.defaultGW, windGW: d.wind.defaultGW, hydroTWh: d.hydroYears["2025 actual"], nuclearUnits: 0, growthPct: d.demandGrowth.defaultPct };
}

function Slider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{fmt(value, step < 1 ? 1 : 0)} {unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--accent-foreground)]"
      />
    </label>
  );
}

function SimulatorPage() {
  const { data, status } = useSimulatorData();
  const [inp, setInp] = useState<SimInputs | null>(null);
  const [preset, setPreset] = useState<string | null>("2025 (base year)");

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-5">
        <PageHeader kicker="Simulator" title="What if Türkiye built more solar and wind?" />
        <DataState status={status === "error" ? "error" : "pending"} />
      </div>
    );
  }

  const inputs = inp ?? defaults(data);
  const r = simulate(data, inputs);
  const hydroKeys = Object.keys(data.hydroYears);

  const applyPreset = (name: string) => {
    const p = data.presets[name]!;
    setInp({ solarGW: p.solarGW, windGW: p.windGW, hydroTWh: p.hydroTWh, nuclearUnits: p.nuclearUnits, growthPct: p.demandGrowthPct });
    setPreset(name);
  };
  const set = (patch: Partial<SimInputs>) => {
    setInp({ ...inputs, ...patch });
    setPreset(null);
  };

  const baseRow: Record<string, number | string> = { name: `${data.baseYear} actual`, ...data.base, nuclear: 0 };
  const scenarioRow: Record<string, number | string> = { name: "Your scenario", ...r.mix };
  const chartData = [scenarioRow, baseRow];

  return (
    <div className="mx-auto max-w-5xl px-5">
      <PageHeader
        kicker="Simulator"
        title="What if Türkiye built more solar and wind?"
        intro="A simplified model of Türkiye's electricity mix. Move the sliders and see how capacity, rainfall, nuclear power and demand growth change the mix, gas use and emissions."
      />

      <figure className="rounded-sm border border-border bg-card p-4 md:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.keys(data.presets).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => applyPreset(name)}
              className={`rounded-full border px-3 py-1 text-xs ${preset === name ? "border-foreground font-semibold text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          <Slider label="Solar capacity" value={inputs.solarGW} min={data.solar.min} max={data.solar.max} step={0.5} unit="GW" onChange={(v) => set({ solarGW: v })} />
          <Slider label="Wind capacity" value={inputs.windGW} min={data.wind.min} max={data.wind.max} step={0.5} unit="GW" onChange={(v) => set({ windGW: v })} />
          <div>
            <span className="text-sm font-medium text-foreground">Rain year</span>
            <div className="mt-1 flex flex-wrap gap-1 rounded-sm border border-border p-1 text-sm">
              {hydroKeys.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set({ hydroTWh: data.hydroYears[k]! })}
                  className={`rounded-sm px-2.5 py-1 ${inputs.hydroTWh === data.hydroYears[k] ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">Akkuyu nuclear units</span>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer nuclear units"
                disabled={inputs.nuclearUnits <= 0}
                onClick={() => set({ nuclearUnits: inputs.nuclearUnits - 1 })}
                className="h-8 w-8 rounded-sm border border-border text-lg text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                −
              </button>
              <span className="w-6 text-center text-sm tabular-nums text-foreground">{inputs.nuclearUnits}</span>
              <button
                type="button"
                aria-label="More nuclear units"
                disabled={inputs.nuclearUnits >= data.nuclear.maxUnits}
                onClick={() => set({ nuclearUnits: inputs.nuclearUnits + 1 })}
                className="h-8 w-8 rounded-sm border border-border text-lg text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                +
              </button>
              <span className="text-xs text-muted-foreground">of {data.nuclear.maxUnits} planned</span>
            </div>
          </div>
          <Slider label="Electricity demand growth vs 2025" value={inputs.growthPct} min={data.demandGrowth.min} max={data.demandGrowth.max} step={1} unit="%" onChange={(v) => set({ growthPct: v })} />
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold text-foreground md:text-2xl">The resulting mix</h2>
          <p className="mt-1 text-sm text-muted-foreground">Annual generation in TWh, compared with {data.baseYear}. Demand: {fmt(r.demand, 0)} TWh.</p>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }} barCategoryGap="35%">
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" unit=" TWh" />
                <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip unit=" TWh" />} />
                {MIX_KEYS.map((k) => (
                  <Bar key={k} dataKey={k} name={MIX_LABELS[k]} stackId="mix" fill={MIX_COLORS[k]} isAnimationActive={false} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {MIX_KEYS.map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: MIX_COLORS[k] }} />
                {MIX_LABELS[k]}
              </span>
            ))}
          </div>
        </div>

        {r.unused > 0.05 && (
          <p className="mt-4 rounded-sm border border-[var(--src-gas)] bg-[var(--accent)] px-3 py-2 text-sm text-foreground">
            {fmt(r.unused, 1)} TWh of clean electricity could not be used without storage or exports.
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-sm border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Renewable share</p>
            <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-foreground">{fmt(r.renewableShare)}%</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Low-carbon share (incl. nuclear)</p>
            <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-foreground">{fmt(r.lowCarbonShare)}%</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Gas generation</p>
            <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-foreground">{fmt(r.mix.gas, 0)} TWh</p>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              {r.gasChangeTWh >= 0 ? "+" : ""}{fmt(r.gasChangeTWh, 1)} TWh ({r.gasChangeBcm >= 0 ? "+" : ""}{fmt(r.gasChangeBcm, 1)} bcm) vs {data.baseYear}
            </p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Carbon intensity</p>
            <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-foreground">{fmt(r.carbonIntensity, 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">gCO2e/kWh</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Total emissions vs {data.baseYear}</p>
            <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-foreground">{r.emissionsChangePct >= 0 ? "+" : ""}{fmt(r.emissionsChangePct, 0)}%</p>
          </div>
        </div>
      </figure>

      <aside className="mt-8 rounded-sm border border-border bg-secondary p-4 md:p-6">
        <h2 className="font-serif text-xl font-semibold text-foreground">How this model works</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground marker:text-muted-foreground">
          {data.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </aside>

      <Analysis />
    </div>
  );
}
