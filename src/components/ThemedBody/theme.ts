/**
 * The site's theme, from `themeId` in the template config, as the class its
 * variables hang off in globals.css (`html.<themeId>`).
 *
 * The settings form shows the schema's enum values as they are (it has no
 * support for enumNames), so the schema offers readable names and they are
 * mapped to the themes here. A theme id saved before the rename, such as
 * `hundredK`, is used as it is.
 */
const THEMES_BY_NAME: Record<string, string> = {
  Default: "default",
  Dark: "hundredK",
  Light: "blackOnWhite",
};

export const themeIdOf = (config: Record<string, unknown>) => {
  const value = config.themeId;
  if (typeof value !== "string" || !value) return "default";
  return THEMES_BY_NAME[value] ?? value;
};
