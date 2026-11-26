import {
  type Product,
  type Site,
  getEvents,
  getProducts,
  getProfileEvents,
  getProfileProducts,
} from "@venuecms/sdk-next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { EventsList, ListEvent } from "@/components/EventList";
import { ListProduct } from "@/components/ListProduct";

import {
  type RelatedRecord,
  artistSlugsOf,
  rankRelatedForProduct,
  relatedRowsOf,
  tagFiltersOf,
} from "./related";

/** Cards a row, as under an event; up to two rows when products abound. */
const PER_ROW = 4;

/** Records read per tag or artist; the API's per-request maximum. */
const POOL = 100;

/** Tags and artists read, one request each per kind, to keep the page cheap. */
const MAX_TAGS = 10;
const MAX_ARTISTS = 10;

/**
 * "You may also like" under a product: upcoming events and other products
 * sharing its tags or artists, in one grid, best match first. Fetched and
 * scored as `RelatedEvents` does for an event. Renders nothing when there are
 * none.
 *
 * Reads the clock, so it must sit inside a Suspense boundary of its own.
 */
export async function RelatedForProduct({
  product,
  site,
}: {
  product: Product;
  site: Site;
}) {
  await connection();

  const tags = tagFiltersOf(product).slice(0, MAX_TAGS);
  const artistSlugs = artistSlugsOf(product).slice(0, MAX_ARTISTS);

  if (!tags.length && !artistSlugs.length) {
    return null;
  }

  const [eventResults, productResults] = await Promise.all([
    Promise.all([
      ...tags.map((tag) =>
        getEvents({ upcoming: true, tags: tag, limit: POOL }),
      ),
      ...artistSlugs.map((slug) =>
        getProfileEvents({ slug, upcoming: true, limit: POOL }),
      ),
    ]),
    Promise.all([
      ...tags.map((tag) => getProducts({ tags: tag, limit: POOL })),
      ...artistSlugs.map((slug) => getProfileProducts({ slug, limit: POOL })),
    ]),
  ]);

  const related = rankRelatedForProduct({
    product,
    events: eventResults.flatMap(({ data }) => data?.records ?? []),
    products: productResults.flatMap(({ data }) => data?.records ?? []),
  });
  const rows = relatedRowsOf(related, PER_ROW);

  if (!rows.length) {
    return null;
  }

  const t = await getTranslations("events");

  return (
    <section className="flex flex-col gap-6 pb-6 lg:pb-24">
      <h2 className="text-sm text-primary">{t("related_events")}</h2>
      {/* The grid under an event: four across, events with
          4:3 images and products square, as they are in the shop. */}
      {rows.map((row, rowIndex) => (
        <EventsList key={rowIndex} className="gap-y-4 text-sm lg:grid-cols-4">
          {row.map((record, index) => (
            <div
              key={keyOf(record)}
              className="motion-safe:animate-slide-up"
              style={{
                animationDelay: `${(rowIndex * PER_ROW + index) * 80}ms`,
              }}
            >
              {record.kind === "event" ? (
                <ListEvent
                  event={record.event}
                  site={site}
                  withImage
                  imageClassName="sm:w-full"
                  imageAspect="classic"
                  imageCredit={false}
                  locationToEvent
                />
              ) : (
                <ListProduct
                  product={record.product}
                  site={site}
                  // The shop's cards space the title well off the image on a
                  // phone; here it sits as close as an event's does.
                  className="gap-0"
                />
              )}
            </div>
          ))}
        </EventsList>
      ))}
    </section>
  );
}

const keyOf = (record: RelatedRecord) =>
  record.kind === "event"
    ? `event-${record.event.id}`
    : `product-${record.product.slug}`;
