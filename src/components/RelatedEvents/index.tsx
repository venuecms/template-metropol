import {
  type Event,
  type Site,
  getEvents,
  getProfileEvents,
} from "@venuecms/sdk-next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { templateConfigOf } from "@/lib/utils/templateConfig";

import { EventsGrid } from "@/components/EventList";

import { artistSlugsOf, rankRelatedEvents, tagFiltersOf } from "./related";

export { rankRelatedEvents } from "./related";

/** How many related events the grid shows: one full row of four. */
const LIMIT = 4;

/** Upcoming events read per tag or artist; the API's per-request maximum. */
const POOL = 100;

/**
 * Tags and artists whose upcoming events are read, one request each, so a
 * heavily tagged event or a busy line-up stays cheap.
 */
const MAX_TAGS = 10;
const MAX_ARTISTS = 10;

/**
 * Whether the site has switched related events on, from the template config
 * (`showRelatedEvents` in `public/_venue/config.schema.json`). On unless set to
 * `false`: a site whose config predates the setting, or has none saved, gets
 * the grid too, matching the schema's default.
 */
export const showsRelatedEvents = (site: Site) =>
  templateConfigOf(site).showRelatedEvents !== false;

/**
 * Upcoming events sharing tags or artists with `event`, as the homepage grid,
 * best match first and then by date. Renders nothing when there are none.
 *
 * Candidates come from one read per tag (the events API filtered to that tag)
 * and one per artist (that artist's upcoming events). A read per tag rather
 * than one with every tag, so the result does not hang on whether the API's
 * filter treats several tags as any-of or all-of. The candidates are then
 * scored together here, counting tags and artists shared.
 *
 * Reads the clock, so it opts out of the prerender and must sit inside a
 * Suspense boundary of its own — the rest of the event page does not wait.
 */
export async function RelatedEvents({
  event,
  site,
}: {
  event: Event;
  site: Site;
}) {
  await connection();

  const tags = tagFiltersOf(event).slice(0, MAX_TAGS);
  const artistSlugs = artistSlugsOf(event).slice(0, MAX_ARTISTS);

  if (!tags.length && !artistSlugs.length) {
    return null;
  }

  const results = await Promise.all([
    ...tags.map((tag) => getEvents({ upcoming: true, tags: tag, limit: POOL })),
    ...artistSlugs.map((slug) =>
      getProfileEvents({ slug, upcoming: true, limit: POOL }),
    ),
  ]);

  const related = rankRelatedEvents({
    event,
    candidates: results.flatMap(({ data }) => data?.records ?? []),
    limit: LIMIT,
  });

  if (!related.length) {
    return null;
  }

  const t = await getTranslations("events");

  return (
    <section className="flex flex-col gap-6 pb-6 lg:pb-24">
      <h2 className="text-md text-primary">{t("related_events")}</h2>
      {/* A lighter take on the homepage grid: a step smaller, four across,
          with squarer 4:3 images. */}
      <EventsGrid
        events={related}
        site={site}
        className="text-xs lg:grid-cols-4"
        imageAspect="classic"
      />
    </section>
  );
}
