/**
 * The site's type sizes, from two settings in the template config:
 *
 * - `baseSize`: the body text (`sm`). Small, Medium or Large.
 * - `typeScale`: how much bigger each size is than the one below it, as a
 *   musical interval — Major Second (1.125) up to Augmented Fourth (1.414).
 *
 * Each step above or below the base multiplies or divides by the ratio, and
 * every size grows fluidly as the viewport widens from 360px to 1240px — the
 * same formula as the variables in globals.css. Only the variables change, so
 * every `text-*` class in the template follows.
 *
 * Medium with Augmented Fourth is the scale in globals.css, so it adds
 * nothing; so does a site that never saved either setting.
 *
 * The settings form shows enum values as they are (it has no support for
 * enumNames), so the schema offers the names themselves; any case is
 * accepted.
 */
type Range = [min: number, max: number];

/** Body text size at the narrow and wide ends of the viewport range, in px. */
const BASE_SIZES: Record<string, Range> = {
  small: [14, 16],
  medium: [16, 22],
  large: [20, 24],
};

const RATIOS: Record<string, number> = {
  "major second": 1.125,
  "minor third": 1.2,
  "major third": 1.25,
  "perfect fourth": 1.333,
  "augmented fourth": 1.414,
};

const DEFAULT_BASE = "medium";
const DEFAULT_RATIO = "augmented fourth";

/**
 * Scales offered before the base size was a setting of its own, each with
 * the base it came with. A site that saved one keeps exactly its look; a base
 * size set alongside it still applies.
 *
 * Each base is given in px rather than by name, so a later change to the
 * named sizes leaves these alone.
 */
const LEGACY_SCALES: Record<string, { ratio: Range; base: Range }> = {
  default: { ratio: [1.414, 1.414], base: [16, 22] },
  // The ratio opens up from 1.2 to 1.25 as the viewport widens. Its base is
  // the Small of the time, before Small became 14px → 16px.
  compact: { ratio: [1.2, 1.25], base: [15, 18] },
  minimal: { ratio: [1.125, 1.125], base: [16, 22] },
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

const keyOf = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

/**
 * The stylesheet for the configured base size and scale, or null when they
 * are the template's own.
 */
export const buildTypeScaleCss = (config: Record<string, unknown>) => {
  const scaleKey = keyOf(config.typeScale);
  const legacy = LEGACY_SCALES[scaleKey];

  const ratioKey = scaleKey in RATIOS ? scaleKey : undefined;
  const [ratioMin, ratioMax]: Range = ratioKey
    ? [RATIOS[ratioKey], RATIOS[ratioKey]]
    : (legacy?.ratio ?? [RATIOS[DEFAULT_RATIO], RATIOS[DEFAULT_RATIO]]);

  const baseKey = keyOf(config.baseSize);
  const [baseMinPx, baseMaxPx]: Range =
    baseKey in BASE_SIZES
      ? BASE_SIZES[baseKey]
      : (legacy?.base ?? BASE_SIZES[DEFAULT_BASE]);

  const isTemplateDefault =
    baseMinPx === BASE_SIZES[DEFAULT_BASE][0] &&
    baseMaxPx === BASE_SIZES[DEFAULT_BASE][1] &&
    ratioMin === RATIOS[DEFAULT_RATIO] &&
    ratioMax === RATIOS[DEFAULT_RATIO];
  if (isTemplateDefault) return null;

  const declarations = STEPS.map(
    ([name, step]) =>
      `--${name}: ${fluidSize(baseMinPx * ratioMin ** step, baseMaxPx * ratioMax ** step)};`,
  );
  return `:root { ${declarations.join(" ")} }`;
};
