import { createFileRoute, Link } from "@tanstack/react-router";
import { computeStats, fmt, SOURCE_COLORS, SOURCE_LABELS, useEnergyData } from "@/lib/energy";
import { DataState } from "@/components/site";

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
  { to: "/trends", title: "Trends", text: "How each source of electricity has grown or shrunk since 2000." },
  { to: "/hydro-drought", title: "Hydro & Drought", text: "What happens to the power mix when rivers run low." },
  { to: "/about", title: "About & Methodology", text: "Where the data comes from and how this site was built." },
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

      <section className="mt-16">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-foreground">Explore the atlas</h2>
        <div className="grid gap-4 md:grid-cols-3">
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

function Stat({ label, value, note, color }: { label: string; value: string; note: string; color?: string }) {
  return (
    <div className="rounded-sm border-t-4 border-primary bg-secondary p-6" style={color ? { borderTopColor: color } : undefined}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-4xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
