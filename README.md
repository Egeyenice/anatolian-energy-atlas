# Anatolian Energy Atlas

Build a data-journalism website called "Turkey Energy Atlas" that tells the story of how Türkiye generates its electricity and how this has changed since 2000. Style it like Our World in Data: clean, credible, minimal, lots of white space, readable typography. Fully responsive (must look good on mobile). English language.

IMPORTANT – DATA RULES:
- Do NOT invent any real-world numbers. All charts must read from a single data file: /public/data/energy.json
- For now, fill that file with clearly fake placeholder values so I can see the layout. I will replace it with real data later.
- Data format (electricity generation in TWh per year):
  {
    "source": "Ember",
    "years": [
      { "year": 2000, "coal": 0, "gas": 0, "hydro": 0, "wind": 0, "solar": 0, "other_renewables": 0, "other_fossil": 0 }
    ]
  }
  Include years 2000 to 2025.
- All percentages (shares) must be calculated in the app from these TWh values, not stored.
- A separate config file /src/config/droughtYears.ts should contain an editable list of drought years, e.g. [2008, 2014, 2021].

COLOR SYSTEM (use consistently on every chart):
coal = dark gray, gas = orange, hydro = blue, wind = teal, solar = yellow, other_renewables = green, other_fossil = brown.

PAGES:

1. Home
- Hero: title "Where does Türkiye's electricity come from?" and a one-sentence subtitle.
- 3 stat cards calculated from the latest year in the data: renewable share (%), largest single source, change in renewable share since 2000 (percentage points).
- Cards linking to the other pages.

2. Trends
- Main chart: stacked area chart of each source over time, with a toggle between "Share (%)" and "Generation (TWh)".
- Second chart: line chart of total renewable share (hydro + wind + solar + other_renewables) over time.
- Hover tooltips showing exact values for each year.
- A text section below each chart with the placeholder text "[MY ANALYSIS – to be written]".

3. Hydro & Drought
- Bar chart of hydro generation per year; bars for drought years (from the config file) highlighted in a different shade with a small label.
- Line chart comparing hydro vs. coal + gas combined, so it is visible whether fossil fuels rise when hydro falls.
- Several text sections with the placeholder "[MY ANALYSIS – to be written]". Do not write the analysis yourself.

4. About & Methodology
- Sections: "Data source" (Ember, with link to https://ember-energy.org and credit line "Data: Ember, licensed under CC BY 4.0"), "How I built this", "What I learned", "About me". All section bodies as placeholders "[to be written]".

GLOBAL:
- Top navigation bar with the 4 pages; footer on every page with "Data: Ember (CC BY 4.0)" and a link to a GitHub repository (placeholder URL).
- Use Recharts for all charts.
- Charts must handle the data file changing (number of years, values) without code changes.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://anatolian-energy-atlas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0b395b0e-cd18-45f6-a03c-454dc8f142f5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
