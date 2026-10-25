import { pageHead } from "@/lib/page-head";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Analysis, DataState, PageHeader, type AnalysisSection } from "@/components/site";
import { ChartTooltip } from "@/components/ChartTooltip";
import { METRIC_LABELS, latestYear, ranking, timeSeries, useComparisonData, type Metric } from "@/lib/comparison";

export const Route = createFileRoute("/compare")({
  staticData: { sitemap: true },
  head: () => pageHead("Compare", "/compare", "How Türkiye's renewable share and carbon intensity of electricity compare with the EU, Germany, the US, China and others."),
  component: ComparePage,
});

const DEFAULT_ON = ["European Union (27)", "Germany", "Greece", "United States"];
const LINE_COLORS = ["var(--src-hydro)", "var(--src-wind)", "var(--src-gas)", "var(--src-other-renewables)", "var(--src-nuclear)", "var(--src-other-fossil)", "var(--src-solar)", "var(--src-coal)"];
const unitOf = (m: Metric) => (m === "renewableShare" ? "%" : " g");

const RANKING_ANALYSIS: AnalysisSection[] = [
  {
    heading: "An interesting detail",
    paragraphs: [
      "This one surprised me at first. Türkiye gets more of its electricity from renewables than the United States does (43% vs. 26%), yet every kilowatt-hour it produces carries more carbon: 475 grams of CO₂e, compared with 384 in the US.",
      "The answer is in the other half of the mix. About 60% of Türkiye's non-renewable electricity comes from coal, and much of that is low-quality lignite. The US relies mostly on natural gas, which emits roughly half as much carbon as coal, and on nuclear power, which emits almost none.",
      "So renewables are not the only way to clean up electricity. Getting rid of coal matters just as much, whatever replaces it.",
    ],
  },
];

const OVERTIME_ANALYSIS: AnalysisSection[] = [
  {
    heading: "Back in 2000, Türkiye was ahead.",
    paragraphs: [
      "A quarter of its electricity came from renewables, more than in Germany (6%), Greece (8%), Spain (16%) or the EU as a whole (16%). Twenty-five years later, every one of them has passed it.",
      "Carbon intensity tells the same story. Greece cut the carbon intensity of its electricity by 62% over this period, and Spain by 67%. Türkiye managed 17%.",
      "A big part of the difference is policy. EU countries made renewables a priority and committed to shared, binding targets. Germany and Spain started paying guaranteed prices for renewable electricity early on, even to small producers, which pulled in a wave of investment. The EU's carbon market added another push: it puts a price on every tonne of CO₂, so burning coal became more and more expensive. That is a big reason why Greece and Spain moved away from it so quickly. Türkiye has its own guaranteed-price scheme, YEKDEM, but it came later and has never been paired with a carbon price.",
    ],
  },
  {
    heading: "Conclusion",
    paragraphs: [
      "Türkiye began the century with a real advantage: plenty of hydropower. But it did not build on that lead with other renewables as fast as Europe did. Meanwhile, its electricity demand almost tripled, from 124 TWh in 2000 to 354 TWh in 2025, while demand across most of Europe barely moved. Much of that extra electricity ended up coming from fossil fuels, above all coal.",
      <>
        Can Türkiye close the gap by 2035?{" "}
        <Link to="/simulator" className="text-primary underline underline-offset-2">
          The Simulator
        </Link>{" "}
        lets you test it yourself.
      </>,
    ],
  },
];


function MetricToggle({ value, onChange }: { value: Metric; onChange: (m: Metric) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-sm border border-border p-1 text-sm">
      {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded-sm px-3 py-1 ${value === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {METRIC_LABELS[m]}
        </button>
      ))}
    </div>
  );
}

function SourceLine() {
  return (
    <p className="mt-3 text-xs text-muted-foreground">
      Data: Ember (2026) via Our World in Data (CC BY 4.0). World average: Ember, Global Electricity Review 2026. Carbon intensity is measured over the full lifecycle.
    </p>
  );
}

