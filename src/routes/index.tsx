import { createFileRoute, Link } from "@tanstack/react-router";
import { computeStats, fmt, renewableShare, SOURCE_COLORS, SOURCE_LABELS, total, useEnergyData, type YearRow } from "@/lib/energy";
import { DataState } from "@/components/site";
import { YesterdaySection } from "@/components/YesterdaySection";
import { HomeDailySections } from "@/components/HomeDailySections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Turkey Energy Atlas – Where does Türkiye's electricity come from?" },
      { name: "description", content: "A data story on how Türkiye generates its electricity and how the mix has changed since 2000." },
      { property: "og:title", content: "Turkey Energy Atlas" },
      { property: "og:description", content: "How Türkiye generates its electricity, and how it has changed since 2000." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PAGES = [
  { to: "/trends", title: "Trends", text: "Coal overtook gas in 2016." },
  { to: "/hydro-drought", title: "Hydro & Drought", text: "When the rivers run low, gas fills the gap." },
  { to: "/map", title: "Map", text: "See where Türkiye's biggest power plants are." },
  { to: "/compare", title: "Compare", text: "More renewables than the US, yet more carbon per kWh" },
  { to: "/simulator", title: "Simulator", text: "What if Türkiye hits its 2035 targets? Try it yourself" },
  { to: "/about", title: "About", text: "How this site was built, and how the data was checked" },
] as const;

function Index() {
  const { data, status } = useEnergyData();
  const s = data && data.years.length ? computeStats(data.years) : null;

  return (
    <div className="mx-auto max-w-5xl px-5">
      <section className="py-14 md:py-24">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-foreground">Turkey Energy Atlas</p>
        <h1 className="max-w-3xl font-serif text-4xl font-bold leading-tight text-foreground md:text-6xl">
          Where does Türkiye's electricity come from?
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          A look at how coal, gas, hydro, wind and solar have shaped the country's power supply since 2000.
        </p>
      </section>

      <YesterdaySection />

      <HomeDailySections />

      {s ? (
        <section className="grid gap-4 md:grid-cols-3">
          <Stat label={`Renewable share, ${s.latestYear}`} value={`${fmt(s.renewableShare)}%`} note="Hydro, wind, solar and other renewables" />
          <Stat
            label={`Largest single source, ${s.latestYear}`}
            value={SOURCE_LABELS[s.largest]}
            note={`${fmt(s.largestShare)}% of generation`}
            color={SOURCE_COLORS[s.largest]}
          />
          <Stat
            label={`Change in renewable share since ${s.baseYear}`}
            value={`${s.changePp >= 0 ? "+" : ""}${fmt(s.changePp)} pp`}
            note="Percentage points"
          />
          {s.latestYear === 2025 && (
            <p className="text-xs italic text-muted-foreground md:col-span-3">2025 data is preliminary.</p>
          )}
        </section>
      ) : (
        <DataState status={status === "error" ? "error" : "pending"} />
      )}

      {data && data.years.length > 1 && <FourNumbers years={data.years} />}

      <section className="mt-16">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-foreground">Explore the atlas</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {PAGES.map((p) => (
            <Link key={p.to} to={p.to} className="group rounded-sm border border-border bg-card p-6 transition-colors hover:border-primary">
              <h3 className="font-serif text-xl font-semibold text-primary group-hover:underline">{p.title} →</h3>
              <p className="mt-2 text-muted-foreground">{p.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function FourNumbers({ years }: { years: YearRow[] }) {
  const sorted = [...years].sort((a, b) => a.year - b.year);
  const base = sorted.find((y) => y.year === 2000) ?? sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const cards = [
    {
      label: "Total generation",
      value: `${fmt(total(last), 0)} TWh`,
      note: `×${fmt(total(last) / total(base), 1)} since ${base.year} (${fmt(total(base), 0)} TWh)`,
    },
    {
      label: "Renewable share",
      value: `${fmt(renewableShare(last))}%`,
      note: `vs ${fmt(renewableShare(base))}% in ${base.year}`,
    },
    {
      label: "Solar generation",
      value: `${fmt(last.solar)} TWh`,
      note: `vs ${fmt(base.solar)} TWh in ${base.year}`,
    },
    {
      label: "Coal generation",
      value: `${fmt(last.coal, 0)} TWh`,
      note: `×${fmt(last.coal / base.coal, 1)} since ${base.year} (${fmt(base.coal, 0)} TWh)`,
    },
  ];
  return (
    <section className="mt-16">
      <h2 className="mb-2 font-serif text-2xl font-semibold text-foreground">25 years in four numbers</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Comparing {base.year} with {last.year}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Stat key={c.label} label={c.label} value={c.value} note={c.note} />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Annual data · Source: Ember via Our World in Data · Updated once a year</p>
    </section>
  );
}

function Stat({ label, value, note, color }: { label: string; value: string; note: string; color?: string }) {
  return (
    <div className="rounded-sm border-t-4 border-primary bg-secondary p-6" style={color ? { borderTopColor: color } : undefined}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-4xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
