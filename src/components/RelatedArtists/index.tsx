import {
  type Profile,
  type Site,
  getProfileEvents,
  getProfileProducts,
  getProfiles,
} from "@venuecms/sdk-next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { templateConfigOf } from "@/lib/utils/templateConfig";

import { ProfilesGrid } from "@/components/ProfilesGrid";
import { tagFiltersOf } from "@/components/RelatedEvents/related";

import { rankRelatedArtists } from "./related";

export { rankRelatedArtists } from "./related";

/**
 * The counts a site can pick for `relatedArtistsCount`, each a whole number of
 * rows of five, and the one it gets otherwise. Match the schema's enum and
 * default.
 */
const COUNTS = [5, 10, 15];
const DEFAULT_COUNT = 10;

/** Records read per source; the API's per-request maximum. */
const POOL = 100;

/**
 * Pages of member profiles read, `POOL` each, so a large membership stays
 * cheap; members past the last page are scored as everyone else is.
 */
const MAX_MEMBER_PAGES = 5;

/** The slugs of the site's member profiles, read a page at a time. */
const memberSlugs = async (): Promise<Set<string>> => {
  const first = await getProfiles({ type: "member", limit: POOL, page: 1 });
  const count = first.data?.count ?? 0;
  const pages = Math.min(Math.ceil(count / POOL), MAX_MEMBER_PAGES);

  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, index) =>
      getProfiles({ type: "member", limit: POOL, page: index + 2 }),
    ),
  );

  return new Set(
    [first, ...rest].flatMap(({ data }) =>
      (data?.records ?? []).map(({ slug }) => slug),
    ),
  );
};

/** Tags whose artists are read, one request each, so a heavily tagged artist stays cheap. */
const MAX_TAGS = 10;

/**
 * Whether the site has switched related artists on, from the template config
 * (`showRelatedArtists` in `public/_venue/config.schema.json`). On unless set
 * to `false`: a site whose config predates the setting, or has none saved,
 * gets the grid too, matching the schema's default.
 */
export const showsRelatedArtists = (site: Site) =>
  templateConfigOf(site).showRelatedArtists !== false;

/**
 * How many related artists the site shows, from `relatedArtistsCount` in the
 * template config. Anything but one of the offered counts — unset, or saved
 * before the setting became a choice — gets the default.
 */
export const relatedArtistsCountOf = (site: Site) => {
  const value = Number(templateConfigOf(site).relatedArtistsCount);

  return COUNTS.includes(value) ? value : DEFAULT_COUNT;
};

/**
 * Artists who share events, products or tags with `profile`, as a grid of
 * cards, most shared first, with members weighted up. Renders nothing when there are none.
 *
 * Candidates come from the artist's own events and products (everyone else
 * credited on them) and from one profiles read per tag. A read per tag rather
 * than one with every tag, so the result does not hang on whether the API's
 * filter treats several tags as any-of or all-of. Past and upcoming events
 * both count: a shared bill relates two artists whenever it happened, though
 * a recent one counts for more.
 *
 * Reads the clock to tell recent events from older ones, so it opts out of the
 * prerender and must sit inside a Suspense boundary of its own.
 */
export async function RelatedArtists({
  profile,
  site,
}: {
  profile: Profile;
  site: Site;
}) {
  await connection();

  const tags = tagFiltersOf(profile).slice(0, MAX_TAGS);

  const [members, events, products, ...tagResults] = await Promise.all([
    memberSlugs(),
    getProfileEvents({ slug: profile.slug, limit: POOL }),
    getProfileProducts({ slug: profile.slug, limit: POOL }),
    ...tags.map((tag) => getProfiles({ tags: tag, limit: POOL })),
  ]);

  const related = rankRelatedArtists({
    slug: profile.slug,
    events: events.data?.records ?? [],
    products: products.data?.records ?? [],
    tagMatches: tagResults.map(({ data }) => data?.records ?? []),
    members,
    limit: relatedArtistsCountOf(site),
  });

  if (!related.length) {
    return null;
  }

  const t = await getTranslations("profiles");

  return (
    <section className="flex flex-col gap-6 pb-6 lg:pb-24">
      <h2 className="text-sm text-primary">{t("related_artists")}</h2>
      <ProfilesGrid profiles={related} className="text-sm" />
    </section>
  );
}
