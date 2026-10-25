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
- Home's daily-data sections (YesterdaySection, HomeDailySections) fetch latest.json/history.json from the raw GitHub URL in src/lib/daily.ts at runtime; they hide gracefully on fetch error and compute all aggregates in the app, including the record wind/solar/renewable-share cards, which historyRecords derives from history.json rather than a stored records file. The Home route owns the shared year choice so the record cards and the year tabs always agree; pure daily helpers select distinct complete days, choose the default year, calculate monthly source-share highlights, and determine calendar-month completeness so all history views use consistent data independently of today's date.
- Home daily freshness captions share DailyDataNote and pure daily date helpers; the clock starts after hydration and refreshes each minute so stale indicators stay current without SSR mismatches.
- Heatmap highlights are computed by the pure historyHighlights helper in src/lib/daily.ts, with rolling-window and eligibility tests alongside existing daily tests, so calculations stay independent of presentation.
- Home's year selector uses the shared Button with native accessible tab roles and keyboard navigation rather than Radix Tabs, avoiding the extra context-dependent runtime on the daily-data path.
- Simulator page (src/routes/simulator.tsx): all model constants come from /public/data/simulator.json via src/lib/simulator.ts (simulate() implements the dispatch rules: coal capped at coalMax, gas floored at gasMin, clean sources scaled down proportionally when residual < gasMin). Never hardcode model numbers in the route; dispatch-rule changes belong in simulator.ts with a test in simulator.test.ts.
- The shared Analysis component (src/components/site.tsx) renders user-written prose unchanged; its section paragraphs accept either a string or a React node so a paragraph can carry an inline <Link>, and the *** marker convention only applies to plain-string paragraphs.
- Content routes use the shared pageHead helper for leaf-only metadata and self-referencing canonical URLs; the dedicated public social cover is sharing-only so page charts and prose remain unchanged.
- Keep sharing tags in route head() rendered by HeadContent during SSR, not browser effects or duplicate root image tags; social crawlers must receive complete per-page metadata without JavaScript.
- The sitemap server route derives public URLs from the router's required staticData.sitemap decisions; omit lastmod unless an authoritative page-specific content timestamp exists so publishing never fabricates change dates.
