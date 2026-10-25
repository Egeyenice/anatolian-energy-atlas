Türkiye Energy Atlas
Where does Türkiye's electricity come from, and how is that changing?
Türkiye Energy Atlas is a data-journalism website that tells the story of Türkiye's electricity system with real data: 25 years of generation by source, how droughts push the country toward imported fuels, why solar capacity grows faster than solar output, and what the grid looked like yesterday, hour by hour.
🔗 Live site: https://anatolian-energy-atlas.lovable.app
---
What's on the site
Page	What it shows
Home	Yesterday's hourly electricity mix, updated automatically every morning, plus this year's record days for wind, solar and renewable share
Trends	How each source's share changed from 2000 to 2025; how coal overtook gas; why the rise of coal shifted, rather than reduced, Türkiye's import dependence; solar and wind capacity vs. actual generation
Hydro & Drought	How dams and rivers respond to rainfall, and what fills the gap when the rivers run low
About & Methodology	Data sources, how the data was processed and checked, and what I learned
Data sources
Data	Source	Coverage
Annual electricity generation by source	Ember, via Our World in Data (CC BY 4.0)	2000–2025
Installed solar and wind capacity	IRENA, via Our World in Data (CC BY 4.0)	2000–2025
Hourly real-time generation	EPİAŞ Transparency Platform	1 January 2026 – yesterday, updated daily
Context on coal imports and plant utilisation	Ember, Türkiye Electricity Review 2025 and 2026	—
How the daily data works
A small Python script (`scripts/fetch_epias.py`) runs every morning at 07:17 Türkiye time on GitHub Actions (`.github/workflows/daily-energy-data.yml`). It:
Logs in to the EPİAŞ Transparency Platform API (credentials are stored as encrypted GitHub secrets, never in the code).
Downloads hourly generation for the last 7 days, so a day missed because of a temporary timeout is filled in automatically on a later run.
Groups EPİAŞ's 17 fuel categories into the site's categories (for example, lignite + imported coal + hard coal + asphaltite → coal; dam + run-of-river → hydro).
Writes three small files to `public/data/daily/`: yesterday's hourly values, a daily history, and this year's records.
Commits them to this repository. The website reads these files directly, so it updates without any manual step.
How I checked the data
Annual data: I compared the extracted values with figures published in Ember's Türkiye Electricity Review 2025. For 2024, coal, gas, hydro, and wind + solar all match within about 1 TWh.
Daily data: I summed hourly values on the EPİAŞ platform by hand for sample days and compared them with the script's output. Both 30 July 2026 wind generation (263.12 GWh) and 19 October 2026 hydro generation (245.31 GWh) match exactly.
The script's daily total is about 1% higher than EPİAŞ's "Total" column. The difference is exactly the platform's international exchange column (net exports), which I deliberately left out so that the site shows electricity generated in Türkiye.
Known limitations
Real-time data covers licensed power plants only. Most rooftop and other unlicensed solar is not included, so solar looks smaller in the daily chart than in the annual statistics.
2025 annual figures are preliminary and may be revised.
Annual and capacity values were extracted from Our World in Data chart files and are accurate to about ±0.1 TWh / ±0.05 GW.
Capacity factors use the average of start-of-year and end-of-year capacity. In years with very fast growth (for example, solar in 2017 and 2023), this slightly understates the true value.
Built with
Lovable (AI app builder) for the website, with Recharts for the charts
Python and GitHub Actions for the daily data pipeline
The analysis and interpretation on each page are my own
About
Built by Yiğit Ege Yenice (@Egeyenice) in October 2026.
Data from Ember, IRENA and Our World in Data is used under the CC BY 4.0 license. Hourly data © EPİAŞ.
