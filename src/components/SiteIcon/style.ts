/**
 * The Site Icon Style setting (`iconStyle` in the template config): the
 * marker set before the details under an event's image. Arrow Bottom Right
 * unless the site picks another, as the schema's default does: a site that
 * never saved the setting has no value for it, and the default only reaches
 * the settings form. Anything this template does not know falls back too.
 */
export const ICON_STYLES = [
  "None",
  "Arrow Bottom Right",
  "Triangle Right",
  "Dot Filled",
  "Custom",
] as const;

export const DEFAULT_ICON_STYLE = "Arrow Bottom Right";

export type IconStyle = (typeof ICON_STYLES)[number];

export const iconStyleOf = (config: Record<string, unknown>): IconStyle =>
  ICON_STYLES.find((style) => style === config.iconStyle) ?? DEFAULT_ICON_STYLE;
