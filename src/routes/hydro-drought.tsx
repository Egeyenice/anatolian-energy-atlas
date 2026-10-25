import { pageHead } from "@/lib/page-head";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEnergyData } from "@/lib/energy";
import { droughtYears } from "@/config/droughtYears";
import { Analysis, ChartCard, DataState, PageHeader } from "@/components/site";
import { ChartTooltip } from "@/components/ChartTooltip";

export const Route = createFileRoute("/hydro-drought")({
  staticData: { sitemap: true },
  head: () => pageHead("Hydro & Drought", "/hydro-drought", "Hydropower generation in Türkiye, drought years, and whether coal and gas fill the gap."),
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
          <Analysis
            sections={[
              {
                bullets: [
                  "In drought years such as 2014 and 2021, hydro output fell by roughly 30% compared with the previous year.",
                ],
                large: true,
              },
            ]}
          />


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
          <Analysis
            sections={[
              {
                heading: "What fills the gap?",
                paragraphs: [
                  "When hydropower falls, natural gas is the main source that takes its place. In earlier droughts, coal helped too: in 2014, hydro output fell by 18.8 TWh, while gas rose by 15.5 TWh and coal by 12.5 TWh.",
                  "Since 2021, however, coal has barely responded to droughts. In 2021, hydro dropped by 22.4 TWh and gas jumped by 39.2 TWh, while coal actually fell slightly. A likely reason is that Türkiye's imported-coal power plants already run close to their limits: according to Ember, they operated at over 80% of their capacity in 2025. Gas plants, on the other hand, can be turned up and down quickly, which makes gas the natural backup when water runs short.",
                  "The clearest evidence of this link comes from a wet year. In 2019, total electricity generation barely changed, yet hydropower's share jumped from about 20% to 30%, and gas fell by a similar amount, from 30% to 18%. When the rivers were full, gas simply stepped back.",
                ],
              },
              {
                heading: "A new helper: solar",
                paragraphs: [
                  "Solar power is starting to change this pattern. 2025 was the first drought year in which solar made a real difference: its output grew by 11.6 TWh, equal to about two-thirds of the 17.3 TWh lost from hydropower. As solar capacity keeps growing, future droughts may depend less on gas.",
                ],
              },
            ]}
          />
          <Analysis
            title="Conclusion"
            sections={[
              {
                paragraphs: [
                  "When rainfall drops, Türkiye burns more fossil fuels to keep the lights on, and most of that fuel, especially natural gas, is imported. Every dry year therefore means a higher energy import bill and more pressure on the country's current account deficit.",
                ],
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
