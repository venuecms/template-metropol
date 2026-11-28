import type { Page } from "@venuecms/sdk-next";
import { describe, expect, it } from "vitest";

import { buildNavItems } from "./items";

const page = (id: string, slug: string, parentId?: string) =>
  ({
    id,
    slug,
    parentId,
    type: "PAGE",
    localizedContent: [{ locale: "en", title: slug.toUpperCase() }],
  }) as unknown as Page;

describe("buildNavItems", () => {
  const pages = [
    page("1", "about"),
    page("2", "team", "1"),
    page("3", "history", "1"),
    page("4", "deep", "2"),
    page("5", "contact"),
  ];

  it("lists the root pages, in the order the CMS returns them", () => {
    expect(buildNavItems(pages, "en").map((item) => item.title)).toEqual([
      "ABOUT",
      "CONTACT",
    ]);
  });

  it("hangs each root page's direct sub-pages off it", () => {
    const [about, contact] = buildNavItems(pages, "en");

    expect(about.children.map((child) => child.title)).toEqual([
      "TEAM",
      "HISTORY",
    ]);
    expect(contact.children).toEqual([]);
  });

  // The nav goes one level deep; anything below is left out.
  it("stops at the first level of sub-pages", () => {
    const [about] = buildNavItems(pages, "en");

    expect(about.children.every((child) => child.children.length === 0)).toBe(
      true,
    );
  });

  // A sub-page lives under /p/ even when its slug matches a reserved root route.
  it("links sub-pages through the shared page resolver", () => {
    const [about] = buildNavItems(
      [page("1", "about"), page("2", "shop", "1")],
      "en",
    );

    expect(about.href).toBe("/p/about");
    expect(about.children[0].href).toBe("/p/shop");
  });
});
