const SITE_NAME = "Türkiye Energy Atlas";
const SITE_URL = "https://anatolian-energy-atlas.lovable.app";
const SHARE_IMAGE = `${SITE_URL}/social-preview.jpg`;
const SITE_DESCRIPTION = "How Türkiye generates its electricity: 25 years of data, live daily updates, a power plant map, country comparisons and a scenario simulator.";

/** Leaf-only metadata: each page owns its canonical URL and sharing tags. */
export function pageHead(page: string, path: string, description = SITE_DESCRIPTION) {
  const title = page === "Home" ? SITE_NAME : `${page} – ${SITE_NAME}`;
  const shareTitle = page === "Home" ? SITE_NAME : title;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: shareTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:url", content: `${SITE_URL}${path}` },
      { property: "og:image", content: SHARE_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Türkiye Energy Atlas with a decorative electricity chart" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: shareTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: SHARE_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}${path}` }],
  };
}