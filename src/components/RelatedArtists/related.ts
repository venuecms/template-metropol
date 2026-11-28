import type { Event, Product, Profile } from "@venuecms/sdk-next";

/**
 * What a related artist needs to be drawn: a full profile from a tag read and
 * the slim one an event or product carries for its artists will both do.
 */
export type RelatedProfile = Pick<
  Profile,
  "slug" | "image" | "localizedContent"
>;

type Credited = {
  artists?: { profile?: RelatedProfile | null }[] | null;
};

/** What a member's score is multiplied by; see `rankRelatedArtists`. */
const MEMBER_BOOST = 1.5;

/** The least score, member boost included, an artist needs to be shown. */
const MIN_SCORE = 4;

/** Points per shared product or tag; see `rankRelatedArtists`. */
const POINTS = { product: 3, tag: 1 } as const;

/**
 * Points for a shared event by how long ago it started, newest band first:
 * within `years` of now (upcoming ones included) it scores `points`. An event
 * past every band, or with no readable start date, scores `OLD_EVENT_POINTS`.
 */
const EVENT_BANDS = [{ years: 6, points: 1.5 }] as const;
const OLD_EVENT_POINTS = 1;

const yearsBefore = (now: Date, years: number) => {
  const date = new Date(now);
  date.setFullYear(date.getFullYear() - years);
  return date.getTime();
};

/**
 * The artists related to the one with `slug`, best match first.
 *
 * An artist scores, for each event they share with it, one and a half points
 * if it was in the last six years (upcoming ones included) and one if older
 * or undated; plus three for each shared product and one for each tag. Working
 * together says more than being filed under the same tag, and working
 * together lately says a little more again. `tagMatches` holds one list per
 * tag: the profiles carrying that tag.
 *
 * A member's score (slugs in `members`) is multiplied by `MEMBER_BOOST`, so a
 * member edges ahead of an equal match without leapfrogging a far stronger
 * one. Membership only weighs: an artist still has to share something to be
 * related at all.
 *
 * An artist scoring under `minScore` (`MIN_SCORE` unless given), after the
 * member boost, is left out, so a single shared tag, product or bill is not
 * enough on its own.
 *
 * A record or profile listed twice (it can come back from more than one read)
 * counts once, and the artist is never related to themselves. Ties keep the
 * order the artists were first met in: events, then products, then tags.
 */
export const rankRelatedArtists = ({
  slug,
  events,
  products,
  tagMatches,
  members = new Set(),
  now = new Date(),
  minScore = MIN_SCORE,
  limit,
}: {
  slug: string;
  events: Event[];
  products: Product[];
  tagMatches: RelatedProfile[][];
  /** Slugs of the site's member profiles. */
  members?: ReadonlySet<string>;
  now?: Date;
  minScore?: number;
  limit?: number;
}): RelatedProfile[] => {
  const scores = new Map<
    string,
    { profile: RelatedProfile; score: number; order: number }
  >();

  const credit = (
    profile: RelatedProfile | null | undefined,
    points: number,
  ) => {
    if (!profile?.slug || profile.slug === slug) return;

    const entry = scores.get(profile.slug);
    if (entry) {
      entry.score += points;
    } else {
      scores.set(profile.slug, { profile, score: points, order: scores.size });
    }
  };

  // Each artist once per record, however many times the record lists them.
  const creditRecord = (record: Credited, points: number) => {
    const slugs = new Set<string>();
    for (const { profile } of record.artists ?? []) {
      if (profile?.slug && !slugs.has(profile.slug)) {
        slugs.add(profile.slug);
        credit(profile, points);
      }
    }
  };

  const bands = EVENT_BANDS.map(({ years, points }) => ({
    since: yearsBefore(now, years),
    points,
  }));
  const eventPoints = (event: Event) => {
    const start = Date.parse(event.startDate);
    return (
      bands.find(({ since }) => start >= since)?.points ?? OLD_EVENT_POINTS
    );
  };

  const seenEvents = new Set<string>();
  for (const event of events) {
    if (seenEvents.has(event.id)) continue;
    seenEvents.add(event.id);
    creditRecord(event, eventPoints(event));
  }

  // Products carry no id; the slug is their identity.
  const seenProducts = new Set<string>();
  for (const product of products) {
    if (seenProducts.has(product.slug)) continue;
    seenProducts.add(product.slug);
    creditRecord(product, POINTS.product);
  }

  for (const profiles of tagMatches) {
    creditRecord(
      { artists: profiles.map((profile) => ({ profile })) },
      POINTS.tag,
    );
  }

  return [...scores.values()]
    .map((entry) => ({
      ...entry,
      score: members.has(entry.profile.slug)
        ? entry.score * MEMBER_BOOST
        : entry.score,
    }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map(({ profile }) => profile);
};
