import type { Site } from "@venuecms/sdk-next";
import { describe, expect, it } from "vitest";

import { templateConfigOf } from "./templateConfig";

const siteWith = (config: unknown) =>
  ({ settings: { publicSite: { template: { config } } } }) as unknown as Site;

describe("templateConfigOf", () => {
  it("is empty for a site with no config", () => {
    expect(templateConfigOf(null)).toEqual({});
    expect(templateConfigOf(siteWith(undefined))).toEqual({});
  });

  it("lifts grouped settings to the top level", () => {
    expect(
      templateConfigOf(
        siteWith({ themeId: "default", options: { showSearch: true } }),
      ),
    ).toMatchObject({ themeId: "default", showSearch: true });
  });

  it("lifts the typography group too", () => {
    expect(
      templateConfigOf(
        siteWith({ typography: { fontName: "Cardo", baseSize: "Large" } }),
      ),
    ).toMatchObject({ fontName: "Cardo", baseSize: "Large" });
  });

  it("lifts the colors group too", () => {
    expect(
      templateConfigOf(siteWith({ colors: { colorPrimary: "#ff0000" } })),
    ).toMatchObject({ colorPrimary: "#ff0000" });
  });

  // Saved before the setting moved into the group.
  it("keeps a setting still saved at the top level", () => {
    expect(templateConfigOf(siteWith({ showSearch: true }))).toMatchObject({
      showSearch: true,
    });
  });

  it("prefers the grouped value when both are saved", () => {
    expect(
      templateConfigOf(
        siteWith({ imageDuotone: true, options: { imageDuotone: false } }),
      ),
    ).toMatchObject({ imageDuotone: false });
  });

  it("ignores a group that isn't an object", () => {
    expect(
      templateConfigOf(siteWith({ showSearch: true, options: "x" })),
    ).toMatchObject({ showSearch: true });
  });
});
