import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { renewableShare, SOURCE_COLORS, SOURCE_LABELS, SOURCES, toShares, useEnergyData } from "@/lib/energy";
import { Analysis, ChartCard, DataState, PageHeader } from "@/components/site";
import { ChartTooltip } from "@/components/ChartTooltip";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trends – Turkey Energy Atlas" },
      { name: "description", content: "Türkiye's electricity generation by source over time, in TWh and as a share of the total." },
      { property: "og:title", content: "Electricity trends in Türkiye – Turkey Energy Atlas" },
      { property: "og:description", content: "Stacked charts of every source of electricity in Türkiye since 2000." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trends,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };

const MIX_ANALYSIS: AnalysisSection[] = [
  {
    heading: "What changed between 2000 and 2025",
    paragraphs: [
      "Wind power recorded the largest gain in share of any source, rising from virtually zero in 2000 to 11.1% of Türkiye's electricity in 2025. Solar followed closely, growing from zero to 10.5%, most of it within the last five years. In absolute terms, however, coal grew the most: its output more than tripled, from about 38 TWh to 121 TWh.",
    ],
  },
  {
    heading: "Coal overtakes gas",
    paragraphs: [
      "For most of the 2000s, natural gas was Türkiye's largest source of electricity, providing close to half of all generation in some years. Coal first overtook gas in 2016 and has been the leading source every year since 2018, with one exception: in 2021, a severe drought pushed gas back into first place. In wet years such as 2019, 2020 and 2024, hydropower even moved ahead of gas into second place.",
    ],
  },
  {
    heading: "Context: two fuels, both largely imported",
    paragraphs: [
      "Almost all of the natural gas used in Türkiye is imported; domestic production covered only about 4% of consumption in 2024.",
      "Coal is following a similar path. In 2000, Türkiye's coal power plants ran almost entirely on domestic lignite and hard coal. Large plants designed for imported coal began operating in 2003, and their share grew quickly, partly because imported hard coal has a much higher calorific value than Turkish lignite. Today, about two-thirds of the country's coal-fired electricity comes from imported coal, in recent years mostly from Russia.",
      "This shift happened despite official support for domestic coal. As a result, the rise of coal over the past 25 years has not reduced Türkiye's dependence on energy imports. It has moved that dependence from gas toward coal.",
    ],
  },
];

const MIX_ANALYSIS_NOTE = "Note: 2025 figures are preliminary.";

function Trends() {
  const { data, status } = useEnergyData();
  const [mode, setMode] = useState<"share" | "twh">("share");
  const years = data?.years ?? [];
  const stacked = useMemo(() => (mode === "share" ? years.map(toShares) : years), [years, mode]);
  const ren = useMemo(() => years.map((y) => ({ year: y.year, share: renewableShare(y) })), [years]);
  const unit = mode === "share" ? "%" : " TWh";
  const first = years[0]?.year;
  const last = years[years.length - 1]?.year;

  return (
    <div className="mx-auto max-w-5xl px-5">
      <PageHeader kicker="Trends" title="How Türkiye's power mix has changed" intro={first ? `Electricity generation by source, ${first}–${last}.` : undefined} />
      {!data ? (
        <DataState status={status === "error" ? "error" : "pending"} />
      ) : (
        <>
          <ChartCard
            title="Electricity generation by source"
            note={last === 2025 ? "2025 data is preliminary." : undefined}
            subtitle={mode === "share" ? "Share of total generation (%)" : "Terawatt-hours (TWh) per year"}
            controls={
              <div className="inline-flex shrink-0 rounded-sm border border-border p-0.5 text-sm" role="group">
                {(["share", "twh"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`rounded-sm px-3 py-1.5 ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {m === "share" ? "Share (%)" : "Generation (TWh)"}
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-80 md:h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stacked} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={axis} stroke="var(--border)" minTickGap={20} />
                  <YAxis tick={axis} stroke="var(--border)" width={44} domain={mode === "share" ? [0, 100] : [0, "auto"]} {...(mode === "share" ? { ticks: [0, 25, 50, 75, 100], unit: "%" } : {})} />
                  <Tooltip content={<ChartTooltip unit={unit} />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {SOURCES.map((k) => (
                    <Area key={k} type="monotone" dataKey={k} name={SOURCE_LABELS[k]} stackId="1" stroke={SOURCE_COLORS[k]} fill={SOURCE_COLORS[k]} fillOpacity={0.85} isAnimationActive={false} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <Analysis />

          <ChartCard title="Share of electricity from renewables" subtitle="Hydro, wind, solar and other renewables, % of total generation" note={last === 2025 ? "2025 data is preliminary." : undefined}>
            <div className="h-72 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ren} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={axis} stroke="var(--border)" minTickGap={20} />
                  <YAxis tick={axis} stroke="var(--border)" unit="%" domain={[0, "auto"]} />
                  <Tooltip content={<ChartTooltip unit="%" />} />
                  <Line type="monotone" dataKey="share" name="Renewable share" stroke="var(--src-other-renewables)" strokeWidth={2.5} dot={{ r: 2.5 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <Analysis />
        </>
      )}
    </div>
  );
}
