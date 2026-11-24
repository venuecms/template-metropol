/**
 * The site's type scale, from `typeScale` in the template config: the body
 * size, and how much bigger each font size is than the one below it.
 *
 * Each scale gives a base size (`sm`, the body text) and a ratio for both
 * ends of the viewport range, 360px to 1240px; each step above or below the
 * base multiplies or divides by the ratio. Every size grows fluidly between
 * its two ends — the same formula as the variables in globals.css. Only the
 * variables change, so every `text-*` class in the template follows.
 *
 * - `default`: 16px → 22px, ratio 1.414 (√2). Big headings. This is the
 *   scale in globals.css, so it adds nothing.
 * - `compact`: 15px → 18px, ratio 1.2 → 1.25. Slightly smaller body text,
 *   with headings that open up on wider screens.
 * - `minimal`: 16px → 22px, ratio 1.125. Headings barely grow; for
 *   text-heavy sites.
 *
 * Unset or unknown values add nothing either. The schema offers the names
 * capitalised (`Compact`), since the settings form shows enum values as they
 * are; any case is accepted.
 */
type Scale = {
  baseMinPx: number;
  baseMaxPx: number;
  ratioMin: number;
  ratioMax: number;
};

const SCALES: Record<string, Scale> = {
  compact: { baseMinPx: 15, baseMaxPx: 18, ratioMin: 1.2, ratioMax: 1.25 },
  minimal: { baseMinPx: 16, baseMaxPx: 22, ratioMin: 1.125, ratioMax: 1.125 },
};

/** Each step and its distance from `sm`, the base. */
const STEPS = [
  ["xxs", -2],
  ["xs", -1],
  ["sm", 0],
  ["md", 1],
  ["lg", 2],
  ["xl", 3],
  ["xxl", 4],
  ["xxxl", 5],
] as const;

const VIEWPORT_MIN_PX = 360;
const VIEWPORT_MAX_PX = 1240;
const REM_PX = 16;

const round = (n: number) => Number(n.toFixed(4));

/** A size that grows from `minPx` to `maxPx` across the viewport range. */
const fluidSize = (minPx: number, maxPx: number) => {
  const slope = (maxPx - minPx) / (VIEWPORT_MAX_PX - VIEWPORT_MIN_PX);
  const interceptPx = minPx - slope * VIEWPORT_MIN_PX;
  return `clamp(${round(minPx / REM_PX)}rem, ${round(interceptPx / REM_PX)}rem + ${round(slope * 100)}vw, ${round(maxPx / REM_PX)}rem)`;
};

/**
 * The stylesheet for the configured scale, or null for the default one.
 */
export const buildTypeScaleCss = (config: Record<string, unknown>) => {
  const scale =
    typeof config.typeScale === "string"
      ? SCALES[config.typeScale.toLowerCase()]
      : undefined;
  if (!scale) return null;

  const { baseMinPx, baseMaxPx, ratioMin, ratioMax } = scale;
  const declarations = STEPS.map(
    ([name, step]) =>
      `--${name}: ${fluidSize(baseMinPx * ratioMin ** step, baseMaxPx * ratioMax ** step)};`,
  );
  return `:root { ${declarations.join(" ")} }`;
};
