/**
 * The logo's height, as a multiple of the base text size (`--sm`), from
 * `logoScale` in the template config: 1, 1.5, 2.25 or 4. SiteLogo reads it
 * as `--logo-scale`, so the logo follows the Base Font Size setting too.
 *
 * Accepted as a number or a numeric string. Anything else, or the default
 * 1.5, adds nothing: SiteLogo falls back to 1.5 itself.
 */
export const LOGO_SCALES = [1, 1.5, 2.25, 4] as const;

export const DEFAULT_LOGO_SCALE = 1.5;

const scaleOf = (value: unknown) => {
  const n = typeof value === "string" ? Number(value.trim()) : value;
  return LOGO_SCALES.find((scale) => scale === n);
};

/** The stylesheet for the configured logo scale, or null for the default. */
export const buildLogoScaleCss = (config: Record<string, unknown>) => {
  const scale = scaleOf(config.logoScale);
  if (scale === undefined || scale === DEFAULT_LOGO_SCALE) return null;
  return `:root { --logo-scale: ${scale}; }`;
};
