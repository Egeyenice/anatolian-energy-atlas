import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { sitemapStaticPaths, sitemapXML } from "./sitemap";

describe("Public sitemap", () => {
  it("lists all seven content pages and excludes the sitemap itself", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(sitemapStaticPaths(router)).toEqual([
      "/", "/about", "/compare", "/hydro-drought", "/map", "/simulator", "/trends",
    ]);
  });

  it("uses the published domain without fabricated modification dates", () => {
    const xml = sitemapXML("https://anatolian-energy-atlas.lovable.app", [{ path: "/" }, { path: "/map" }]);
    const document = new DOMParser().parseFromString(xml, "application/xml");
    expect([...document.querySelectorAll("loc")].map((element) => element.textContent)).toEqual([
      "https://anatolian-energy-atlas.lovable.app/", "https://anatolian-energy-atlas.lovable.app/map",
    ]);
    expect(document.querySelector("lastmod")).toBeNull();
  });
});