import {
  type Site,
  type Event as VenueEvent,
  getLocalizedContent,
} from "@venuecms/sdk-next";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { VenueImage } from "@/components/VenueImage";

import { formatDateRangeParts, sameDayLabel } from "../utils";
import { FillScreen } from "./FillScreen";

/**
 * A featured event on the homepage: the image filling the screen below the
 * header, in the listings' duotone, with the date and title centred over it
 * in white. The whole card links to the event.
 *
 * An event starting today reads "Tonight" from 5pm and "Today" before, in the
 * venue's zone, in place of its date. That needs `now`, which only a request
 * can supply; without it the date shows.
 */
export const EventFeatured = ({
  event,
  site,
  now,
  first = true,
  className,
}: {
  event: VenueEvent;
  site: Site;
  /** The request's time, for "Today" and "Tonight". */
  now?: Date;
  /**
   * Whether this is the first featured event, directly under the header: it
   * fills the screen below the header, and any after it fill a screen each.
   */
  first?: boolean;
  className?: string;
}) => {
  const locale = useLocale();
  const t = useTranslations("events");

  const { content } = getLocalizedContent(event?.localizedContent, locale);
  const isCancelled = event.publishState === "CANCELLED";
  const timeZone = site.timeZone ?? undefined;
  const displayImage =
    event.image ??
    event.relations?.parents?.[0]?.image ??
    event.artists?.find((artist) => !!artist.profile?.image)?.profile.image;

  const dayLabel = now
    ? sameDayLabel({
        start: event.startDate,
        hasTime: event.hasTime,
        now,
        timeZone,
      })
    : null;

  const { date, time } = formatDateRangeParts({
    start: event.startDate,
    end: event.endDate,
    withTime: event.hasTime,
    template: "EEEE d MMMM",
    timeZone: site.timeZone!,
    locale,
  });

  const label = isCancelled ? (
    t("cancelled")
  ) : dayLabel ? (
    t(dayLabel)
  ) : (
    <>
      {date}
      {/* Spaced the way the listings space it. */}
      {time ? <span className="ml-[3ch]">{time}</span> : null}
    </>
  );

  return (
    <FillScreen fromTop={first} className={className}>
      <Link
        href={`/events/${event.slug}`}
        // Clips the image's hover zoom to the box.
        className="group relative block h-full overflow-hidden motion-safe:animate-slide-up"
      >
        {/* Scaled as one with its duotone layer, so the tint grows with the
            picture; skipped for readers who ask for reduced motion. */}
        <div className="h-full motion-safe:transition-transform motion-safe:duration-[2000ms] motion-safe:group-hover:scale-105">
          <VenueImage
            image={displayImage}
            aspect="fill"
            filter
            // The title is set against the tint, so it stays under the pointer.
            holdFilter
            withCredit={false}
            props={{ sizes: "100vw" }}
          />
        </div>
        {/* A screen over the picture so the title reads against it, in the
            same tint as the duotone. `--tint` carries its own alpha, so the
            opacity goes on the layer instead of a `/70` modifier. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-tint opacity-70"
        />
        {/* Over the image, and above its duotone layer. A soft shadow in the tint keeps
          the white legible where the picture runs to white itself. */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center text-white [text-shadow:0_1px_16px_color-mix(in_srgb,hsla(var(--tint))_25%,transparent)] lg:gap-6">
          <span className="text-sm tracking-[0.2em]">{label}</span>
          <h2
            className={cn(
              "max-w-5xl text-balance text-xl lg:text-xxl",
              isCancelled && "line-through",
            )}
          >
            {content.title}
          </h2>
        </div>
      </Link>
    </FillScreen>
  );
};
