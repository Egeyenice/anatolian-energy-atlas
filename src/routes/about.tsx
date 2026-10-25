import { pageHead } from "@/lib/page-head";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/site";

export const Route = createFileRoute("/about")({
  head: () => pageHead("About & Methodology", "/about", "Where the data comes from, how it was checked, and the limits of the Türkiye Energy Atlas."),
  component: About,
});

const LINKS: Record<string, string> = {
  Ember: "https://ember-energy.org",
  "Our World in Data": "https://ourworldindata.org",
};

/** Renders a source string with the site's usual links on Ember and Our World in Data. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/(Ember|Our World in Data)/g);
  return (
    <>
      {parts.map((p, i) =>
        LINKS[p] ? (
          <a key={i} className="underline" href={LINKS[p]} target="_blank" rel="noreferrer">
            {p}
          </a>
        ) : (
          p
        ),
      )}
    </>
  );
}

const SOURCES: { what: string; source: string; years: string }[] = [
  {
    what: "Electricity generation by source",
    source: "Ember, via Our World in Data (CC BY 4.0)",
    years: "2000–2025",
  },
  {
    what: "Installed solar and wind capacity",
    source: "IRENA, via Our World in Data (CC BY 4.0)",
    years: "2000–2025",
  },
  {
    what: "Country comparison (renewable share, carbon intensity)",
    source: "Ember, via Our World in Data (CC BY 4.0)",
    years: "2000–2025",
  },
  {
    what: "Hourly generation in Türkiye",
    source: "EPİAŞ Transparency Platform",
    years: "1 January 2026 – yesterday",
  },
  {
    what: "Power plant locations and capacities",
    source: "Wikipedia and Global Energy Monitor",
    years: "collected October 2026",
  },
  {
    what: "Context on coal, droughts and plant use",
    source: "Ember, Türkiye Electricity Review 2025 and 2026; Global Electricity Review 2026; European Electricity Review 2026",
    years: "—",
  },
  {
    what: "2035 solar and wind target",
    source: "Ministry of Energy and Natural Resources (announced October 2024)",
    years: "—",
  },
];

function Section({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="border-t border-border py-8">
      <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className="mt-3 text-lg leading-relaxed text-foreground first:mt-0">
          {p}
        </p>
      ))}
    </>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-3 list-disc space-y-3 pl-5 text-lg leading-relaxed text-foreground marker:text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Lead({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <strong>{label}</strong> {children}
    </>
  );
}

function SourceTable() {
  return (
    <div className="mt-4">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">What each dataset covers, where it comes from, and the years it spans</caption>
        <thead className="hidden md:table-header-group">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-4 text-left font-semibold text-foreground">
              What
            </th>
            <th scope="col" className="py-2 pr-4 text-left font-semibold text-foreground">
              Source
            </th>
            <th scope="col" className="py-2 text-left font-semibold text-foreground">
              Years
            </th>
          </tr>
        </thead>
        <tbody>
          {SOURCES.map((r) => (
            <tr key={r.what} className="block border-b border-border py-3 md:table-row md:py-0">
              <th scope="row" className="block text-left font-semibold text-foreground md:table-cell md:py-3 md:pr-4">
                {r.what}
              </th>
              <td className="mt-1 block text-muted-foreground md:mt-0 md:table-cell md:py-3 md:pr-4">
                <Linked text={r.source} />
              </td>
              <td className="mt-1 block text-muted-foreground md:mt-0 md:table-cell md:py-3">
                <Linked text={r.years} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function About() {
  return (
    <div className="mx-auto max-w-2xl px-5">
      <PageHeader kicker="About" title="About & Methodology" />
      <Section title="About me">
        <Prose
          paragraphs={[
            "I'm Yiğit Ege Yenice, and I want to study electrical and electronics engineering, or electrical and computer engineering, in the United States. It's a dream I've had for years.",
            "Before starting, I wanted to understand the field from somewhere close to home: how electricity works in my own country, and where it's heading. While I was learning, I thought others who are curious about this might want the same information in one place, so I built this atlas.",
            "In the future, I hope to do a master's degree in the US and build my career as an engineer.",
          ]}
        />
      </Section>
      <Section title="Where the data comes from">
        <SourceTable />
      </Section>
      <Section title="How I built this">
        <Prose
          paragraphs={[
            "The website itself was built with Lovable, an AI app builder, and the charts use Recharts. The map uses Leaflet with OpenStreetMap.",
            "The daily data comes from a small Python script that runs automatically every morning at 07:17 Türkiye time on GitHub Actions. It logs in to the EPİAŞ Transparency Platform, downloads the hourly generation data for the last seven days, groups EPİAŞ's 17 fuel types into the categories used on this site, and saves the results to the project's GitHub repository. The website reads those files directly, so it updates itself without anyone touching it. All the code is public on GitHub.",
            "I also used Claude, an AI assistant, to help me write the data scripts, check my numbers and polish my English. The questions, the analysis and the conclusions on every page are my own.",
          ]}
        />
      </Section>
      <Section title="How I checked the data">
        <Bullets
          items={[
            <Lead label="Annual figures:">
              I compared the yearly numbers with the figures Ember published in its Türkiye Electricity Review. For 2024, coal, gas, hydro, and wind and solar
              combined all match within about 1 TWh.
            </Lead>,
            <Lead label="Daily figures:">
              I added up hourly values by hand on the EPİAŞ platform for sample days and compared them with what my script produced. Wind generation on 30 July
              2026 (263.12 GWh) and hydro generation on 19 October 2026 (245.31 GWh) match exactly.
            </Lead>,
            <Lead label="One small difference:">
              My daily totals are about 1% higher than EPİAŞ's "Total" column. I traced this to the platform's international exchange column (Türkiye was a net
              exporter that day), which I left out on purpose, so the site shows only electricity generated inside Türkiye.
            </Lead>,
            <Lead label="Comparison data:">
              The 2025 values I extracted for each country match the values Our World in Data shows on its own map labels.
            </Lead>,
          ]}
        />
      </Section>
      <Section title="Limitations">
        <Bullets
          items={[
            "The hourly EPİAŞ data only covers licensed power plants. Most rooftop and other small solar is not included, so solar looks smaller in the daily charts than in the yearly figures.",
            "2025 annual figures are preliminary and may still be revised.",
            "Yearly values were read from Our World in Data chart files and are accurate to about ±0.1 TWh.",
            "Capacity factors use the average of start-of-year and end-of-year capacity, which slightly underestimates them in years with very fast growth.",
            "\u201CRenewables\u201D on this site means hydro, wind, solar, bioenergy and geothermal. Nuclear is low-carbon but not renewable.",
            "The Simulator is a simplified yearly model for exploring ideas, not a forecast. Its assumptions are listed on the Simulator page.",
          ]}
        />
      </Section>
      <Section title="What I learned">
        <Prose
          paragraphs={[
            "Before this project, I had never used GitHub or written anything that runs on its own. Now I have a small robot that wakes up every morning, downloads yesterday's data from Türkiye's electricity market, and updates this website without me touching it. Getting it to work took several tries, and each failure taught me something. But the bigger lessons were about energy itself. I learned how much countries are investing in renewables for the future of the planet, and that something as basic as electricity can widen a country's trade deficit when it depends on imported fuel.",
            "What surprised me most was the rain. Because hydropower is still Türkiye's largest renewable source, the difference between a wet year and a dry year is about 33 TWh, close to 10% of all the electricity the country uses in a year. In a dry year, most of that gap is filled with imported gas. I never expected the weather to matter this much to a country's energy imports.",
          ]}
        />
      </Section>
    </div>
  );
}
