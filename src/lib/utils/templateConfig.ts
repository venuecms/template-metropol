import type { Site } from "@venuecms/sdk-next";

/**
 * The groups in `public/_venue/config.schema.json`: settings nested under an
 * object property so the settings form shows them under a heading. The form
 * saves them nested too, as `config.options.showSearch` and so on.
 */
const GROUPS = ["typography", "options", "colors"] as const;

/**
 * The site's template config with its groups flattened, so every setting
 * reads as `config.showSearch` wherever the schema puts it.
 *
 * A setting saved before it moved into a group stays at the top level until
 * the site saves its settings again; the grouped value wins when both are
 * there, and the old one is used until then.
 */
export const templateConfigOf = (
  site: Site | null | undefined,
): Record<string, unknown> => {
  const config = (site?.settings?.publicSite?.template?.config ?? {}) as Record<
    string,
    unknown
  >;

  return GROUPS.reduce<Record<string, unknown>>((flat, group) => {
    const values = config[group];
    return values && typeof values === "object" && !Array.isArray(values)
      ? { ...flat, ...(values as Record<string, unknown>) }
      : flat;
  }, config);
};
