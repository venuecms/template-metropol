import { describe, expect, it } from "vitest";

import { buildTypeScaleCss } from "./typeScale";

describe("buildTypeScaleCss", () => {
  // globals.css already holds the default scale.
  it.each([[{}], [{ typeScale: "default" }], [{ typeScale: "huge" }]])(
    "adds nothing for %o",
    (config) => {
      expect(buildTypeScaleCss(config)).toBeNull();
    },
  );

  it("sets the compact scale: 15px → 18px, ratio 1.2 → 1.25", () => {
    expect(buildTypeScaleCss({ typeScale: "compact" })).toBe(
      ":root { " +
        [
          "--xxs: clamp(0.651rem, 0.6228rem + 0.1254vw, 0.72rem);",
          "--xs: clamp(0.7813rem, 0.7327rem + 0.2159vw, 0.9rem);",
          "--sm: clamp(0.9375rem, 0.8608rem + 0.3409vw, 1.125rem);",
          "--md: clamp(1.125rem, 1.0099rem + 0.5114vw, 1.4063rem);",
          "--lg: clamp(1.35rem, 1.1832rem + 0.7415vw, 1.7578rem);",
          "--xl: clamp(1.62rem, 1.3838rem + 1.0496vw, 2.1973rem);",
          "--xxl: clamp(1.944rem, 1.6157rem + 1.4592vw, 2.7466rem);",
          "--xxxl: clamp(2.3328rem, 1.8826rem + 2.0008vw, 3.4332rem);",
        ].join(" ") +
        " }",
    );
  });

  it("keeps the 16px–22px base for minimal", () => {
    expect(buildTypeScaleCss({ typeScale: "minimal" })).toContain(
      "--sm: clamp(1rem, 0.8466rem + 0.6818vw, 1.375rem);",
    );
  });

  it("sets the minimal scale at a ratio of 1.125", () => {
    // 16 / 1.125² ≈ 12.64px
    expect(buildTypeScaleCss({ typeScale: "minimal" })).toContain(
      "--xxs: clamp(0.7901rem,",
    );
  });
});
