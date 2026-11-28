import type { Event, Product } from "@venuecms/sdk-next";
import { describe, expect, it } from "vitest";

import { type RelatedProfile, rankRelatedArtists } from "./related";

const profile = (slug: string) =>
  ({ slug, localizedContent: [] }) as unknown as RelatedProfile;

const credited = (slugs: string[]) =>
  slugs.map((slug) => ({ profile: profile(slug) }));

const NOW = new Date("2026-06-01T12:00:00Z");

/** Within the last three years of `NOW`, unless a start is given. */
const event = (id: string, artists: string[], start = "2025-01-01T19:00:00Z") =>
  ({
    id,
    slug: id,
    startDate: start,
    artists: credited(artists),
  }) as unknown as Event;

/** Three to five years before `NOW`: 2 points. */
const MID = "2022-01-01T19:00:00Z";

const product = (slug: string, artists: string[]) =>
  ({ slug, artists: credited(artists) }) as unknown as Product;

const slugs = (profiles: RelatedProfile[]) => profiles.map(({ slug }) => slug);

const rank = ({
  events = [],
  products = [],
  tagMatches = [],
  members = [],
  limit,
}: {
  events?: Event[];
  products?: Product[];
  tagMatches?: string[][];
  members?: string[];
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
      limit,
    }),
  );

describe("rankRelatedArtists", () => {
  it("ranks by points: two per event from 3–5 years ago or product, one per tag", () => {
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
      // b: two events (4). c: a product and two tags (4). a: one event (2).
      // d: one tag (1). b and c tie, and b was met first.
    ).toEqual(["b", "c", "a", "d"]);
  });

  it("weighs a 3–5-year-old event or a product as two shared tags", () => {
    const tags = (count: number) => Array.from({ length: count }, () => ["t"]);

    expect(
      rank({ events: [event("e1", ["me", "e"], MID)], tagMatches: tags(2) }),
    ).toEqual(["e", "t"]);
    expect(
      rank({ products: [product("p1", ["me", "p"])], tagMatches: tags(3) }),
    ).toEqual(["t", "p"]);
  });

  it("scores events by age: 3 within three years, 2 to five, 1 beyond", () => {
    expect(
      rank({
        events: [
          // Just inside three years, and upcoming: 3 each.
          event("e1", ["me", "recent"], "2023-06-02T00:00:00Z"),
          event("e2", ["me", "upcoming"], "2026-09-01T19:00:00Z"),
          // Two from three to five years ago: 4, ahead of one recent event.
          event("e3", ["me", "mid"], MID),
          event("e4", ["me", "mid"], "2023-05-31T00:00:00Z"),
          // Just inside five years: 2.
          event("e5", ["me", "five"], "2021-06-02T00:00:00Z"),
          // Just past five years, and long ago: 1 each.
          event("e6", ["me", "past"], "2021-05-31T00:00:00Z"),
          event("e7", ["me", "ancient"], "1999-01-01T19:00:00Z"),
        ],
      }),
    ).toEqual(["mid", "recent", "upcoming", "five", "past", "ancient"]);
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
      // star: two recent events (6). m1: a product and a tag, 3 × 1.5 (4.5).
      // m2: one recent event, 3 × 1.5 (4.5). pair: a mid event and a tag (3).
      // m1 and m2 tie; m2 was met first.
    ).toEqual(["star", "m2", "m1", "pair"]);
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
        events: [event("e1", ["me", "x"])],
        products: [product("p1", ["me", "y"])],
        tagMatches: [["z"]],
      }),
    ).toEqual(["x", "y", "z"]);
  });

  it("stops at the limit", () => {
    expect(
      rank({ events: [event("e1", ["me", "a", "b", "c"])], limit: 2 }),
    ).toEqual(["a", "b"]);
  });
});
