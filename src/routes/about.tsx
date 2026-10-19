import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Methodology – Turkey Energy Atlas" },
      { name: "description", content: "Data source, methodology and background of the Turkey Energy Atlas." },
      { property: "og:title", content: "About & Methodology – Turkey Energy Atlas" },
      { property: "og:description", content: "Where the data comes from and how the Turkey Energy Atlas was built." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="border-t border-border py-8">
      <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">{title}</h2>
      {children}
      <p className="text-lg leading-relaxed text-muted-foreground italic">[to be written]</p>
    </section>
  );
}

function About() {
  return (
    <div className="mx-auto max-w-2xl px-5">
      <PageHeader kicker="About" title="About & Methodology" />
      <Section title="Data source">
        <p className="mb-3 text-lg text-foreground">
          Electricity generation data comes from{" "}
          <a className="text-primary underline" href="https://ember-energy.org" target="_blank" rel="noreferrer">Ember</a>.
        </p>
        <p className="mb-3 text-sm text-muted-foreground">Data: Ember, via Our World in Data (CC BY 4.0)</p>
      </Section>
      <Section title="How I built this" />
      <Section title="What I learned" />
      <Section title="About me" />
    </div>
  );
}
