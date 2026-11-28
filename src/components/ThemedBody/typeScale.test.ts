import { describe, expect, it } from "vitest";

import { buildTypeScaleCss } from "./typeScale";

/** The `--name` value out of the generated stylesheet. */
const sizeOf = (css: string | null, name: string) =>
  css?.match(new RegExp(`--${name}: ([^;]+);`))?.[1];

/** The narrow-viewport end of a size, in px. */
const minPxOf = (css: string | null, name: string) =>
  Number(sizeOf(css, name)?.match(/^clamp\(([\d.]+)rem/)?.[1]) * 16;

describe("buildTypeScaleCss", () => {
  // globals.css already holds Medium at Augmented Fourth.
  it("adds nothing for Medium at Augmented Fourth", () => {
    expect(
      buildTypeScaleCss({ typeScale: "Augmented Fourth", baseSize: "Medium" }),
    ).toBeNull();
  });

  // Unset or unknown settings take the schema defaults.
  it.each([[{}], [{ typeScale: "huge", baseSize: "enormous" }]])(
    "falls back to Small at Minor Third for %o",
    (config) => {
      expect(buildTypeScaleCss(config)).toBe(
        buildTypeScaleCss({ typeScale: "Minor Third", baseSize: "Small" }),
      );
    },
  );

  describe("base size", () => {
    it.each([
      ["Small", "clamp(0.875rem, 0.8239rem + 0.2273vw, 1rem)"],
      ["Medium", "clamp(1rem, 0.8466rem + 0.6818vw, 1.375rem)"],
      ["Large", "clamp(1.25rem, 1.1477rem + 0.4545vw, 1.5rem)"],
    ])("sets %s body text", (baseSize, size) => {
      // Major Third, so even Medium produces a stylesheet.
      expect(
        sizeOf(buildTypeScaleCss({ baseSize, typeScale: "Major Third" }), "sm"),
      ).toBe(size);
    });

    it("keeps the default scale's ratio when only the base changes", () => {
      const css = buildTypeScaleCss({ baseSize: "Large" });
      expect(minPxOf(css, "md") / minPxOf(css, "sm")).toBeCloseTo(1.2, 3);
    });
  });

  describe("scale", () => {
    it.each([
      ["Major Second", 1.125],
      ["Minor Third", 1.2],
      ["Major Third", 1.25],
      ["Perfect Fourth", 1.333],
    ])("steps %s at a ratio of %d", (typeScale, ratio) => {
      const css = buildTypeScaleCss({ typeScale });
      expect(minPxOf(css, "xxxl") / minPxOf(css, "sm")).toBeCloseTo(
        ratio ** 5,
        2,
      );
    });

    it("keeps the Small base when only the scale changes", () => {
      expect(
        sizeOf(buildTypeScaleCss({ typeScale: "Major Third" }), "sm"),
      ).toBe("clamp(0.875rem, 0.8239rem + 0.2273vw, 1rem)");
    });

    it("accepts any case", () => {
      expect(buildTypeScaleCss({ typeScale: "minor third" })).toBe(
        buildTypeScaleCss({ typeScale: "Minor Third" }),
      );
    });
  });

  // Saved before the base size was a setting of its own.
  describe("earlier scales", () => {
    it.each(["compact", "Compact"])(
      "keeps %s exactly as it was",
      (typeScale) => {
        expect(buildTypeScaleCss({ typeScale })).toBe(
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
      },
    );

    it("keeps minimal as Major Second on the Medium base", () => {
      expect(buildTypeScaleCss({ typeScale: "Minimal" })).toBe(
        buildTypeScaleCss({ typeScale: "Major Second", baseSize: "Medium" }),
      );
    });

    it.each(["default", "Default"])("adds nothing for %s", (typeScale) => {
      expect(buildTypeScaleCss({ typeScale })).toBeNull();
    });

    it("applies a base size set alongside an earlier scale", () => {
      expect(
        sizeOf(
          buildTypeScaleCss({ typeScale: "Compact", baseSize: "Large" }),
          "sm",
        ),
      ).toBe("clamp(1.25rem, 1.1477rem + 0.4545vw, 1.5rem)");
    });
  });
});
