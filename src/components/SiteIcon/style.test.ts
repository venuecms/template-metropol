import { describe, expect, it } from "vitest";

import { iconStyleOf } from "./style";

describe("iconStyleOf", () => {
  it.each([
    "Arrow Bottom Right",
    "Triangle Right",
    "Dot Filled",
    "Custom",
    "None",
  ])("reads %s", (style) => {
    expect(iconStyleOf({ iconStyle: style })).toBe(style);
  });

  it.each([[{}], [{ iconStyle: "Star" }], [{ iconStyle: 1 }]])(
    "falls back to None for %j",
    (config) => {
      expect(iconStyleOf(config)).toBe("None");
    },
  );
});
