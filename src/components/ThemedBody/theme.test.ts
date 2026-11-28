import { describe, expect, it } from "vitest";

import { themeIdOf } from "./theme";

describe("themeIdOf", () => {
  it.each([
    ["Default", "default"],
    ["Dark", "hundredK"],
    ["Light", "blackOnWhite"],
  ])("maps %s to the %s theme", (themeId, theme) => {
    expect(themeIdOf({ themeId })).toBe(theme);
  });

  // Saved before the schema offered names.
  it.each(["default", "hundredK", "blackOnWhite", "space"])(
    "keeps the theme id %s",
    (themeId) => {
      expect(themeIdOf({ themeId })).toBe(themeId);
    },
  );

  it.each([[{}], [{ themeId: "" }], [{ themeId: 3 }]])(
    "falls back to the dark theme for %o",
    (config) => {
      expect(themeIdOf(config)).toBe("hundredK");
    },
  );
});
