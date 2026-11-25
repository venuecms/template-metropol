import {
  type SearchParams,
  VenueContent,
  type Profile as VenueProfile,
  getLocalizedContent,
} from "@venuecms/sdk-next";
import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";

import {
  contentHandlers,
  detailBodyComponents,
} from "@/components/ListingBlock";
import { VenueImage } from "@/components/VenueImage";

import { ErrorBoundary } from "../utils/ErrorBoundary";
import { ProfileEventList, ProfileEventListSkeleton } from "./ProfileEventList";

/**
 * An artist's page, laid out as an event's page is:
 *
 *   name
 *   bio          | image
 *   upcoming events
 *   past events
 *
 * On a phone it reads top to bottom with the image ahead of the bio, as the
 * event page puts its image ahead of the description.
 */
export const Profile = ({
  profile,
  searchParams,
}: {
  profile: VenueProfile;
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

  const { content } = getLocalizedContent(profile?.localizedContent, locale);

  return (
    <article className="flex flex-col gap-12 pb-6 pt-6 lg:gap-16 lg:pb-24">
      {/* The name stands the same distance above the content as an event's
          date row does; with no date row, that is the only gap. */}
      <div className="flex flex-col gap-10 lg:gap-14">
        <header className="motion-safe:animate-slide-up">
          <h1 className="text-balance text-xl text-primary">{content.title}</h1>
        </header>

        <div className="grid gap-12 lg:grid-cols-3">
          {profile.image ? (
            <div
              className="motion-safe:animate-slide-up lg:order-2 lg:col-span-2"
              style={stagger(1)}
            >
              {/* Full width of its column at the image's own proportions, as
                  the event page's image. */}
              <VenueImage
                image={profile.image}
                className="h-auto w-full"
                props={{ sizes: "(min-width: 1024px) 66vw, 100vw" }}
              />
            </div>
          ) : null}

          <VenueContent
            // The opening paragraph a step up, as a lead-in to the rest. Its
            // selector outranks the text-xs each paragraph carries.
            className="content-body flex flex-col gap-6 text-xs [animation-delay:160ms] motion-safe:animate-slide-up lg:order-1 [&>p:first-of-type]:text-sm"
            content={content}
            contentStyles={detailBodyComponents}
            components={contentHandlers}
            searchParams={searchParams}
          />
        </div>
      </div>

      <ErrorBoundary fallback={null}>
        <Suspense fallback={<ProfileEventListSkeleton numElements={3} />}>
          <ProfileEventList
            header={t("upcoming_events")}
            slug={profile.slug}
            filter={{ upcoming: true, dir: "asc" }}
          />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <ProfileEventList
            header={t("past_events")}
            slug={profile.slug}
            filter={{ lt: Date.now(), dir: "desc" }}
          />
        </Suspense>
      </ErrorBoundary>
    </article>
  );
};

/** The delay for the nth section sliding up, as on the event page. */
const stagger = (step: number) => ({ animationDelay: `${step * 80}ms` });
