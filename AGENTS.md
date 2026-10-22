<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Electricity-generation charts read /public/data/energy.json via useEnergyData; shares are computed, never stored, so the data file can change without code edits.
- The Trends capacity comparison uses a separate component and /public/data/capacity.json for installed capacity and nullable capacity factors; generation remains sourced from useEnergyData to keep electricity output consistent across charts.

- The Map page (src/routes/map.tsx) renders Leaflet only client-side: src/components/PlantsMap.tsx is React.lazy behind <ClientOnly>, and shared plant data/types live in src/lib/plants.ts so the SSR graph never imports leaflet.
- Home's daily-data sections (YesterdaySection, HomeDailySections) fetch latest.json/records.json/history.json from the raw GitHub URL in src/lib/daily.ts at runtime; they hide gracefully on fetch error and compute all aggregates in the app. Shared daily helpers select the latest year with 24-hour records and determine monthly completeness from distinct dates versus calendar month length, keeping all three history charts consistent without relying on the current date.
- Home daily freshness captions share DailyDataNote and pure daily date helpers; the clock starts after hydration and refreshes each minute so stale indicators stay current without SSR mismatches.
- Heatmap highlights are computed by the pure historyHighlights helper in src/lib/daily.ts, with rolling-window and eligibility tests alongside existing daily tests, so calculations stay independent of presentation.
- Simulator page (src/routes/simulator.tsx): all model constants come from /public/data/simulator.json via src/lib/simulator.ts (simulate() implements the dispatch rules: coal capped at coalMax, gas floored at gasMin, clean sources scaled down proportionally when residual < gasMin). Never hardcode model numbers in the route; dispatch-rule changes belong in simulator.ts with a test in simulator.test.ts.
- The shared Analysis component (src/components/site.tsx) renders user-written prose unchanged; its section paragraphs accept either a string or a React node so a paragraph can carry an inline <Link>, and the *** marker convention only applies to plain-string paragraphs.
