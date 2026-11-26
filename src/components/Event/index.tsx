import {
  type LocationSlim,
  type SearchParams,
  Site,
  type TicketOnEvent,
  VenueContent,
  type Event as VenueEvent,
  getLocalizedContent,
} from "@venuecms/sdk-next";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, Suspense } from "react";

import { Link } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import {
  contentHandlers,
  detailBodyComponents,
} from "@/components/ListingBlock";
import { ProfilesGrid } from "@/components/ProfilesGrid";
import {
  SiteIcon,
  type SiteIconChoice,
  siteIconOf,
} from "@/components/SiteIcon";
import { VenueImage } from "@/components/VenueImage";

import { TicketList } from "../TicketList";
import { formatDate, formatDateRange, formatTime } from "../utils";
import { SubEvents } from "./SubEvents";
import { WhileUpcoming } from "./WhileUpcoming";

/**
 * A single event's page:
 *
 *   title
 *   date   get tickets
 *   body         | image
 *                | location · times
 *   artist cards with bios, three across
 *
 * On a phone it reads top to bottom with the image ahead of the body, so the
 * picture and the practical details come before the long read.
 */
export const Event = ({
  event,
  site,
  searchParams,
}: {
  event: VenueEvent;
  site: Site;
  /**
   * The route's search params, for the pagers on any listing blocks in this
   * content. Only a route segment can read them, so they are passed down.
   *
   * Required rather than optional: a caller that forgets it costs every listing
   * in this content its pager, and does so silently — the records still render.
   * A surface that genuinely has no URL to page by passes `{}` and says so.
   */
  searchParams: SearchParams;
}) => {
  const locale = useLocale();
  const t = useTranslations("events");
  const { location, artists = [] } = event;
  const timeZone = site.timeZone ?? undefined;

  const { content } = getLocalizedContent(event?.localizedContent, locale);
  const isCancelled = event.publishState === "CANCELLED";
  const displayImage =
    event.image ??
    event.relations?.parents?.[0]?.image ??
    artists?.find((artist) => !!artist.profile?.image)?.profile.image;

  // A sub-event names the event it is part of. The first parent, as the
  // image fallback above takes it.
  const parent = event.relations?.parents?.[0];
  const parentTitle = parent ? titleOf(parent.localizedContent, locale) : null;

  const icon = siteIconOf(site);

  const eventDate = (template: string) =>
    formatDateRange({
      start: event.startDate,
      end: event.endDate,
      withTime: false,
      template,
      timeZone: site.timeZone!,
      locale,
    });

  return (
    <article className="flex flex-col gap-12 pb-6 pt-6 lg:gap-16 lg:pb-24">
      {/* Title and date row sit a little closer than the date row and the
          content; the artists below sit further off, as a section of their
          own. */}
      <div className="flex flex-col gap-10 lg:gap-14">
        <header className="flex flex-col gap-6 motion-safe:animate-slide-up lg:gap-10">
          <h1
            className={cn(
              "text-balance text-xl text-primary",
              isCancelled && "line-through",
            )}
          >
            {content.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-12 gap-y-4 text-sm">
            <span className={cn("text-primary", isCancelled && "line-through")}>
              {/* The year is shown only once the event is over, so an old
                  event isn't read as this year's. Past-ness is known only
                  at request time, so the prerendered shell shows it without.
                  A multi-day range carries its year already. */}
              <Suspense fallback={eventDate("EEEE d MMMM")}>
                <WhileUpcoming
                  event={event}
                  past={eventDate("EEEE d MMMM yyyy")}
                >
                  {eventDate("EEEE d MMMM")}
                </WhileUpcoming>
              </Suspense>
              {/* The start time, kept apart from the date so a multi-day
                range still gets one. */}
              {event.hasTime ? (
                <span className="ml-[3ch]">
                  {formatTime({ date: event.startDate, timeZone, locale })}
                </span>
              ) : null}
            </span>
            {isCancelled ? (
              <span className="text-secondary">{t("cancelled")}</span>
            ) : event.tickets?.length ? (
              // Hidden once the event is over: there is nothing left to buy.
              <Suspense fallback={null}>
                <WhileUpcoming event={event}>
                  <Tickets tickets={event.tickets} />
                </WhileUpcoming>
              </Suspense>
            ) : null}
          </div>
        </header>

        <div className="grid gap-12 lg:grid-cols-3">
          <div
            className="flex flex-col gap-4 motion-safe:animate-slide-up lg:order-2 lg:col-span-2"
            style={stagger(1)}
          >
            {displayImage ? (
              // Full width of its column at the image's own proportions. `sizes`
              // tells Next how wide that is, so it serves a source to match
              // rather than the stored width, stretched.
              <VenueImage
                image={displayImage}
                className="h-auto w-full"
                props={{ sizes: "(min-width: 1024px) 66vw, 100vw" }}
              />
            ) : null}
            {/* Address and times side by side even on a phone: both are
                short, and stacked they read as one long block. */}
            <div className="grid grid-cols-2 gap-8 text-xs sm:grid-cols-3">
              {location ? (
                <Detail icon={icon}>
                  <EventLocation location={location} />
                </Detail>
              ) : null}
              {event.hasTime ? (
                <Detail icon={icon}>
                  <EventTimes
                    start={event.startDate}
                    end={event.endDate}
                    timeZone={timeZone}
                  />
                </Detail>
              ) : null}
            </div>
          </div>

          <div
            className="flex flex-col gap-6 motion-safe:animate-slide-up lg:order-1"
            style={stagger(2)}
          >
            <VenueContent
              // The opening paragraph a step up, as a lead-in to the rest. Its
              // selector outranks the text-xs each paragraph carries.
              className="flex flex-col gap-6 text-xs [&>p:first-of-type]:text-sm"
              content={content}
              contentStyles={detailBodyComponents}
              components={contentHandlers}
              searchParams={searchParams}
            />
            {parent && parentTitle ? (
              <p className="flex gap-2 text-xs text-secondary">
                <SiteIcon icon={icon} className="text-icon" />
                <span>
                  {t.rich("part_of", {
                    title: parentTitle,
                    link: (chunks) => (
                      <Link
                        href={`/events/${parent.slug}`}
                        className="hover:brightness-150"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {event.relations?.children?.length ? (
        // Its own boundary: each sub-event is read in full, and the parent's
        // own content should not wait on those reads.
        <Suspense fallback={null}>
          <SubEvents event={event} site={site} />
        </Suspense>
      ) : null}

      {artists.length ? (
        // The artists page's grid, so an artist looks the same wherever
        // they are listed.
        <ProfilesGrid
          profiles={artists.map(({ profile }) => profile)}
          columns={3}
          withBio
          imageAspect="video"
          className="pt-6"
        />
      ) : null}
    </article>
  );
};

/**
 * A record's title in `locale`, or in English when it has none in that
 * language, so an untranslated title still reads rather than vanishing.
 */
const titleOf = (
  localizedContent: { locale: string; title?: string | null }[],
  locale: string,
) =>
  [locale, "en"]
    .map(
      (candidate) =>
        localizedContent.find((content) => content.locale === candidate)?.title,
    )
    .find(Boolean) ?? null;

/**
 * The delay for the nth section of the page sliding up, so the sections come
 * in one after another in reading order, as the homepage grid's cards do.
 */
const stagger = (step: number) => ({ animationDelay: `${step * 80}ms` });

/**
 * One of the facts under the image, led by the site's icon when it has one
 * (the Site Icon Style setting), in the Site Icon Color.
 */
export const Detail = ({
  icon,
  children,
}: {
  icon: SiteIconChoice;
  children: ReactNode;
}) => (
  <div className="flex min-w-0 gap-2 text-primary">
    <SiteIcon icon={icon} className="text-icon" />
    <div className="min-w-0">{children}</div>
  </div>
);

const EventLocation = ({ location }: { location: LocationSlim }) => {
  const locale = useLocale();
  const t = useTranslations("events");
  const { content } = getLocalizedContent(location.localizedContent, locale);
  const { address, address2, zipCode, city, mapLink } = location;
  const cityLine = [city, zipCode].filter(Boolean).join(" ");

  return (
    <address className="flex flex-col not-italic">
      {content.title ? <span>{content.title}</span> : null}
      {address ? <span>{address}</span> : null}
      {address2 ? <span>{address2}</span> : null}
      {cityLine ? <span>{cityLine}</span> : null}
      {mapLink ? (
        <a
          href={mapLink}
          target="_blank"
          rel="noreferrer"
          className="hover:brightness-150"
        >
          [ {t("map")} ]
        </a>
      ) : null}
    </address>
  );
};

/**
 * Start and end times. A single-day event gives times alone; one running over
 * several days puts each time with its date, since a bare end time would read
 * as the same evening.
 */
const EventTimes = ({
  start,
  end,
  timeZone,
}: {
  start: string;
  end?: string | null;
  timeZone?: string;
}) => {
  const locale = useLocale();
  const t = useTranslations("events");

  const sameDay =
    !end ||
    formatDate({
      date: start,
      withTime: false,
      template: "yyyy-MM-dd",
      timeZone,
    }) ===
      formatDate({
        date: end,
        withTime: false,
        template: "yyyy-MM-dd",
        timeZone,
      });

  const label = (date: string) =>
    sameDay
      ? formatTime({ date, timeZone, locale })
      : formatDate({ date, template: "d MMMM", timeZone, locale });

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-2">
      <dt>{t("starts")}:</dt>
      <dd>{label(start)}</dd>
      {end && end !== start ? (
        <>
          <dt>{t("ends")}:</dt>
          <dd>{label(end)}</dd>
        </>
      ) : null}
    </dl>
  );
};

/**
 * The tickets as a call to action. Tickets sharing one link — the usual case,
 * a single ticket shop — make one "get tickets" button; separate links get a
 * button each, named for the ticket. Tickets with no link at all fall back to
 * the plain price list, since there is nowhere to send anyone.
 */
const Tickets = ({ tickets }: { tickets: TicketOnEvent[] }) => {
  const t = useTranslations("tickets");
  const linked = tickets.filter((ticket) => ticket.externalLink);
  const links = [...new Set(linked.map((ticket) => ticket.externalLink!))];

  if (!links.length) {
    return <TicketList tickets={tickets} />;
  }

  const button =
    "bg-primary px-[1.5em] py-[0.75em] text-xs leading-none text-background transition-transform duration-500 hover:scale-[1.02]";

  return (
    <div className="flex flex-wrap gap-4">
      {links.length === 1 ? (
        <Link href={links[0]} target="_blank" className={button}>
          {t("get_tickets")}
        </Link>
      ) : (
        linked.map((ticket) => (
          <Link
            key={ticket.name}
            href={ticket.externalLink!}
            target="_blank"
            className={button}
          >
            {ticket.name}
          </Link>
        ))
      )}
    </div>
  );
};
