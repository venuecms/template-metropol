import type { Event as VenueEvent } from "@venuecms/sdk-next";
import { describe, expect, it } from "vitest";

import { homepageFeaturedEvents } from "./featured";

const timeZone = "Europe/Bratislava";

// Midday in Bratislava on 24 November.
const now = new Date("2026-11-24T12:00:00+01:00");

const event = (
  id: string,
  startDate: string,
  overrides: Partial<VenueEvent> = {},
): VenueEvent =>
  ({
    id,
    startDate,
    endDate: startDate,
    hasTime: true,
    publishState: "PUBLISHED",
    ...overrides,
  }) as unknown as VenueEvent;

const ids = (events: VenueEvent[]) => events.map(({ id }) => id);

describe("homepageFeaturedEvents", () => {
  it("puts events starting today above the featured ones", () => {
    const featured = [event("featured", "2026-11-30T20:00:00+01:00")];
    const upcoming = [
      event("today-afternoon", "2026-11-24T15:00:00+01:00"),
      event("tonight", "2026-11-24T21:00:00+01:00"),
      event("tomorrow", "2026-11-25T20:00:00+01:00"),
    ];

    expect(
      ids(homepageFeaturedEvents({ featured, upcoming, now, timeZone })),
    ).toEqual(["today-afternoon", "tonight", "featured"]);
  });

  it("shows a featured event starting today once, with today's", () => {
    const tonight = event("tonight", "2026-11-24T21:00:00+01:00");
    const featured = [event("featured", "2026-11-30T20:00:00+01:00"), tonight];

    expect(
      ids(
        homepageFeaturedEvents({
          featured,
          upcoming: [tonight],
          now,
          timeZone,
        }),
      ),
    ).toEqual(["tonight", "featured"]);
  });

  it("judges today in the venue's zone", () => {
    // 00:30 on the 25th in Bratislava, still the 24th in UTC.
    const upcoming = [event("after-midnight", "2026-11-24T23:30:00Z")];

    expect(
      homepageFeaturedEvents({ featured: [], upcoming, now, timeZone }),
    ).toEqual([]);
  });

  it("doesn't promote a cancelled event", () => {
    const upcoming = [
      event("cancelled", "2026-11-24T20:00:00+01:00", {
        publishState: "CANCELLED",
      } as Partial<VenueEvent>),
    ];

    expect(
      homepageFeaturedEvents({ featured: [], upcoming, now, timeZone }),
    ).toEqual([]);
  });
});
