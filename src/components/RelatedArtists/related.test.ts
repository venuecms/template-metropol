import type { Event, Product } from "@venuecms/sdk-next";
import { describe, expect, it } from "vitest";

import { type RelatedProfile, rankRelatedArtists } from "./related";

const profile = (slug: string) =>
  ({ slug, localizedContent: [] }) as unknown as RelatedProfile;

const credited = (slugs: string[]) =>
  slugs.map((slug) => ({ profile: profile(slug) }));

const NOW = new Date("2026-06-01T12:00:00Z");

/** Within the last six years of `NOW` (1.5 points), unless a start is given. */
const event = (id: string, artists: string[], start = "2025-01-01T19:00:00Z") =>
  ({
    id,
    slug: id,
    startDate: start,
    artists: credited(artists),
  }) as unknown as Event;

/** Four to five years before `NOW`: still recent, 1.5 points. */
const MID = "2022-01-01T19:00:00Z";

/** Over six years before `NOW`: 1 point. */
const OLD = "1999-01-01T19:00:00Z";

const product = (slug: string, artists: string[]) =>
  ({ slug, artists: credited(artists) }) as unknown as Product;

const slugs = (profiles: RelatedProfile[]) => profiles.map(({ slug }) => slug);

const rank = ({
  events = [],
  products = [],
  tagMatches = [],
  members = [],
  minScore = 0,
  limit,
}: {
  events?: Event[];
  products?: Product[];
  tagMatches?: string[][];
  members?: string[];
  // Off by default here, so the ranking tests can use small scores.
  minScore?: number;
  limit?: number;
}) =>
  slugs(
    rankRelatedArtists({
      slug: "me",
      events,
      products,
      tagMatches: tagMatches.map((list) => list.map(profile)),
      members: new Set(members),
      now: NOW,
      minScore,
      limit,
    }),
  );

describe("rankRelatedArtists", () => {
  it("ranks by points: 1.5 per recent event, two per product, one per tag", () => {
    expect(
      rank({
        events: [
          event("e1", ["me", "a", "b"], MID),
          event("e2", ["me", "b"], MID),
        ],
        products: [product("p1", ["me", "c"])],
        tagMatches: [
          ["me", "c", "d"],
          ["c", "me"],
        ],
      }),
      // c: a product and two tags (4). b: two events (3). a: one event (1.5).
      // d: one tag (1).
    ).toEqual(["c", "b", "a", "d"]);
  });

  it("weighs a recent event between one and two tags, a product as two", () => {
    const tags = (count: number) => Array.from({ length: count }, () => ["t"]);

    expect(
      rank({ events: [event("e1", ["me", "e"], MID)], tagMatches: tags(1) }),
    ).toEqual(["e", "t"]);
    expect(
      rank({ events: [event("e1", ["me", "e"], MID)], tagMatches: tags(2) }),
    ).toEqual(["t", "e"]);
    expect(
      rank({ products: [product("p1", ["me", "p"])], tagMatches: tags(3) }),
    ).toEqual(["t", "p"]);
  });

  it("scores events by age: 1.5 within six years, 1 beyond", () => {
    expect(
      rank({
        events: [
          // Three from over six years ago: 3, ahead of one recent event.
          event("e1", ["me", "old"], "2020-05-31T00:00:00Z"),
          event("e2", ["me", "old"], OLD),
          event("e2b", ["me", "old"], OLD),
          // Just inside six years, and upcoming: 1.5 each.
          event("e3", ["me", "six"], "2020-06-02T00:00:00Z"),
          event("e4", ["me", "upcoming"], "2026-09-01T19:00:00Z"),
          // Just past six years, and long ago: 1 each.
          event("e5", ["me", "past"], "2020-05-31T00:00:00Z"),
          event("e6", ["me", "ancient"], OLD),
        ],
      }),
    ).toEqual(["old", "six", "upcoming", "past", "ancient"]);
  });

  it("scores an event with no readable start as the oldest", () => {
    expect(
      rank({
        events: [event("e1", ["me", "a"], "")],
        products: [product("p1", ["me", "b"])],
      }),
      // a: an undated event (1). b: a product (2).
    ).toEqual(["b", "a"]);
  });

  it("multiplies a member's score by 1.5", () => {
    expect(
      rank({
        events: [
          event("e1", ["me", "star", "m2"]),
          event("e2", ["me", "star"]),
          event("e3", ["me", "pair"], MID),
        ],
        products: [product("p1", ["me", "m1"])],
        tagMatches: [["pair", "m1"]],
        members: ["m1", "m2", "unrelated"],
      }),
      // m1: a product and a tag, 3 × 1.5 (4.5). star: two recent events (3).
      // pair: a recent event and a tag (2.5). m2: one recent event,
      // 1.5 × 1.5 (2.25).
    ).toEqual(["m1", "star", "pair", "m2"]);
  });

  it("never relates the artist to themselves", () => {
    expect(rank({ events: [event("e1", ["me"])] })).toEqual([]);
  });

  it("counts a record or tag listing read twice only once", () => {
    expect(
      rank({
        events: [
          event("e1", ["me", "a"], MID),
          event("e1", ["me", "a"], MID),
          event("e2", ["me", "b", "b"], MID),
          event("e3", ["me", "b"], MID),
        ],
        products: [product("p1", ["me", "a"]), product("p1", ["me", "a"])],
        tagMatches: [["a", "a"]],
      }),
    ).toEqual(["a", "b"]);
  });

  it("breaks ties by the order artists were first met", () => {
    expect(
      rank({
        // One point each.
        events: [event("e1", ["me", "x"], OLD)],
        tagMatches: [["y"], ["z"]],
      }),
    ).toEqual(["x", "y", "z"]);
  });

  it("shows only artists scoring four or more by default", () => {
    expect(
      slugs(
        rankRelatedArtists({
          slug: "me",
          events: [
            event("e1", ["me", "strong", "short"]),
            event("e2", ["me", "strong", "short"]),
          ],
          // strong: two recent events and a product (5). short: two recent
          // events (3). member: a product and a tag, 3 × 1.5 (4.5). plain:
          // the same product and tag, unboosted (3).
          products: [product("p1", ["me", "strong", "member", "plain"])],
          tagMatches: [[profile("member"), profile("plain")]],
          members: new Set(["member"]),
          now: NOW,
        }),
      ),
    ).toEqual(["strong", "member"]);
  });

  it("stops at the limit", () => {
    expect(
      rank({ events: [event("e1", ["me", "a", "b", "c"])], limit: 2 }),
    ).toEqual(["a", "b"]);
  });
});
