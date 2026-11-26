import { type Event, type Site, getLocalizedContent } from "@venuecms/sdk-next";
import { useLocale, useTranslations } from "next-intl";
import { ReactNode } from "react";

import { Link } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { VenueImage, type VenueImageAspect } from "@/components/VenueImage";

import { EventDate } from "../EventDate";
import { LocationLink } from "../LocationLink";

export const EventsList = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-x-8 text-sm sm:grid sm:grid-flow-row sm:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
};

/**
 * The homepage's event grid: three columns with images from `sm` up, one on
 * phones, each card sliding up in turn as the grid appears. Shared so a page
 * typed as an event listing draws its records exactly as the homepage does.
 */
export const EventsGrid = ({
  events,
  site,
  className,
  imageAspect,
}: {
  events: Event[];
  site: Site;
  className?: string;
  /** The cards' image ratio; 16:9 unless given. */
  imageAspect?: VenueImageAspect;
}) => (
  <EventsList className={cn("gap-y-4 lg:grid-cols-3", className)}>
    {events.map((event, index) => (
      <div
        key={event.id}
        className="motion-safe:animate-slide-up"
        // Staggered so the grid fills in card by card, capped so a long
        // grid is all in within a second rather than trickling for several.
        style={{ animationDelay: `${Math.min(index, 10) * 80}ms` }}
      >
        <ListEvent
          event={event}
          site={site}
          withImage
          imageClassName="sm:w-full"
          imageAspect={imageAspect}
          imageCredit={false}
          locationToEvent
          locationNameOnly
        />
      </div>
    ))}
  </EventsList>
);

export const ListEvent = ({
  event,
  site,
  withImage,
  withTime = true,
  dateTemplate,
  className,
  imageClassName,
  imageAspect = "video",
  imageCredit = true,
  locationToEvent = false,
  locationNameOnly = false,
}: {
  event: Event;
  site: Site;
  withImage?: boolean;
  withTime?: boolean;
  dateTemplate?: string;
  className?: string;
  /** Merged over the image wrapper, e.g. `sm:w-full` to fill a grid cell. */
  imageClassName?: string;
  /** The image's ratio; 16:9 unless given. */
  imageAspect?: VenueImageAspect;
  /** Whether the image shows its photo credit; the grid turns it off. */
  imageCredit?: boolean;
  /** Whether the location links to the event page instead of its map. */
  locationToEvent?: boolean;
  /** Whether the location shows its name alone, without city or country. */
  locationNameOnly?: boolean;
}) => {
  const locale = useLocale();
  const t = useTranslations("events");
  const { artists } = event;
  const { content } = getLocalizedContent(event.localizedContent, locale);
  const isCancelled = event.publishState === "CANCELLED";
  const displayImage =
    event.image ??
    event.relations?.parents?.[0]?.image ??
    artists?.find((artist) => !!artist.profile?.image)?.profile.image;

  return (
    <div className={cn("flex break-inside-avoid flex-col pb-8", className)}>
      {withImage ? (
        <div
          className={cn("w-full pb-3 sm:w-80 sm:max-w-full", imageClassName)}
        >
          <Link href={`/events/${event.slug}`}>
            <VenueImage
              image={displayImage}
              aspect={imageAspect}
              filter
              withCredit={imageCredit}
            />
          </Link>
        </div>
      ) : null}
      <div className="flex flex-col">
        {event.startDate ? (
          <EventDate
            href={`/events/${event.slug}`}
            start={event.startDate}
            end={event.endDate}
            withTime={withTime && event.hasTime}
            template={dateTemplate}
            timeZone={site.timeZone!}
            locale={locale}
          />
        ) : null}
        <div
          className={cn(
            "text-balance text-primary hover:brightness-150",
            isCancelled && "line-through",
          )}
        >
          <Link href={`/events/${event.slug}`}>{content.title}</Link>
        </div>
        {event.location && !event.location.isDefault ? (
          <LocationLink
            location={event.location}
            href={locationToEvent ? `/events/${event.slug}` : undefined}
            nameOnly={locationNameOnly}
          />
        ) : null}
        {isCancelled ? <div className="">{t("cancelled")}</div> : null}
      </div>
    </div>
  );
};
