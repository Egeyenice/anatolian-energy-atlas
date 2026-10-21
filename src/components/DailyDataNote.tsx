import { useEffect, useState } from "react";
import { fmtDate, isDailyDataStale } from "@/lib/daily";

export function DailyDataNote({ date, caveat }: { date?: string | undefined; caveat?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  if (!date) return null;
  const stale = now ? isDailyDataStale(date, now) : false;
  return (
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
      <span aria-hidden="true" className={stale ? "text-muted-foreground" : "text-live-data"}>●</span>{" "}
      {stale ? `Last updated ${fmtDate(date)}` : `Updated automatically every morning · Data through ${fmtDate(date)}`}
      {" · Source: EPİAŞ real-time generation, licensed plants only"}
      {caveat ? ` · ${caveat}` : ""}
    </p>
  );
}