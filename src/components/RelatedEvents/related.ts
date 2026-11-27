import type { Event, Product } from "@venuecms/sdk-next";

/**
 * A tag's identity, whichever shape it arrives in. The SDK types an event's
 * tags as `{ tagId, tag: { id, title } }`, but the API has been seen sending
 * them flat — `{ id, title }` — on pages (see the Footer), so both are read.
 * The id is preferred; the title is the fallback key.
 */
const tagKey = (tag: unknown): string | undefined => {
  const {
    tagId,
    id,
    title,
    tag: nested,
  } = (tag ?? {}) as {
    tagId?: unknown;
    id?: unknown;
    title?: unknown;
    tag?: { id?: unknown; title?: unknown };
  };
  const value = tagId ?? nested?.id ?? id ?? nested?.title ?? title;

  return typeof value === "string" && value ? value : undefined;
};

/** What relating needs of a record: an event and a product both carry it. */
type Relatable = {
  tags?: unknown[] | null;
  artists?: { profile?: { slug?: string | null } | null }[] | null;
};

const tagKeys = (record: Relatable) =>
  new Set((record.tags ?? []).map(tagKey).filter((key) => key !== undefined));

const artistKeys = (record: Relatable) =>
  new Set(
    (record.artists ?? [])
      .map(({ profile }) => profile?.slug)
      .filter((slug): slug is string => !!slug),
  );

/**
 * The tags on an event or product as the API's `tags` filter takes them — it
 * accepts an id or a title, so whichever `tagKey` found will do.
 */
export const tagFiltersOf = (record: Relatable) => [...tagKeys(record)];

/** The artist slugs on an event or product, for fetching their other work. */
export const artistSlugsOf = (record: Relatable) => [...artistKeys(record)];

/** Tags and artists `candidate` shares with the record it is scored against. */
const sharedCount = (
  tags: Set<string>,
  artists: Set<string>,
  candidate: Relatable,
) => {
  let score = 0;
  for (const key of tagKeys(candidate)) if (tags.has(key)) score++;
  for (const key of artistKeys(candidate)) if (artists.has(key)) score++;
  return score;
};

/**
 * The events related to `event`, best match first.
 *
 * A candidate is related when it starts after `now` and shares at least one
 * tag or artist with `event`. Its score is the number it shares — tags and
 * artists counted alike — and ties go to the sooner event. The event itself,
 * and any candidate listed twice (it can come back from more than one fetch),
 * appear at most once and never as their own relation.
 */
export const rankRelatedEvents = ({
  event,
  candidates,
  now = new Date(),
  limit,
}: {
  event: Event;
  candidates: Event[];
  now?: Date;
  limit?: number;
}): Event[] => {
  const tags = tagKeys(event);
  const artists = artistKeys(event);
  const seen = new Set<string>([event.id]);

  const scored: { event: Event; score: number; start: number }[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);

    const start = Date.parse(candidate.startDate);
    if (!(start > now.getTime())) continue;

    const score = sharedCount(tags, artists, candidate);

    if (score > 0) scored.push({ event: candidate, score, start });
  }

  scored.sort((a, b) => b.score - a.score || a.start - b.start);

  return scored.slice(0, limit).map(({ event }) => event);
};

/** One card in a mixed related grid: an upcoming event or a product. */
export type RelatedRecord =
  | { kind: "event"; event: Event }
  | { kind: "product"; product: Product };

/**
 * The events and products related to `product`, best match first, scored as
 * `rankRelatedEvents` scores events: one point per tag or artist shared.
 *
 * Events count only while upcoming; products have no date, so any will do.
 * On a tie an event comes ahead of a product, and events go soonest first;
 * products keep the order they were fetched in. The product itself, and any
 * record fetched twice, appear at most once.
 */
export const rankRelatedForProduct = ({
  product,
  events,
  products,
  now = new Date(),
  limit,
}: {
  product: Product;
  events: Event[];
  products: Product[];
  now?: Date;
  limit?: number;
}): RelatedRecord[] => {
  const tags = tagKeys(product);
  const artists = artistKeys(product);

  const scored: {
    record: RelatedRecord;
    score: number;
    start: number;
    order: number;
  }[] = [];

  const seenEvents = new Set<string>();
  for (const event of events) {
    if (seenEvents.has(event.id)) continue;
    seenEvents.add(event.id);

    const start = Date.parse(event.startDate);
    if (!(start > now.getTime())) continue;

    const score = sharedCount(tags, artists, event);
    if (score > 0) {
      scored.push({ record: { kind: "event", event }, score, start, order: 0 });
    }
  }

  // Products carry no id; the slug is their identity.
  const seenProducts = new Set<string>([product.slug]);
  products.forEach((candidate, order) => {
    if (seenProducts.has(candidate.slug)) return;
    seenProducts.add(candidate.slug);

    const score = sharedCount(tags, artists, candidate);
    if (score > 0) {
      scored.push({
        record: { kind: "product", product: candidate },
        score,
        start: Infinity,
        order,
      });
    }
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      // Infinity - Infinity is NaN, so two products fall through to order.
      a.start - b.start ||
      0 ||
      a.order - b.order,
  );

  return scored.slice(0, limit).map(({ record }) => record);
};

/**
 * The related records as rows of up to `perRow`. Normally one mixed row, best
 * match first. When more than a row's worth of products match, products get a
 * row of their own and events the row below, so neither crowds out the other.
 * A row with nothing in it is left out.
 */
export const relatedRowsOf = (
  related: RelatedRecord[],
  perRow: number,
): RelatedRecord[][] => {
  const products = related.filter((record) => record.kind === "product");

  if (products.length <= perRow) {
    return [related.slice(0, perRow)].filter((row) => row.length);
  }

  const events = related.filter((record) => record.kind === "event");

  return [products.slice(0, perRow), events.slice(0, perRow)].filter(
    (row) => row.length,
  );
};

/**
 * The related grids' date: weekday and month abbreviated (`Wed 18 Nov 2026`),
 * to fit four across.
 */
export const RELATED_DATE_TEMPLATE = "EEE d MMM yyyy";
