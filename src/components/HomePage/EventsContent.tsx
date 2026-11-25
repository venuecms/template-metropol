import { getEvents, getSite } from "@venuecms/sdk-next";
import { ArrowRight } from "lucide-react";
import { connection } from "next/server";

import { Link } from "@/lib/i18n";

import { EventsGrid } from "@/components/EventList";
import { TranslatedText } from "@/components/TranslatedText";
import { FullWidthLayout } from "@/components/layout";

import {
  GRID_SIZE,
  featuredEventsQuery,
  homepageFeaturedEvents,
  upcomingEventsQuery,
} from "./featured";

export async function EventsContent() {
  await connection();

  const [{ data: upcoming }, { data: featured }, { data: site }] =
    await Promise.all([
      getEvents(upcomingEventsQuery),
      getEvents(featuredEventsQuery),
      getSite(),
    ]);

  if (!site) {
    return null;
  }

  // Featured events, and any starting today, are already shown full screen
  // above the grid. Picked by the same rule as the section above, so the two
  // agree on which events are promoted.
  const featuredIds = new Set(
    homepageFeaturedEvents({
      featured: featured?.records ?? [],
      upcoming: upcoming?.records ?? [],
      now: new Date(),
      timeZone: site.timeZone ?? undefined,
    }).map(({ id }) => id),
  );
  const records = (upcoming?.records ?? [])
    .filter(({ id }) => !featuredIds.has(id))
    .slice(0, GRID_SIZE);

  return (
    <>
      {records.length ? (
        <FullWidthLayout>
          <section className="flex flex-col gap-3">
            <EventsGrid events={records} site={site} />
            {records.length >= GRID_SIZE ? (
              <Link
                className="flex w-full items-center gap-2 hover:brightness-125"
                href="/events"
              >
                <ArrowRight className="h-4" />{" "}
                <TranslatedText
                  namespace="events"
                  text="see_all_upcoming_events"
                />
              </Link>
            ) : null}
          </section>
        </FullWidthLayout>
      ) : null}
    </>
  );
}
