import type { Site, Event as VenueEvent } from "@venuecms/sdk-next";
import { NextIntlClientProvider } from "next-intl";
import { renderToReadableStream } from "react-dom/server";
import { describe, expect, it } from "vitest";

import messages from "@/lib/i18n/dictionaries/en.json";

import { EventFeatured } from "./index";

const siteId = "site-id";

const site: Site = {
  id: siteId,
  timeZone: "Europe/Bratislava",
  settings: {},
};

const featuredEvent = (
  startDate: string,
  overrides: Partial<VenueEvent> = {},
): VenueEvent =>
  ({
    id: "event-id",
    siteId,
    slug: "a-gig",
    startDate,
    endDate: startDate,
    hasTime: true,
    publishState: "PUBLISHED",
    image: null,
    artists: [],
    localizedContent: [{ siteId, locale: "en", title: "A Featured Gig" }],
    ...overrides,
  }) as unknown as VenueEvent;

const render = async (event: VenueEvent, now?: Date) => {
  const stream = await renderToReadableStream(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EventFeatured event={event} site={site} now={now} />
    </NextIntlClientProvider>,
  );
  await stream.allReady;

  return new Response(stream).text();
};

// Midday in Bratislava on 24 November.
const now = new Date("2026-11-24T12:00:00+01:00");

describe("EventFeatured", () => {
  it("links the title to the event", async () => {
    const html = await render(featuredEvent("2026-11-28T20:00:00+01:00"), now);

    expect(html).toContain("A Featured Gig");
    expect(html).toContain('href="/en/events/a-gig"');
  });

  it("says Tonight for an evening start today", async () => {
    const html = await render(featuredEvent("2026-11-24T20:00:00+01:00"), now);

    expect(html).toContain(">Tonight<");
  });

  it("says Today for a start before 5pm today", async () => {
    const html = await render(featuredEvent("2026-11-24T14:00:00+01:00"), now);

    expect(html).toContain(">Today<");
  });

  it("shows the date for any other day", async () => {
    const html = await render(featuredEvent("2026-11-28T20:00:00+01:00"), now);

    expect(html).toContain("Saturday 28 November");
    expect(html).not.toContain(">Tonight<");
  });

  it("shows the date when it has no request time to judge by", async () => {
    const html = await render(featuredEvent("2026-11-24T20:00:00+01:00"));

    expect(html).toContain("Tuesday 24 November");
  });

  it("says Cancelled in place of the date", async () => {
    const html = await render(
      featuredEvent("2026-11-24T20:00:00+01:00", { publishState: "CANCELLED" }),
      now,
    );

    expect(html).toContain(">Cancelled<");
    expect(html).not.toContain(">Tonight<");
  });
});
