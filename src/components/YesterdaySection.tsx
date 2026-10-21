import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";
import { DailyDataNote } from "@/components/DailyDataNote";
import { fmtDate, latestHistoryDate, useDailyHistory, useDailyLatest, useDailyRecords, type DailySource } from "@/lib/daily";
import { fmt, SOURCE_COLORS, SOURCE_LABELS } from "@/lib/energy";

const DAILY_SOURCES = ["coal", "gas", "other_fossil", "hydro", "wind", "solar", "other_renewables", "other"] as const;

const DAILY_LABELS: Record<DailySource, string> = { ...SOURCE_LABELS, other: "Other" };
const DAILY_COLORS: Record<DailySource, string> = { ...SOURCE_COLORS, other: "var(--muted-foreground)" };

export function YesterdaySection() {
  const latest = useDailyLatest();
  const records = useDailyRecords();
  const history = useDailyHistory();

  // Hide the whole section gracefully if the live data cannot be loaded.
  if (latest.status === "error" && records.status === "error") return null;

  const pending = latest.status === "pending" || records.status === "pending";
  const d = latest.data;
  const r = records.data;

  return (
    <section className="border-t border-border py-12">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-foreground">Yesterday</p>
      <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">A day in Türkiye's power grid</h2>

      {pending ? (
        <div className="mt-8 space-y-4" aria-hidden>
          <div className="h-4 w-56 animate-pulse rounded-sm bg-muted" />
          <div className="h-72 animate-pulse rounded-sm bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-sm bg-muted" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {d && (
            <p className="mt-3 text-sm text-muted-foreground">
              Data for {fmtDate(d.date)} · updated daily
            </p>
          )}

          {d && (
            <figure className="mt-6 rounded-sm border border-border bg-card p-4 md:p-6">
              <h3 className="font-serif text-xl font-semibold text-foreground">Hourly generation by source</h3>
              <p className="mt-1 text-sm text-muted-foreground">Average power in each hour, in megawatts (MW)</p>
              <div className="mt-4 h-72 w-full md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.hours} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={2} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                    />
                    <Tooltip content={<ChartTooltip unit=" MW" />} />
                    {DAILY_SOURCES.map((s) => (
                      <Area
                        key={s}
                        type="monotone"
                        dataKey={s}
                        name={DAILY_LABELS[s]}
                        stackId="1"
                        stroke={DAILY_COLORS[s]}
                        fill={DAILY_COLORS[s]}
                        fillOpacity={0.85}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <figcaption>
                <DailyDataNote date={d.date} caveat="Most rooftop and other unlicensed solar is not included, so solar is undercounted." />
              </figcaption>
            </figure>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d && (
              <Stat
                label={`Yesterday, ${fmt(d.renewableShare)}% of Türkiye's electricity came from renewables`}
                value={`${fmt(d.totalGWh, 0)} GWh`}
                note="Total generation"
              />
            )}
            {r && (
              <Stat
                label={`This year's record wind day: ${fmtDate(r.recordWindDay.date)}`}
                value={`${fmt(r.recordWindDay.windGWh)} GWh`}
                note="Wind generation"
              />
            )}
            {r && (
              <Stat
                label={`Record solar day: ${fmtDate(r.recordSolarDay.date)}`}
                value={`${fmt(r.recordSolarDay.solarGWh)} GWh`}
                note="Solar generation"
              />
            )}
            {r && (
              <Stat
                label={`Highest renewable share: ${fmtDate(r.recordRenewableShareDay.date)}`}
                value={`${fmt(r.recordRenewableShareDay.renewableShare)}%`}
                note="Of daily generation"
              />
            )}
          </div>
          {(d || r) && <DailyDataNote date={latestHistoryDate(history.data ?? [])} />}
        </>
      )}
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-sm border-t-4 border-primary bg-secondary p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
