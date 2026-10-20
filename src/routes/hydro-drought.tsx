import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEnergyData } from "@/lib/energy";
import { droughtYears } from "@/config/droughtYears";
import { Analysis, ChartCard, DataState, PageHeader } from "@/components/site";
import { ChartTooltip } from "@/components/ChartTooltip";

export const Route = createFileRoute("/hydro-drought")({
  head: () => ({
    meta: [
      { title: "Hydro & Drought – Turkey Energy Atlas" },
      { name: "description", content: "Hydropower generation in Türkiye, drought years, and whether coal and gas fill the gap." },
      { property: "og:title", content: "Hydro & Drought – Turkey Energy Atlas" },
      { property: "og:description", content: "Does fossil generation rise when Türkiye's hydropower falls in dry years?" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Hydro,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };

function Hydro() {
  const { data, status } = useEnergyData();
  const years = data?.years ?? [];
  const bars = useMemo(() => years.map((y) => ({ year: y.year, hydro: y.hydro, drought: droughtYears.includes(y.year) })), [years]);
  const compare = useMemo(() => years.map((y) => ({ year: y.year, hydro: y.hydro, fossil: (y.coal || 0) + (y.gas || 0) })), [years]);

  return (
    <div className="mx-auto max-w-5xl px-5">
      <PageHeader kicker="Hydro & Drought" title="When the rivers run low" intro="Hydropower is a large part of Türkiye's electricity — and it depends on rainfall." />
      <Analysis
        title="Introduction"
        sections={[
          {
            paragraphs: [
              "Hydropower is Türkiye's biggest renewable source of electricity. In 2025 it generated about 57 TWh, more than wind (39 TWh) and solar (37 TWh). Yet it relies on something no one can plan for: how much rain and snow falls each year.",
              "There are two kinds of hydropower plants in Türkiye. Run-of-river plants have little or no storage, so they produce whatever the river happens to carry. Dams are different. They hold water back in reservoirs and release it when electricity is needed most. I saw this clearly when I looked at EPİAŞ's hourly data for 19 October 2026: dam output was only about 3.6 GW at midday, but climbed past 12 GW in the early evening, just as demand peaked.",
              "Either way, everything starts with rainfall. In wet years, hydropower has covered nearly 30% of Türkiye's electricity. In dry years, that share has dropped to around 16%.",
              "So what happens when the rivers run low?",
            ],
          },
        ]}
      />
      {!data ? (
        <DataState status={status === "error" ? "error" : "pending"} />
      ) : (
        <>
          <ChartCard title="Hydropower generation per year" subtitle="Terawatt-hours (TWh). Drought years shown in a lighter shade." note={years[years.length - 1]?.year === 2025 ? "2025 data is preliminary." : undefined}>
            <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: "var(--src-hydro)" }} />Hydro</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: "var(--drought)" }} />Drought year</span>
            </div>
            <div className="h-80 md:h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={axis} stroke="var(--border)" minTickGap={10} />
                  <YAxis tick={axis} stroke="var(--border)" />
                  <Tooltip content={<ChartTooltip unit=" TWh" />} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="hydro" name="Hydro" isAnimationActive={false}>
                    {bars.map((b) => (
                      <Cell key={b.year} fill={b.drought ? "var(--drought)" : "var(--src-hydro)"} />
                    ))}
                    <LabelList
                      dataKey="year"
                      position="top"
                      content={(p) => {
                        const { x, y, width, value } = p as { x: number; y: number; width: number; value: number };
                        if (!droughtYears.includes(Number(value))) return null;
                        if (typeof window !== "undefined" && window.innerWidth < 640) return null;
                        return <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={10} fill="var(--drought-label)">Drought</text>;
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>


          <ChartCard title="Hydro vs. coal + gas" subtitle="Terawatt-hours (TWh) per year" note={years[years.length - 1]?.year === 2025 ? "2025 data is preliminary." : undefined}>
            <div className="h-80 md:h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={compare} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={axis} stroke="var(--border)" minTickGap={20} />
                  <YAxis tick={axis} stroke="var(--border)" />
                  <Tooltip content={<ChartTooltip unit=" TWh" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="hydro" name="Hydro" stroke="var(--src-hydro)" strokeWidth={2.5} dot={{ r: 2.5 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="fossil" name="Coal + gas" stroke="var(--src-coal)" strokeWidth={2.5} dot={{ r: 2.5 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <Analysis />
          <Analysis title="Conclusion" />
        </>
      )}
    </div>
  );
}
