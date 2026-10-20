import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { comparisonYears, useCapacityData } from "@/lib/capacity";
import { fmt, SOURCE_COLORS, useEnergyData } from "@/lib/energy";
import { Analysis, DataState, type AnalysisSection } from "@/components/site";
import { ChartTooltip } from "@/components/ChartTooltip";

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };
const fuels = ["solar", "wind"] as const;
const labels = { solar: "Solar", wind: "Wind" };

const CAPACITY_ANALYSIS: AnalysisSection[] = [
  {
    heading: "Why more capacity does not mean more electricity",
    paragraphs: [
      "By 2025, Türkiye had almost twice as much solar capacity as wind capacity, yet wind still produced more electricity. This is expected: solar panels generate nothing at night and much less on cloudy days, so their capacity factor is naturally lower. In Türkiye, solar panels typically produce around 16–21% of their theoretical maximum, compared with about 33% for wind turbines.",
    ],
  },
  {
    heading: "Why Türkiye is investing heavily in solar anyway",
    paragraphs: ["Several factors explain the rapid growth of solar power:"],
    bullets: [
      "*Reducing energy imports.* Every unit of electricity generated from the sun is one that does not have to come from imported gas or coal.",
      "*Falling costs.* The cost of building a solar plant has fallen sharply over the past decade, and because sunlight is free, operating costs are low.",
      "*Speed of construction.* A solar plant can be built in months, while coal, gas or hydropower plants often take years. This makes solar one of the fastest ways to add new capacity.",
      "*Geography.* Türkiye receives more sunshine than most of Europe. Regions such as the Mediterranean coast, Central Anatolia and Southeastern Anatolia offer long sunny seasons and large areas of suitable land, although output is still noticeably lower in winter.",
    ],
  },
  {
    heading: "The next challenge: storage",
    paragraphs: [
      "Solar output peaks around midday, while electricity demand stays high into the evening. As solar capacity grows, Türkiye will need more battery storage to shift midday electricity into the evening hours. Without it, part of the solar potential cannot be used when it is needed most.",
    ],
  },
  {
    heading: "Conclusion",
    paragraphs: [
      "Türkiye's success in solar energy should not be measured only by how much capacity it installs. What matters is how much electricity that capacity actually produces, and how much imported fuel it replaces.",
    ],
  },
];

export function CapacityComparison() {
  const { data, status } = useCapacityData();
  const { data: energy } = useEnergyData();
  const years = comparisonYears(data?.years ?? []);
  const generation = years.map((row) => {
    const output = energy?.years.find((year) => year.year === row.year);
    return { year: row.year, solar: output?.solar ?? null, wind: output?.wind ?? null };
  });
  const latest = years.find((row) => row.year === 2025);
  const latestGeneration = generation.find((row) => row.year === 2025);

  return (
    <section className="mt-14 border-t border-border pt-10">
      <h2 className="mb-6 font-serif text-2xl font-semibold leading-tight text-foreground md:text-3xl">More panels, less power? Capacity vs. generation</h2>
      {!data ? <DataState status={status === "error" ? "error" : "pending"} /> : (
        <>
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <figure className="min-w-0">
              <h3 className="font-serif text-xl font-semibold text-foreground">Installed capacity</h3>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">Solar and wind, gigawatts (GW), 2015–2025</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={years} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="year" tick={axis} stroke="var(--border)" minTickGap={20} />
                    <YAxis tick={axis} stroke="var(--border)" width={44} />
                    <Tooltip content={<ChartTooltip unit=" GW" />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {fuels.map((fuel) => <Bar key={fuel} dataKey={`${fuel}_capacity_gw`} name={labels[fuel]} fill={SOURCE_COLORS[fuel]} isAnimationActive={false} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </figure>
            <figure className="min-w-0">
              <h3 className="font-serif text-xl font-semibold text-foreground">Electricity generation</h3>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">Solar and wind, terawatt-hours (TWh), 2015–2025</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generation} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="year" tick={axis} stroke="var(--border)" minTickGap={20} />
                    <YAxis tick={axis} stroke="var(--border)" width={44} />
                    <Tooltip content={<ChartTooltip unit=" TWh" />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {fuels.map((fuel) => <Line key={fuel} type="monotone" dataKey={fuel} name={labels[fuel]} stroke={SOURCE_COLORS[fuel]} strokeWidth={2.5} dot={{ r: 2.5 }} isAnimationActive={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </figure>
          </div>
          <figure className="mt-8 min-w-0">
            <h3 className="font-serif text-xl font-semibold text-foreground">Capacity factor</h3>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">Solar and wind, %, 2015–2025</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={years} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={axis} stroke="var(--border)" minTickGap={20} />
                  <YAxis tick={axis} stroke="var(--border)" width={44} unit="%" />
                  <Tooltip content={<ChartTooltip unit="%" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {fuels.map((fuel) => <Line key={fuel} type="monotone" dataKey={`${fuel}_capacity_factor`} name={labels[fuel]} stroke={SOURCE_COLORS[fuel]} strokeWidth={2.5} connectNulls={false} dot={{ r: 2.5 }} isAnimationActive={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </figure>
          {latest && latestGeneration && (
            <div className="mt-6 border-y border-border bg-secondary px-4 py-4">
              <p className="mb-2 text-sm font-semibold text-foreground">2025</p>
              <div className="grid gap-3 text-base font-semibold text-foreground md:grid-cols-2">
                {fuels.map((fuel) => {
                  const output = latestGeneration[fuel];
                  return output === null ? null : <p key={fuel} className="flex items-start gap-2"><span className="mt-1.5 h-3 w-3 shrink-0 rounded-sm" style={{ background: SOURCE_COLORS[fuel] }} /><span>{labels[fuel]}: {fmt(latest[`${fuel}_capacity_gw`])} GW installed → {fmt(output)} TWh</span></p>;
                })}
              </div>
            </div>
          )}
          <aside className="mt-6 border-l-4 border-primary bg-secondary px-4 py-4 text-sm leading-relaxed text-foreground">Capacity factor = how much a power plant actually produces compared with running at full power every hour of the year.</aside>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Capacity: IRENA (2026). Generation: Ember (2026). Both via Our World in Data (CC BY 4.0). 2025 data preliminary.</p>
          <Analysis sections={CAPACITY_ANALYSIS} />
        </>
      )}
    </section>
  );
}