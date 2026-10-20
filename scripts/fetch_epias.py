"""
Fetch Türkiye's hourly real-time electricity generation from the EPİAŞ
Transparency Platform and write small JSON files the website reads.

Outputs (in public/data/daily/):
  latest.json   - yesterday's 24 hourly values + daily totals and renewable share
  history.json  - one summary row per day (grows over time)
  records.json  - this year's record days (wind, solar, renewable share)

Usage:
  python scripts/fetch_epias.py                 # fetch yesterday
  python scripts/fetch_epias.py --backfill 2026-01-01   # fetch every day from that date to yesterday

Credentials come from environment variables EPIAS_USERNAME and EPIAS_PASSWORD
(set them as GitHub Actions secrets, never in code).

Note: the real-time generation service covers licensed power plants only.
Most unlicensed (rooftop / self-consumption) solar is NOT included, so solar
is undercounted compared with annual statistics.
"""

import argparse
import json
import os
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests

TGT_URL = "https://giris.epias.com.tr/cas/v1/tickets"
GEN_URL = "https://seffaflik.epias.com.tr/electricity-service/v1/generation/data/realtime-generation"
TR_TZ = timezone(timedelta(hours=3))
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data" / "daily"

# How EPİAŞ fields map to the categories used on the website.
GROUPS = {
    "coal": ["lignite", "importCoal", "blackCoal", "asphaltiteCoal"],
    "gas": ["naturalGas", "lng"],
    "hydro": ["dammedHydro", "river"],
    "wind": ["wind"],
    "solar": ["sun"],
    "other_renewables": ["geothermal", "biomass"],
    "other_fossil": ["fueloil", "naphta"],
    "other": ["wasteheat"],
}
IGNORED = {"date", "hour", "total", "importExport"}
RENEWABLE = ["hydro", "wind", "solar", "other_renewables"]
CATEGORIES = list(GROUPS.keys())


def get_tgt() -> str:
    user = os.environ.get("EPIAS_USERNAME")
    pw = os.environ.get("EPIAS_PASSWORD")
    if not user or not pw:
        sys.exit("EPIAS_USERNAME / EPIAS_PASSWORD are not set.")
    r = requests.post(
        TGT_URL,
        data={"username": user, "password": pw},
        headers={"Accept": "text/plain", "Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    if r.status_code != 201 or not r.text.startswith("TGT-"):
        sys.exit(f"Login failed: HTTP {r.status_code} {r.text[:200]}")
    return r.text.strip()


def fetch_day(tgt: str, day: date) -> list[dict]:
    start = datetime(day.year, day.month, day.day, tzinfo=TR_TZ).isoformat()
    body = {"startDate": start, "endDate": start}
    r = requests.post(
        GEN_URL,
        json=body,
        headers={"TGT": tgt, "Accept": "application/json", "Content-Type": "application/json"},
        timeout=60,
    )
    if r.status_code != 200:
        raise RuntimeError(f"{day}: HTTP {r.status_code} {r.text[:300]}")
    items = r.json().get("items", [])
    # Keep only rows belonging to the requested day.
    return [it for it in items if str(it.get("date", "")).startswith(day.isoformat())]


_warned_fields: set[str] = set()


def group_row(item: dict) -> dict:
    """Convert one EPİAŞ hourly row (MWh) into website categories (MWh)."""
    out = {c: 0.0 for c in CATEGORIES}
    known = {f for fields in GROUPS.values() for f in fields}
    for key, val in item.items():
        if key in IGNORED or not isinstance(val, (int, float)):
            continue
        if key in known:
            cat = next(c for c, fields in GROUPS.items() if key in fields)
            out[cat] += float(val)
        else:
            out["other"] += float(val)
            if key not in _warned_fields:
                print(f"Note: unknown field '{key}' counted as 'other'")
                _warned_fields.add(key)
    return out


def summarize_day(day: date, items: list[dict]) -> dict:
    hours = []
    for it in sorted(items, key=lambda x: str(x.get("date"))):
        g = group_row(it)
        hour = str(it.get("date"))[11:16] or str(it.get("hour", ""))
        hours.append({"hour": hour, **{k: round(v, 1) for k, v in g.items()}})
    totals = {c: sum(h[c] for h in hours) for c in CATEGORIES}
    total = sum(totals.values())
    ren = sum(totals[c] for c in RENEWABLE)
    return {
        "date": day.isoformat(),
        "hoursAvailable": len(hours),
        "unit": "MWh",
        "hours": hours,
        "totalsGWh": {c: round(v / 1000, 2) for c, v in totals.items()},
        "totalGWh": round(total / 1000, 2),
        "renewableShare": round(ren / total * 100, 1) if total else None,
    }


def load_json(path: Path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def compute_records(history: list[dict], year: int) -> dict:
    rows = [r for r in history if r["date"].startswith(str(year)) and r["hoursAvailable"] >= 24]
    if not rows:
        return {"year": year, "daysCounted": 0}

    def best(key):
        r = max(rows, key=key)
        return r

    w = best(lambda r: r["totalsGWh"]["wind"])
    s = best(lambda r: r["totalsGWh"]["solar"])
    rs = best(lambda r: r["renewableShare"] or 0)
    return {
        "year": year,
        "daysCounted": len(rows),
        "recordWindDay": {"date": w["date"], "windGWh": w["totalsGWh"]["wind"]},
        "recordSolarDay": {"date": s["date"], "solarGWh": s["totalsGWh"]["solar"]},
        "recordRenewableShareDay": {"date": rs["date"], "renewableShare": rs["renewableShare"]},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backfill", help="Start date YYYY-MM-DD; fetch every day up to yesterday")
    args = ap.parse_args()

    yesterday = datetime.now(TR_TZ).date() - timedelta(days=1)
    start = date.fromisoformat(args.backfill) if args.backfill else yesterday
    days = [start + timedelta(days=i) for i in range((yesterday - start).days + 1)]

    history_path = OUT_DIR / "history.json"
    history = load_json(history_path, [])
    by_date = {r["date"]: r for r in history}

    tgt = get_tgt()
    tgt_time = time.time()
    latest = None
    for d in days:
        if time.time() - tgt_time > 90 * 60:  # TGT lasts 2 hours; refresh early
            tgt, tgt_time = get_tgt(), time.time()
        try:
            items = fetch_day(tgt, d)
        except Exception as e:  # keep going on a bad day during backfill
            print(f"Skipped {d}: {e}")
            continue
        if not items:
            print(f"No data for {d}")
            continue
        summary = summarize_day(d, items)
        if summary["hoursAvailable"] < 24:
            print(f"Warning: {d} has only {summary['hoursAvailable']} hours")
        by_date[d.isoformat()] = {k: v for k, v in summary.items() if k != "hours"}
        latest = summary
        print(f"{d}: {summary['totalGWh']} GWh, renewables {summary['renewableShare']}%")
        if len(days) > 1:
            time.sleep(0.5)

    if latest is None:
        sys.exit("No new data fetched.")

    history = sorted(by_date.values(), key=lambda r: r["date"])
    save_json(history_path, history)
    save_json(OUT_DIR / "latest.json", latest)
    save_json(OUT_DIR / "records.json", compute_records(history, yesterday.year))
    print("Done.")


if __name__ == "__main__":
    main()   
