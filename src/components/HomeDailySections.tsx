import { useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyDataNote } from "@/components/DailyDataNote";
import { defaultHistoryYear, historyYear, historyYears, monthlyHistoryHighlights, fmtDate, fmtHistoryRange, historyHighlights, isPartialMonth, latestHistoryDate, useDailyHistory, type DailyHistoryDay, type DailySource } from "@/lib/daily";
import { fmt, SOURCE_COLORS, SOURCE_LABELS } from "@/lib/energy";

const DAILY_SOURCES = ["coal", "gas", "other_fossil", "hydro", "wind", "solar", "other_renewables", "other"] as const;

const DAILY_LABELS: Record<DailySource, string> = { ...SOURCE_LABELS, other: "Other" };
const DAILY_COLORS: Record<DailySource, string> = { ...SOURCE_COLORS, other: "var(--muted-foreground)" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const parseDate = (iso: string) => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

export function HomeDailySections() {
  const q = useDailyHistory();
  const [selectedYear, setSelectedYear] = useState<number>();
  const years = useMemo(() => historyYears(q.data ?? []), [q.data]);
  const year = selectedYear !== undefined && years.includes(selectedYear) ? selectedYear : defaultHistoryYear(q.data ?? []) ?? years.at(-1);
  const days = useMemo(() => year === undefined ? [] : historyYear(q.data ?? [], year), [q.data, year]);

  if (q.status === "error") return null;

  if (q.status === "pending" || year === undefined) {
    return (
      <section className="border-t border-border py-12" aria-hidden>
        <div className="space-y-4">
          <div className="h-4 w-56 animate-pulse rounded-sm bg-muted" />
          <div className="h-48 animate-pulse rounded-sm bg-muted" />
          <div className="h-72 animate-pulse rounded-sm bg-muted" />
        </div>
      </section>
    );
  }

  const dataThrough = latestHistoryDate(q.data ?? []);

  return (
    <Tabs value={String(year)} onValueChange={(value) => setSelectedYear(Number(value))} className="mt-6">
      <TabsList aria-label="Daily data year" className="h-auto max-w-full flex-wrap justify-start rounded-sm">
        {years.map((y) => <TabsTrigger key={y} value={String(y)} className="rounded-sm">{y}</TabsTrigger>)}
      </TabsList>
      <TabsContent value={String(year)} key={year}>
        <CalendarHeatmap days={days} year={year} dataThrough={dataThrough} />
        <MonthByMonth days={days} year={year} dataThrough={dataThrough} />
        <WeekdayChart days={days} year={year} dataThrough={dataThrough} />
      </TabsContent>
    </Tabs>
  );
}

function Section({ kicker, title, children, dataThrough }: { kicker: string; title: string; children: ReactNode; dataThrough?: string | undefined }) {
  return (
    <section className="border-t border-border py-12">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-foreground">{kicker}</p>
      <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">{title}</h2>
      {children}
      <DailyDataNote date={dataThrough} />
    </section>
  );
}

function YearNotes({ year, children }: { year: number; children: ReactNode }) {
  if (year !== 2026) return null;
  return <div className="mt-6 max-w-3xl space-y-4 leading-relaxed text-foreground">
    <p className="text-xs font-semibold text-muted-foreground">Notes on 2026</p>
    {children}
  </div>;
}

/* ---------- 1. Calendar heatmap ---------- */

const CELL = 13;
const PITCH = 16;
const GREENS = [
  "oklch(0.94 0.03 150)",
  "oklch(0.85 0.08 150)",
  "oklch(0.74 0.12 150)",
  "oklch(0.62 0.14 150)",
  "oklch(0.5 0.13 150)",
];

type HistoryChartProps = { days: DailyHistoryDay[]; year: number; dataThrough?: string | undefined };

function CalendarHeatmap({ days, year, dataThrough }: HistoryChartProps) {
  const [hover, setHover] = useState<DailyHistoryDay | null>(null);
  const highlights = useMemo(() => historyHighlights(days), [days]);
  const weekValue = (week: typeof highlights.greenestWeek) => week
    ? `${fmtHistoryRange(week.start, week.end)} · ${fmt(week.average)}%`
    : "Not enough consecutive days yet";

  const { cells, months, cols, min, max } = useMemo(() => {
    const jan1 = new Date(year, 0, 1);
    const jan1Dow = (jan1.getDay() + 6) % 7; // Monday = 0
    const cells = days.map((d) => {
      const dt = parseDate(d.date);
      const offset = Math.round((dt.getTime() - jan1.getTime()) / 86400000);
      return { d, col: Math.floor((offset + jan1Dow) / 7), row: (dt.getDay() + 6) % 7 };
    });
    const cols = Math.max(...cells.map((c) => c.col)) + 1;
    const months: { label: string; col: number }[] = [];
    let prevM = -1;
    for (const c of cells) {
      const m = parseDate(c.d.date).getMonth();
      if (m !== prevM) {
        months.push({ label: MONTHS[m] ?? "", col: c.col });
        prevM = m;
      }
    }
    const shares = days.map((d) => d.renewableShare);
    return { cells, months, cols: cells.length ? cols : 1, min: shares.length ? Math.min(...shares) : 0, max: shares.length ? Math.max(...shares) : 0 };
  }, [days, year]);

  const color = (v: number) =>
    GREENS[Math.min(GREENS.length - 1, Math.floor(((v - min) / (max - min || 1)) * GREENS.length))] ?? GREENS[0];

  const left = 30;
  const top = 18;
  const w = left + cols * PITCH;
  const h = top + 7 * PITCH;

  return (
    <Section kicker={`${year}, day by day`} title={`Renewable share of electricity, every day in ${year}`} dataThrough={dataThrough}>
      {days.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No complete days available for {year} yet.</p>}
      <div className="mt-6 overflow-x-auto rounded-sm border border-border bg-card p-4">
        <svg width={w} height={h} className="block" style={{ minWidth: w }} role="img"
          aria-label={`Calendar heatmap of daily renewable share in ${year}`}>
          {months.map((m) => (
            <text key={`${m.label}-${m.col}`} x={left + m.col * PITCH} y={10} fontSize={10} className="fill-muted-foreground">
              {m.label}
            </text>
          ))}
          {WEEKDAYS.map((l, i) =>
            i % 2 === 0 ? (
              <text key={l} x={0} y={top + i * PITCH + 11} fontSize={9} className="fill-muted-foreground">
                {l}
              </text>
            ) : null,
          )}
          {cells.map((c) => (
            <rect
              key={c.d.date}
              x={left + c.col * PITCH}
              y={top + c.row * PITCH}
              width={CELL}
              height={CELL}
              rx={2}
              fill={color(c.d.renewableShare)}
              onMouseEnter={() => setHover(c.d)}
              onClick={() => setHover(c.d)}
            >
              <title>{`${fmtDate(c.d.date)}: ${fmt(c.d.renewableShare)}% renewable, ${fmt(c.d.totalGWh, 0)} GWh total`}</title>
            </rect>
          ))}
        </svg>
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <span>{fmt(min, 0)}%</span>
          {GREENS.map((g) => (
            <span key={g} className="inline-block h-3 w-3 rounded-sm" style={{ background: g }} />
          ))}
          <span>{fmt(max, 0)}%</span>
          <span className="ml-2">renewable share</span>
        </div>
        <p className="mt-2 min-h-5 text-sm text-muted-foreground">
          {hover
            ? `${fmtDate(hover.date)} · ${fmt(hover.renewableShare)}% renewable · ${fmt(hover.totalGWh, 0)} GWh total`
            : "Hover or tap a day for details"}
        </p>
      </div>
      <aside aria-labelledby="heatmap-highlights-title" className="mt-4 rounded-sm border border-border bg-secondary p-4 md:p-5">
        <h3 id="heatmap-highlights-title" className="text-sm font-semibold text-foreground">Highlights so far</h3>
        <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {[
            { label: "Greenest week", value: weekValue(highlights.greenestWeek) },
            { label: "Least green week", value: weekValue(highlights.leastGreenWeek) },
            { label: "Record day", value: highlights.recordDay ? `${fmtHistoryRange(highlights.recordDay.date)} · ${fmt(highlights.recordDay.renewableShare)}%` : "No complete days yet" },
            { label: "Days above 50% renewables", value: `${highlights.above50} out of ${highlights.totalDays} days counted` },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </aside>
      <YearNotes year={year}>
        <h3 className="font-serif text-xl font-semibold text-foreground">The holiday effect</h3>
        <p>When I first saw the heatmap, the darkest green patch at the end of May caught my eye. I assumed it was just a rainy, windy week. It turned out to be something else too: a holiday.</p>
        <p>The six days with the lowest electricity generation of the whole year, 26–31 May, line up almost exactly with Kurban Bayramı (Eid al-Adha), one of Türkiye's biggest public holidays. Factories and offices close, so demand drops sharply. At the same time, the dams were still full from the spring rain and snowmelt. Less demand plus plenty of water meant renewables could cover a much bigger slice of it. The record day, 29 May, fell right in the middle of the holiday.</p>
        <p>You can see a smaller version of the same thing in March, around Ramazan Bayramı (Eid al-Fitr), when generation dipped and renewables climbed above 70%.</p>
      </YearNotes>
    </Section>
  );
}

/* ---------- 2. Month by month ---------- */

function MonthByMonth({ days, year, dataThrough }: HistoryChartProps) {
  const [mode, setMode] = useState<"gwh" | "share">("gwh");
  const highlights = useMemo(() => monthlyHistoryHighlights(days, year), [days, year]);
  const monthValue = (value: typeof highlights.hydro) => value
    ? `${new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(`${value.month}-01T00:00:00Z`))} · ${fmt(value.share)}%`
    : "No months with at least 20 days yet";

  const { data, partialLabels, lastDate } = useMemo(() => {
    const byMonth = new Map<number, DailyHistoryDay[]>();
    for (const d of days) {
      const m = +d.date.slice(5, 7) - 1;
      const list = byMonth.get(m);
      if (list) list.push(d);
      else byMonth.set(m, [d]);
    }
    const partialLabels: string[] = [];
    const data = [...byMonth.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([m, list]) => {
        const label = MONTHS[m] ?? "";
        const partial = isPartialMonth(year, m, list);
        if (partial) partialLabels.push(label);
        const row: Record<string, number | string> = { month: label + (partial ? "*" : "") };
        let sum = 0;
        const totals: Partial<Record<DailySource, number>> = {};
        for (const s of DAILY_SOURCES) {
          const sourceTotal = list.reduce((a, d) => a + (d.totalsGWh[s] || 0), 0);
          totals[s] = sourceTotal;
          sum += sourceTotal;
        }
        for (const s of DAILY_SOURCES) row[s] = mode === "gwh" ? (totals[s] ?? 0) : sum ? ((totals[s] ?? 0) / sum) * 100 : 0;
        return row;
      });
    return { data, partialLabels, lastDate: days.at(-1)?.date ?? "" };
  }, [days, mode, year]);

  return (
    <Section kicker="Month by month" title={`Monthly generation in ${year}`} dataThrough={dataThrough}>
      <div className="mt-6 rounded-sm border border-border bg-card p-4 md:p-6">
        <div className="mb-4 flex gap-1">
          {(
            [
              { id: "gwh", label: "Generation (GWh)" },
              { id: "share", label: "Share (%)" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id)}
              className={`rounded-sm border px-3 py-1 text-sm ${
                mode === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="h-72 w-full md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
                {...(mode === "share" ? { domain: [0, 100] } : {})}
                tickFormatter={(v: number) =>
                  mode === "share" ? `${Math.round(v)}%` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                }
              />
              <Tooltip content={<ChartTooltip unit={mode === "gwh" ? " GWh" : " %"} />} />
              {DAILY_SOURCES.map((s) => (
                <Bar key={s} dataKey={s} name={DAILY_LABELS[s]} stackId="1" fill={DAILY_COLORS[s]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {partialLabels.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            *{partialLabels.join(", ")} {partialLabels.length === 1 ? "is" : "are"} partial — data through {fmtDate(lastDate)}.
          </p>
        )}
      </div>
      <aside aria-labelledby="monthly-highlights-title" className="mt-4 rounded-sm border border-border bg-secondary p-4 md:p-5">
        <h3 id="monthly-highlights-title" className="text-sm font-semibold text-foreground">Highlights</h3>
        <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          {[
            { label: "Highest hydro share", value: highlights.hydro },
            { label: "Most gas-heavy month", value: highlights.gas },
            { label: "Windiest month", value: highlights.wind },
          ].map(({ label, value }) => <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-medium text-foreground">{monthValue(value)}</dd>
          </div>)}
        </dl>
      </aside>
      <YearNotes year={year}>
        <h3 className="font-serif text-xl font-semibold text-foreground">Snowmelt season</h3>
        <p>Hydropower in Türkiye follows the seasons. In January 2026 it supplied just 14% of the country's electricity. By May it was close to half. As the snow in the mountains melts in spring, rivers swell and the dams fill up.</p>
        <p>Winter is the opposite. There is less water in the rivers and more demand for heating and lighting, so gas plants have to work much harder. On the bright side, winter is also when the wind tends to blow strongest.</p>
      </YearNotes>
    </Section>
  );
}

/* ---------- 3. Weekdays vs. weekends ---------- */

function WeekdayChart({ days, year, dataThrough }: HistoryChartProps) {
  const data = useMemo(() => {
    const sums = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
    for (const d of days) {
      const wd = (parseDate(d.date).getDay() + 6) % 7;
      const bucket = sums[wd];
      if (bucket) { bucket.sum += d.totalGWh; bucket.n += 1; }
    }
    return WEEKDAYS.map((day, i) => {
      const bucket = sums[i];
      return { day, gwh: bucket?.n ? bucket.sum / bucket.n : 0 };
    });
  }, [days]);

  return (
    <Section kicker="Weekdays vs. weekends" title={`Average daily generation by day of the week, ${year}`} dataThrough={dataThrough}>
      <div className="mt-6 rounded-sm border border-border bg-card p-4 md:p-6">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
                domain={[0, "auto"]}
              />
              <Tooltip content={<ChartTooltip unit=" GWh" />} />
              <Bar dataKey="gwh" name="Average daily generation" fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <YearNotes year={year}>
        <h3 className="font-serif text-xl font-semibold text-foreground">Sunday is different</h3>
        <p>On an average Sunday, Türkiye generates about 15% less electricity than on a weekday. Saturdays are only about 5% lower. Most offices and many factories are closed on Sunday, and you can see it in the data.</p>
        <p>What surprised me is which power plants slow down. Gas generation drops by almost half on Sundays, while coal falls by only about 12%. When demand goes down, gas is the first thing to be turned off. It is the same pattern I found on the Hydro &amp; Drought page: coal plants run steadily in the background, and gas plants are the ones that move up and down.</p>
        <p>Renewables, meanwhile, keep producing as usual. So on Sundays their share of the total rises, about 4 percentage points higher than on a typical weekday.</p>
      </YearNotes>
    </Section>
  );
}
