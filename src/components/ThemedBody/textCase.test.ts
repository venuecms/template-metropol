import { describe, expect, it } from "vitest";

import { buildTextCaseCss } from "./textCase";

const HEADINGS = "h1, h2, h3, h4, h5, h6";

describe("buildTextCaseCss", () => {
  // A site that never saved the settings keeps the template's look.
  it("puts paragraphs in capitals when nothing is set", () => {
    expect(buildTextCaseCss({})).toBe("p { text-transform: uppercase; }");
  });

  it.each([
    ["uppercase", "paragraphs", "p { text-transform: uppercase; }"],
    ["lowercase", "paragraphs", "p { text-transform: lowercase; }"],
    ["uppercase", "all", "body { text-transform: uppercase; }"],
    ["lowercase", "all", "body { text-transform: lowercase; }"],
    // Spelled out even though it changes nothing by default, so text that a
    // theme or browser default would otherwise recase stays as typed.
    ["none", "all", "body { text-transform: none; }"],
  ])("sets %s on %s", (textCase, textCaseScope, css) => {
    expect(buildTextCaseCss({ textCase, textCaseScope })).toBe(css);
  });

  it("adds nothing for text as typed on paragraphs", () => {
    expect(
      buildTextCaseCss({ textCase: "none", textCaseScope: "paragraphs" }),
    ).toBeNull();
  });

  it("falls back to the defaults for values it doesn't know", () => {
    expect(buildTextCaseCss({ textCase: "title", textCaseScope: "some" })).toBe(
      "p { text-transform: uppercase; }",
    );
  });

  // The settings form shows enum values as they are, so the schema offers
  // these readable names.
  it.each([
    ["As typed", "All", "body { text-transform: none; }"],
    ["UPPERCASE", "Paragraphs", "p { text-transform: uppercase; }"],
    ["lowercase", "All", "body { text-transform: lowercase; }"],
  ])("reads %s on %s as the schema offers them", (textCase, scope, css) => {
    expect(buildTextCaseCss({ textCase, textCaseScope: scope })).toBe(css);
  });

  it("reads the heading case as the schema offers it", () => {
    expect(
      buildTextCaseCss({ textCase: "As typed", headingCase: "UPPERCASE" }),
    ).toBe("h1, h2, h3, h4, h5, h6 { text-transform: uppercase; }");
  });

  describe("headings", () => {
    it("sets the heading case alongside the text case", () => {
      expect(
        buildTextCaseCss({ textCase: "none", headingCase: "uppercase" }),
      ).toBe(`${HEADINGS} { text-transform: uppercase; }`);
    });

    // How a site keeps its headings as typed with everything else in capitals.
    it("holds headings as typed under an all-capitals text case", () => {
      expect(
        buildTextCaseCss({
          textCase: "uppercase",
          textCaseScope: "all",
          headingCase: "none",
        }),
      ).toBe(
        `body { text-transform: uppercase; }\n${HEADINGS} { text-transform: none; }`,
      );
    });

    it("leaves headings to inherit when never set", () => {
      expect(buildTextCaseCss({ textCaseScope: "all" })).not.toContain("h1");
    });
  });
});
