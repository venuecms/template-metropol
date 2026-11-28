import type { Site } from "@venuecms/sdk-next";
import { describe, expect, it } from "vitest";

import { relatedArtistsCountOf, showsRelatedArtists } from "./index";

const site = (options?: Record<string, unknown>) =>
  ({
    settings: { publicSite: { template: { config: { options } } } },
  }) as unknown as Site;

describe("relatedArtistsCountOf", () => {
  it("defaults to 10 when unset", () => {
    expect(relatedArtistsCountOf(site())).toBe(10);
  });

  it.each([5, 10, 15])("reads a count of %d", (relatedArtistsCount) => {
    expect(relatedArtistsCountOf(site({ relatedArtistsCount }))).toBe(
      relatedArtistsCount,
    );
  });

  it("accepts a count saved as a string", () => {
    expect(relatedArtistsCountOf(site({ relatedArtistsCount: "15" }))).toBe(15);
  });

  it.each([0, 4, 7.5, 50, "", "lots", null])(
    "falls back to 10 for %j, which is not on offer",
    (relatedArtistsCount) => {
      expect(relatedArtistsCountOf(site({ relatedArtistsCount }))).toBe(10);
    },
  );
});

describe("showsRelatedArtists", () => {
  it("is on unless switched off", () => {
    expect(showsRelatedArtists(site())).toBe(true);
    expect(showsRelatedArtists(site({ showRelatedArtists: false }))).toBe(
      false,
    );
  });
});
