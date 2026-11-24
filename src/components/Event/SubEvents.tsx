import { type Event, type Site, getEvent } from "@venuecms/sdk-next";

import { EventsGrid } from "@/components/EventList";

/**
 * A parent event's sub-events, as the homepage grid, in date order. Renders
 * nothing when the event has none.
 *
 * The event carries its children only as references (slug, dates, image), not
 * the artists, location and time the grid draws, so each is read in full by
 * its slug. One that fails to load is left out rather than failing the page.
 */
export async function SubEvents({ event, site }: { event: Event; site: Site }) {
  const children = event.relations?.children ?? [];

  if (!children.length) {
    return null;
  }

  const results = await Promise.all(
    children.map(({ slug }) => getEvent({ slug })),
  );

  const events = results
    .flatMap(({ data }) => (data ? [data] : []))
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));

  if (!events.length) {
    return null;
  }

  return (
    <section>
      <EventsGrid events={events} site={site} />
    </section>
  );
}
