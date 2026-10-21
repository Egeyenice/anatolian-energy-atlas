import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import { fetchPlants, PLANT_COLORS, PLANT_LABELS, PLANT_TYPES, type Plant } from "@/lib/plants";
import { Analysis, DataState, PageHeader } from "@/components/site";

const PlantsMap = lazy(() => import("@/components/PlantsMap"));

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map – Turkey Energy Atlas" },
      { name: "description", content: "An interactive map of Türkiye's largest power plants: hydro dams, coal, gas, solar and nuclear." },
      { property: "og:title", content: "Map – Turkey Energy Atlas" },
      { property: "og:description", content: "Where Türkiye's largest power plants are, and what they burn." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

type Filter = "all" | Plant["type"];

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

          <Analysis />
        </>
      )}
    </div>
  );
}
