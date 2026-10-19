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
                  <YAxis tick={axis} stroke="var(--border)" domain={mode === "share" ? [0, 100] : [0, "auto"]} unit={mode === "share" ? "%" : ""} />
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

          <ChartCard title="Share of electricity from renewables" subtitle="Hydro, wind, solar and other renewables, % of total generation">
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
