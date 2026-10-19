import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/trends", label: "Trends" },
  { to: "/hydro-drought", label: "Hydro & Drought" },
  { to: "/about", label: "About & Methodology" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="font-serif text-xl font-bold text-primary">Turkey Energy Atlas</Link>
        <nav className="-mx-1 flex gap-1 overflow-x-auto text-sm">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="whitespace-nowrap rounded px-2 py-1 text-muted-foreground hover:text-foreground"
              activeProps={{ className: "whitespace-nowrap rounded px-2 py-1 font-semibold text-primary underline underline-offset-4" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
        <span>Data: <a className="underline" href="https://ember-energy.org" target="_blank" rel="noreferrer">Ember</a>, via <a className="underline" href="https://ourworldindata.org" target="_blank" rel="noreferrer">Our World in Data</a> (CC BY 4.0)</span>
        <a className="underline" href="https://github.com/your-username/turkey-energy-atlas" target="_blank" rel="noreferrer">Source code on GitHub</a>
      </div>
    </footer>
  );
}

export function PageHeader({ kicker, title, intro }: { kicker?: string | undefined; title: string; intro?: string | undefined }) {
  return (
    <div className="mb-10 mt-10 md:mt-14">
      {kicker && <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-foreground">{kicker}</p>}
      <h1 className="font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">{title}</h1>
      {intro && <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{intro}</p>}
    </div>
  );
}

export function ChartCard({ title, subtitle, children, controls, note }: { title: string; subtitle?: string | undefined; children: ReactNode; controls?: ReactNode; note?: string | undefined }) {
  return (
    <figure className="rounded-sm border border-border bg-card p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground md:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {controls}
      </div>
      {children}
      <figcaption className="mt-3 text-xs text-muted-foreground">
        Data: Ember, via Our World in Data (CC BY 4.0)
        {note && <span className="mt-1 block italic">{note}</span>}
      </figcaption>
    </figure>
  );
}

export function Analysis({ title, text = "[MY ANALYSIS – to be written]" }: { title?: string; text?: string }) {
  return (
    <section className="mx-auto my-10 max-w-2xl">
      {title && <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">{title}</h3>}
      <p className="text-lg leading-relaxed text-muted-foreground italic">{text}</p>
    </section>
  );
}

export function DataState({ status }: { status: "pending" | "error" }) {
  return (
    <div className="flex h-64 items-center justify-center text-muted-foreground">
      {status === "pending" ? "Loading data…" : "The data file could not be loaded."}
    </div>
  );
}
