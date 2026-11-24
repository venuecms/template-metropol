import {
  LocalizedContent,
  type SearchParams,
  VenueContent,
  getLocalizedContent,
} from "@venuecms/sdk-next";
import { getEvents, getSite } from "@venuecms/sdk-next";
import { ArrowRight } from "lucide-react";
import { connection } from "next/server";

import { Link } from "@/lib/i18n";

import { EventsGrid } from "@/components/EventList";
import { contentComponents, contentHandlers } from "@/components/ListingBlock";
import { TranslatedText } from "@/components/TranslatedText";
import { FullWidthLayout } from "@/components/layout";

import { featuredEventsQuery } from "./featured";

/** Events in the homepage grid: two full rows of three. */
const GRID_SIZE = 6;

export async function EventsContent({
  locale,
  searchParams,
}: {
  locale: string;
  /**
   * Taken as a promise and awaited here rather than in the route, because this
   * component already renders inside the home page's Suspense boundary. Awaiting
   * it up in `Home` would make the whole home page wait on the request; awaiting
   * it here costs nothing extra, since `connection()` above has already opted
   * this subtree out of the prerender.
   */
  searchParams: Promise<SearchParams>;
}) {
  await connection();

  const [
    { data: upcoming },
    { data: featured },
    { data: site },
    resolvedSearchParams,
  ] = await Promise.all([
    // Enough extra to still fill the grid once the featured are taken out.
    getEvents({ limit: GRID_SIZE + featuredEventsQuery.limit, upcoming: true }),
    getEvents(featuredEventsQuery),
    getSite(),
    searchParams,
  ]);

  if (!site) {
    return null;
  }

  // Featured events are already shown, full screen, above the grid.
  const featuredIds = new Set(featured?.records.map(({ id }) => id));
  const records = (upcoming?.records ?? [])
    .filter(({ id }) => !featuredIds.has(id))
    .slice(0, GRID_SIZE);

  const webSiteSettings = site.webSites ? site.webSites[0] : undefined;
  const { content: siteContent } = webSiteSettings?.localizedContent?.length
    ? getLocalizedContent(webSiteSettings.localizedContent, locale)
    : { content: { content: site.description } as LocalizedContent };

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

      {siteContent ? (
        <FullWidthLayout className="text-sm text-secondary">
          <VenueContent
            className="flex max-w-2xl flex-col gap-6"
            content={siteContent}
            contentStyles={contentComponents}
            components={contentHandlers}
            searchParams={resolvedSearchParams}
          />
        </FullWidthLayout>
      ) : null}
    </>
  );
}
