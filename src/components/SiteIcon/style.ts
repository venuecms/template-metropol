/**
 * The Site Icon Style setting (`iconStyle` in the template config): the
 * marker set before the details under an event's image. `None` unless the
 * site picks one, as the schema's default is, and for anything this template
 * does not know.
 */
export const ICON_STYLES = [
  "None",
  "Arrow Bottom Right",
  "Triangle Right",
  "Dot Filled",
  "Custom",
] as const;

export const DEFAULT_ICON_STYLE = "None";

export type IconStyle = (typeof ICON_STYLES)[number];

export const iconStyleOf = (config: Record<string, unknown>): IconStyle =>
  ICON_STYLES.find((style) => style === config.iconStyle) ?? DEFAULT_ICON_STYLE;
