import type { Event as VenueEvent } from "@venuecms/sdk-next";

import { sameDayLabel } from "@/components/utils/date";

/**
 * The homepage's featured events query, shared by the featured section and the
 * grid below it. Both ask with exactly these arguments, so the SDK's cache
 * serves the grid the same records rather than fetching them again, and the
 * grid leaves out precisely what is featured above it.
 */
export const featuredEventsQuery = { limit: 6, featured: true } as const;

/** Events in the homepage grid: two full rows of three. */
export const GRID_SIZE = 6;

/**
 * The homepage's upcoming events query, shared the same way: the grid lists
 * them, and the featured section promotes those starting today. Asks for
 * enough extra to still fill the grid once the featured are taken out.
 */
export const upcomingEventsQuery = {
  limit: GRID_SIZE + featuredEventsQuery.limit,
  upcoming: true,
} as const;

/**
 * The events shown full screen at the top of the homepage: any starting today
 * in the venue's zone come first, in the order they start, promoted out of the
 * upcoming list; then the events marked featured. An event that is both is
 * shown once, with today's. Cancelled events aren't promoted, though one
 * marked featured still shows as it did.
 */
export const homepageFeaturedEvents = ({
  featured,
  upcoming,
  now,
  timeZone,
}: {
  featured: VenueEvent[];
  upcoming: VenueEvent[];
  now: Date;
  timeZone?: string;
}): VenueEvent[] => {
  const today = upcoming.filter(
    (event) =>
      event.publishState !== "CANCELLED" &&
      sameDayLabel({
        start: event.startDate,
        hasTime: event.hasTime,
        now,
        timeZone,
      }) !== null,
  );
  const todayIds = new Set(today.map(({ id }) => id));

  return [...today, ...featured.filter(({ id }) => !todayIds.has(id))];
};
