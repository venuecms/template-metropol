import type { Event, Product } from "@venuecms/sdk-next";
import { describe, expect, it } from "vitest";

import {
  type RelatedRecord,
  rankRelatedEvents,
  rankRelatedForProduct,
  relatedRowsOf,
} from "./related";

const NOW = new Date("2026-06-01T12:00:00Z");

const event = ({
  id,
  start = "2026-07-01T19:00:00Z",
  tags = [],
  artists = [],
}: {
  id: string;
  start?: string;
  tags?: unknown[];
  artists?: string[];
}) =>
  ({
    id,
    slug: id,
    startDate: start,
    endDate: start,
    tags,
    artists: artists.map((slug) => ({ profile: { slug } })),
  }) as unknown as Event;

const tag = (id: string) => ({ tagId: id, tag: { id, title: id } });

const ids = (events: Event[]) => events.map(({ id }) => id);

describe("rankRelatedEvents", () => {
  const current = event({
    id: "current",
    tags: [tag("jazz"), tag("live")],
    artists: ["ana", "ben"],
  });

  it("keeps only future events sharing a tag or an artist", () => {
    const candidates = [
      event({ id: "tag", tags: [tag("jazz")] }),
      event({ id: "artist", artists: ["ben"] }),
      event({ id: "none", tags: [tag("film")], artists: ["cy"] }),
      event({ id: "past", start: "2026-05-01T19:00:00Z", tags: [tag("jazz")] }),
    ];

    expect(
      ids(rankRelatedEvents({ event: current, candidates, now: NOW })),
    ).toEqual(["tag", "artist"]);
  });

  it("puts more matches first, then the sooner event", () => {
    const candidates = [
      event({ id: "one-late", start: "2026-09-01", tags: [tag("live")] }),
      event({ id: "one-soon", start: "2026-06-10", artists: ["ana"] }),
      event({
        id: "three",
        start: "2026-12-01",
        tags: [tag("jazz"), tag("live")],
        artists: ["ana"],
      }),
      event({
        id: "two",
        start: "2026-11-01",
        tags: [tag("jazz")],
        artists: ["ben"],
      }),
    ];

    expect(
      ids(rankRelatedEvents({ event: current, candidates, now: NOW })),
    ).toEqual(["three", "two", "one-soon", "one-late"]);
  });

  it("leaves out the event itself and duplicates across fetches", () => {
    const twice = event({ id: "twice", artists: ["ana"] });
    const candidates = [current, twice, twice];

    expect(
      ids(rankRelatedEvents({ event: current, candidates, now: NOW })),
    ).toEqual(["twice"]);
  });

  it("matches tags sent flat as well as nested", () => {
    const candidates = [
      event({ id: "flat", tags: [{ id: "jazz", title: "jazz" }] }),
    ];

    expect(
      ids(rankRelatedEvents({ event: current, candidates, now: NOW })),
    ).toEqual(["flat"]);
  });

  it("returns nothing for an event with no tags or artists", () => {
    const candidates = [
      event({ id: "any", tags: [tag("jazz")], artists: ["ana"] }),
    ];

    expect(
      rankRelatedEvents({ event: event({ id: "bare" }), candidates, now: NOW }),
    ).toEqual([]);
  });

  it("caps the result at the limit", () => {
    const candidates = ["a", "b", "c"].map((id) =>
      event({ id, artists: ["ana"] }),
    );

    expect(
      rankRelatedEvents({ event: current, candidates, now: NOW, limit: 2 }),
    ).toHaveLength(2);
  });
});

describe("rankRelatedForProduct", () => {
  const product = (
    slug: string,
    { tags = [], artists = [] }: { tags?: unknown[]; artists?: string[] } = {},
  ) =>
    ({
      slug,
      tags,
      artists: artists.map((s) => ({ profile: { slug: s } })),
    }) as unknown as Product;

  const current = product("current", {
    tags: [tag("jazz")],
    artists: ["ana"],
  });

  const keys = (records: RelatedRecord[]) =>
    records.map((r) => (r.kind === "event" ? r.event.id : r.product.slug));

  it("mixes events and products by score, events first on a tie", () => {
    const related = rankRelatedForProduct({
      product: current,
      events: [
        event({ id: "e-one", tags: [tag("jazz")] }),
        event({ id: "e-two", tags: [tag("jazz")], artists: ["ana"] }),
        event({
          id: "e-past",
          start: "2026-05-01T19:00:00Z",
          tags: [tag("jazz")],
        }),
      ],
      products: [
        product("p-one", { artists: ["ana"] }),
        product("p-none", { tags: [tag("film")] }),
      ],
      now: NOW,
    });

    expect(keys(related)).toEqual(["e-two", "e-one", "p-one"]);
  });

  it("drops the product itself and duplicates, and keeps to the limit", () => {
    const related = rankRelatedForProduct({
      product: current,
      events: [],
      products: [
        product("current", { tags: [tag("jazz")] }),
        product("a", { tags: [tag("jazz")] }),
        product("a", { tags: [tag("jazz")] }),
        product("b", { tags: [tag("jazz")] }),
        product("c", { tags: [tag("jazz")] }),
      ],
      now: NOW,
      limit: 2,
    });

    expect(keys(related)).toEqual(["a", "b"]);
  });
});

describe("relatedRowsOf", () => {
  const ev = (id: string): RelatedRecord => ({
    kind: "event",
    event: event({ id }),
  });
  const pr = (slug: string): RelatedRecord => ({
    kind: "product",
    product: { slug } as unknown as Product,
  });
  const keys = (rows: RelatedRecord[][]) =>
    rows.map((row) =>
      row.map((r) => (r.kind === "event" ? r.event.id : r.product.slug)),
    );

  it("keeps one mixed row while products fit in it", () => {
    const related = [ev("e1"), pr("p1"), ev("e2"), pr("p2"), ev("e3")];

    expect(keys(relatedRowsOf(related, 4))).toEqual([["e1", "p1", "e2", "p2"]]);
  });

  it("splits products above events when more than a row of products match", () => {
    const related = [
      ev("e1"),
      pr("p1"),
      pr("p2"),
      pr("p3"),
      pr("p4"),
      pr("p5"),
      ev("e2"),
    ];

    expect(keys(relatedRowsOf(related, 4))).toEqual([
      ["p1", "p2", "p3", "p4"],
      ["e1", "e2"],
    ]);
  });

  it("leaves out an empty events row", () => {
    const related = ["p1", "p2", "p3", "p4", "p5"].map(pr);

    expect(keys(relatedRowsOf(related, 4))).toEqual([["p1", "p2", "p3", "p4"]]);
  });

  it("gives nothing for nothing", () => {
    expect(relatedRowsOf([], 4)).toEqual([]);
  });
});