function ComparePage() {
  const { data, status } = useComparisonData();
  const [rankMetric, setRankMetric] = useState<Metric>("renewableShare");
  const [lineMetric, setLineMetric] = useState<Metric>("renewableShare");
  const [on, setOn] = useState<string[]>(DEFAULT_ON);

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-5">
        <PageHeader kicker="Compare" title="How does Türkiye compare?" />
        <DataState status={status === "error" ? "error" : "pending"} />
      </div>
    );
  }

  const year = latestYear(data, rankMetric);
  const rows = ranking(data, rankMetric, year);
  const world = data.referenceLines2025.worldRenewableShare;
  const series = timeSeries(data, lineMetric);
  const turkey = data.countries.find((c) => c.highlight);
  const others = data.countries.filter((c) => !c.highlight);
  const colorOf = (name: string) => LINE_COLORS[others.findIndex((c) => c.name === name) % LINE_COLORS.length];

  return (
    <div className="mx-auto max-w-5xl px-5">
      <PageHeader
        kicker="Compare"
        title="How does Türkiye compare?"
        intro="Türkiye's electricity next to the European Union and other major countries, by renewable share and carbon intensity."
      />

      <figure className="rounded-sm border border-border bg-card p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground md:text-2xl">Ranking, {year}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {rankMetric === "renewableShare" ? "Higher is greener." : "Lower is cleaner."} The European Union bar (striped) is an average of 27 countries.
            </p>
          </div>
          <MetricToggle value={rankMetric} onChange={setRankMetric} />
        </div>
        <div style={{ height: Math.max(280, rows.length * 38 + 50) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <defs>
                <pattern id="eu-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="var(--muted)" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="var(--muted-foreground)" strokeWidth="3" />
                </pattern>
              </defs>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" unit={rankMetric === "renewableShare" ? "%" : ""} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" interval={0} />
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip unit={unitOf(rankMetric)} />} />
              <Bar dataKey="value" name={METRIC_LABELS[rankMetric]} radius={[0, 2, 2, 0]} label={{ position: "right", fontSize: 11, fill: "var(--muted-foreground)", formatter: (v: unknown) => (rankMetric === "renewableShare" ? `${Number(v).toFixed(1)}%` : String(v)) }}>
                {rows.map((r) => (
                  <Cell key={r.name} fill={r.highlight ? "var(--accent-foreground)" : r.isAggregate ? "url(#eu-stripes)" : "var(--muted-foreground)"} fillOpacity={r.highlight || r.isAggregate ? 1 : 0.55} />
                ))}
              </Bar>
              {rankMetric === "renewableShare" && (
                <ReferenceLine x={world} stroke="var(--foreground)" strokeDasharray="5 4" label={{ value: `World average ${world}%`, position: "top", fontSize: 11, fill: "var(--foreground)" }} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SourceLine />
      </figure>
      <Analysis sections={RANKING_ANALYSIS} />

      <figure className="rounded-sm border border-border bg-card p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground md:text-2xl">Over time</h2>
            <p className="mt-1 text-sm text-muted-foreground">Türkiye (thick line) against the countries you select.</p>
          </div>
          <MetricToggle value={lineMetric} onChange={setLineMetric} />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {others.map((c) => {
            const active = on.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={active}
                onClick={() => setOn((s) => (active ? s.filter((n) => n !== c.name) : [...s, c.name]))}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${active ? "border-foreground text-foreground" : "border-border text-muted-foreground"}`}
              >
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: active ? colorOf(c.name) : "var(--border)" }} />
                {c.name}
              </button>
            );
          })}
        </div>
        <div className="h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" unit={lineMetric === "renewableShare" ? "%" : ""} />
              <Tooltip content={<ChartTooltip unit={unitOf(lineMetric)} />} />
              {others.filter((c) => on.includes(c.name)).map((c) => (
                <Line key={c.name} dataKey={c.name} name={c.name} stroke={colorOf(c.name)} strokeWidth={1.5} dot={false} connectNulls={false} isAnimationActive={false} />
              ))}
              {turkey && <Line dataKey={turkey.name} name={turkey.name} stroke="var(--accent-foreground)" strokeWidth={4} dot={false} isAnimationActive={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <SourceLine />
      </figure>
      <Analysis sections={OVERTIME_ANALYSIS} />
    </div>
  );
}
