import { pageHead } from "@/lib/page-head";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import { fetchPlants, PLANT_COLORS, PLANT_LABELS, PLANT_TYPES, type Plant } from "@/lib/plants";
import { Analysis, DataState, PageHeader, type AnalysisSection } from "@/components/site";

const PlantsMap = lazy(() => import("@/components/PlantsMap"));

export const Route = createFileRoute("/map")({
  head: () => pageHead("Map", "/map", "An interactive map of Türkiye's largest power plants: hydro dams, coal, gas, solar and nuclear."),
  component: MapPage,
});

type Filter = "all" | Plant["type"];

const MAP_ANALYSIS: AnalysisSection[] = [
  {
    heading: "Location tells you the fuel.",
    paragraphs: [
      "Looking at the map, a pattern jumps out: where a power plant is built says a lot about what it burns.",
      "Every imported-coal plant on the map sits on the coast, in Zonguldak on the Black Sea, around İskenderun Bay, and near Biga on the Sea of Marmara. That makes sense. The coal arrives by ship, so the plants are built right next to the ports, and the sea also gives them easy access to the large amounts of cooling water they need.",
      "Domestic lignite plants are the opposite. They are built right next to the mines, in places like Afşin-Elbistan, Soma and Muğla. Lignite contains a lot of water and gives off relatively little energy, so moving it far would mean paying to transport mostly water and ash. It is cheaper to burn it where it is dug up.",
    ],
  },
  {
    heading: "Water in the east, power in the west.",
    paragraphs: [
      "Türkiye's two biggest rivers, the Euphrates and the Tigris, flow through Eastern and Southeastern Anatolia, so that is where the largest dams are. Atatürk, Karakaya, Keban, Ilısu and Birecik together make up about two-thirds of the dam capacity shown on the map.",
      "The big gas plants are on the other side of the country. All four on the map are in the Marmara region and Thrace, close to İstanbul, where the most electricity is used and where much of the imported gas enters the country. Building them close to demand keeps transmission costs and losses down.",
    ],
  },
  {
    heading: "A new kind of plant.",
    paragraphs: [
      "Türkiye's first nuclear power plant, Akkuyu, is being built on the Mediterranean coast for the same reason as the coal plants: a nuclear plant needs enormous amounts of cooling water, and the sea provides it.",
    ],
  },
];

function MapPage() {
  const { data, status } = useQuery({ queryKey: ["plants"], queryFn: fetchPlants, staleTime: 60 * 60 * 1000 });
  const [filter, setFilter] = useState<Filter>("all");

  const plants = data?.plants ?? [];
  const visible = filter === "all" ? plants : plants.filter((p) => p.type === filter);

  return (
    <div className="mx-auto max-w-5xl px-5">
      <PageHeader
        kicker="Map"
        title="Where the power plants are"
        intro="Türkiye's largest power plants, one circle per plant. Bigger circle, bigger plant."
      />
      {!data ? (
        <DataState status={status === "error" ? "error" : "pending"} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {(["all", ...PLANT_TYPES] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                  filter === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : PLANT_LABELS[f]}
              </button>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {PLANT_TYPES.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ background: PLANT_COLORS[t] }} />
                {PLANT_LABELS[t]}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-[3px]" style={{ borderColor: "var(--src-coal)" }} />
              Coal: domestic lignite (hollow)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ background: "var(--src-coal)" }} />
              Coal: imported hard coal (filled)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-dashed border-muted-foreground" />
              Under construction or uncertain (dashed)
            </span>
          </div>

          <div className="overflow-hidden rounded-sm border border-border">
            <ClientOnly fallback={<div className="h-[450px] w-full bg-muted" />}>
              <Suspense fallback={<div className="h-[450px] w-full bg-muted" />}>
                <PlantsMap plants={visible} />
              </Suspense>
            </ClientOnly>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {data.note} Sources: Wikipedia, Global Energy Monitor.
          </p>

          <Analysis sections={MAP_ANALYSIS} />
        </>
      )}
    </div>
  );
}
