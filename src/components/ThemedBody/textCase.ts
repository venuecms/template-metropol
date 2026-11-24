/**
 * The site's text case, from the template config:
 *
 * - `textCase` with `textCaseScope`: body text, on paragraphs or on everything.
 * - `headingCase`: h1–h6, on their own and ahead of `textCase` — so a site can
 *   set everything in capitals and still keep its headings as typed.
 *
 * The schema offers `As typed` / `lowercase` / `UPPERCASE` and `Paragraphs` /
 * `All`, since the settings form shows enum values as they are (it has no
 * support for enumNames). The CSS values `none` / `lowercase` / `uppercase`
 * and `paragraphs` / `all` are accepted too, as sites saved them before.
 *
 * Unset means the template's own look: paragraphs in capitals, headings left
 * to inherit. A site that never saved these settings looks as it always has.
 */
const TRANSFORMS: Record<string, string> = {
  none: "none",
  lowercase: "lowercase",
  uppercase: "uppercase",
  "As typed": "none",
  UPPERCASE: "uppercase",
};

const SCOPES: Record<string, "paragraphs" | "all"> = {
  paragraphs: "paragraphs",
  all: "all",
  Paragraphs: "paragraphs",
  All: "all",
};

const transformOf = (value: unknown) =>
  typeof value === "string" ? TRANSFORMS[value] : undefined;

/**
 * The stylesheet for the configured case, or null when there is nothing to
 * change.
 *
 * "All" sets the case on <body>, which everything inherits — the mobile nav
 * dialog included, since it portals there. A class like `normal-case` on an
 * element still wins over any of these rules, by specificity.
 */
export const buildTextCaseCss = (config: Record<string, unknown>) => {
  const transform = transformOf(config.textCase) ?? "uppercase";
  const scope =
    (typeof config.textCaseScope === "string" &&
      SCOPES[config.textCaseScope]) ||
    "paragraphs";
  const headingTransform = transformOf(config.headingCase);

  const rules = [
    // Text as typed on paragraphs is what the page does anyway.
    transform === "none" && scope === "paragraphs"
      ? null
      : `${scope === "all" ? "body" : "p"} { text-transform: ${transform}; }`,
    // Set even to `none`: that is how headings stay as typed under "All".
    headingTransform
      ? `h1, h2, h3, h4, h5, h6 { text-transform: ${headingTransform}; }`
      : null,
  ].filter(Boolean);

  return rules.length ? rules.join("\n") : null;
};
