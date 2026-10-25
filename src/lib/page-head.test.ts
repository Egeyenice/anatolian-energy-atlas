import { describe, expect, it } from "vitest";
import { pageHead } from "./page-head";

describe("Published page addresses", () => {
  it.each([
    ["Home", "/"],
    ["Trends", "/trends"],
    ["Hydro & Drought", "/hydro-drought"],
    ["Map", "/map"],
    ["Compare", "/compare"],
    ["Simulator", "/simulator"],
    ["About & Methodology", "/about"],
  ])("uses the new domain for %s", (page, path) => {
    const head = pageHead(page, path);
    const url = `https://turkiye-energy-atlas.lovable.app${path}`;
    expect(head.links).toEqual([{ rel: "canonical", href: url }]);
    expect(head.meta).toContainEqual({ property: "og:url", content: url });
  });

  it("shares the same absolute JPEG address and image details", () => {
    const meta = pageHead("Home", "/").meta;
    const image = "https://turkiye-energy-atlas.lovable.app/social-preview.jpg";
    expect(meta).toContainEqual({ property: "og:image", content: image });
    expect(meta).toContainEqual({ name: "twitter:image", content: image });
    expect(meta).toContainEqual({ property: "og:image:width", content: "1200" });
    expect(meta).toContainEqual({ property: "og:image:height", content: "630" });
    expect(meta).toContainEqual({ property: "og:image:type", content: "image/jpeg" });
    expect(meta.find((tag) => "property" in tag && tag.property === "og:image:alt")?.content).toBeTruthy();
  });
});