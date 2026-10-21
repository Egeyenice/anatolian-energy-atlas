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
- Home's daily-data sections (YesterdaySection, HomeDailySections) fetch latest.json/records.json/history.json from the raw GitHub URL in src/lib/daily.ts at runtime; they hide gracefully on fetch error, filter history to hoursAvailable === 24, and compute all aggregates (monthly, weekday, heatmap buckets) in the app.
