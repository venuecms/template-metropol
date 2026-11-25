import type { Site } from "@venuecms/sdk-next";

/**
 * The groups in `public/_venue/config.schema.json`: settings nested under an
 * object property so the settings form shows them under a heading. The form
 * saves them nested too, as `config.options.showSearch` and so on.
 */
const GROUPS = ["options", "colors"] as const;

/**
 * Groups the schema no longer has. `typography` was flattened to the top
 * level, but a site that saved its settings while it existed still carries
 * `config.typography`, and the form leaves it there when it saves the new
 * top-level values.
 */
const RETIRED_GROUPS = ["typography"] as const;

type Config = Record<string, unknown>;

const groupOf = (config: Config, group: string): Config => {
  const values = config[group];
  return values && typeof values === "object" && !Array.isArray(values)
    ? (values as Config)
    : {};
};

/**
 * The site's template config with its groups flattened, so every setting
 * reads as `config.showSearch` wherever the schema puts it.
 *
 * A setting saved before it moved into a group stays at the top level until
 * the site saves its settings again; the grouped value wins when both are
 * there, and the old one is used until then.
 *
 * A setting saved before its group was retired works the other way round: the
 * old grouped value is used until the setting is saved at the top level, and
 * the top-level value wins from then on.
 */
export const templateConfigOf = (site: Site | null | undefined): Config => {
  const config = (site?.settings?.publicSite?.template?.config ?? {}) as Config;

  const retired = RETIRED_GROUPS.reduce<Config>(
    (flat, group) => ({ ...flat, ...groupOf(config, group) }),
    {},
  );

  return GROUPS.reduce<Config>(
    (flat, group) => ({ ...flat, ...groupOf(config, group) }),
    { ...retired, ...config },
  );
};
