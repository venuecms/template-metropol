import { getEvents, getSite } from "@venuecms/sdk-next";
import { connection } from "next/server";

import { templateConfigOf } from "@/lib/utils/templateConfig";

import { EventFeatured } from "@/components/EventFeatured";
import { VenueImage } from "@/components/VenueImage";

import { featuredEventsQuery } from "./featured";

export async function FeaturedEventsContent({ locale }: { locale: string }) {
  await connection();

  const [{ data: featuredEvents }, { data: site }] = await Promise.all([
    getEvents(featuredEventsQuery),
    getSite(),
  ]);

  if (!site) return null;

  // Read after `connection()`, so it is the request's time rather than the
  // build's: "Today" and "Tonight" depend on it.
  const now = new Date();

  const templateSettings = templateConfigOf(site) as {
    showHeroImage?: boolean;
    noHeroOverlay?: boolean;
  };
  const { showHeroImage, noHeroOverlay } = templateSettings;
  const webSiteSettings = site.webSites ? site.webSites[0] : undefined;

  return (
    <>
      {showHeroImage ? (
        <div className="w-vw absolute left-0 top-0 -z-30 h-svh w-screen bg-red-300">
          <VenueImage aspect="video" image={webSiteSettings?.image} />
          {noHeroOverlay ? null : (
            <div className="absolute left-0 top-0 h-full w-full bg-[#1F1C1F] bg-cover bg-center bg-no-repeat opacity-80">
              <div className="absolute inset-0 bg-[#1F1C1F]"></div>
            </div>
          )}
        </div>
      ) : null}
      {featuredEvents?.records.length ? (
        // Spaced by the body's side padding, as the gap under each image is.
        <div className="flex flex-col gap-6 pb-16 sm:gap-12">
          {featuredEvents.records.map((event, index) => (
            <EventFeatured
              key={event.id}
              event={event}
              site={site}
              now={now}
              first={index === 0}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
