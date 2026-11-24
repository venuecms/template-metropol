import { describe, expect, it } from "vitest";

import { buildLogoScaleCss } from "./logoScale";

describe("buildLogoScaleCss", () => {
  it.each([
    [{}],
    [{ logoScale: 1.5 }],
    [{ logoScale: "1.5" }],
    [{ logoScale: 3 }],
    [{ logoScale: "huge" }],
  ])("adds nothing for %o", (config) => {
    expect(buildLogoScaleCss(config)).toBeNull();
  });

  it.each([
    [1, "1"],
    [2.25, "2.25"],
    [4, "4"],
    ["2.25", "2.25"],
  ])("sets %o", (logoScale, css) => {
    expect(buildLogoScaleCss({ logoScale })).toBe(
      `:root { --logo-scale: ${css}; }`,
    );
  });
});
