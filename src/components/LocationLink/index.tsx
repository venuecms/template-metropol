import {
  LocationSlim as VenueLocation,
  getLocalizedContent,
} from "@venuecms/sdk-next";
import { MapPin } from "lucide-react";
import { useLocale } from "next-intl";
import { ReactNode } from "react";

import { Link } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * An event's location. With `href` it links there (e.g. the event's own page)
 * without the map pin; otherwise it links to the location's map, if it has one.
 * With `nameOnly` it shows just the location's name, without city or country.
 */
export const LocationLink = ({
  location,
  href,
  className,
  nameOnly = false,
}: {
  location: VenueLocation;
  href?: string;
  className?: string;
  nameOnly?: boolean;
}) => {
  const { mapLink } = location;

  if (href) {
    return (
      <Link href={href} className={cn("text-secondary", className)}>
        <LocationDisplay location={location} nameOnly={nameOnly} />
      </Link>
    );
  }

  return mapLink ? (
    <a
      href={mapLink}
      target="_blank"
      className={cn("flex items-center gap-2 text-secondary", className)}
    >
      <LocationDisplay
        location={location}
        nameOnly={nameOnly}
        icon={<MapPin className="size-3" />}
      />{" "}
    </a>
  ) : (
    <LocationDisplay location={location} nameOnly={nameOnly} />
  );
};

const LocationDisplay = ({
  location,
  icon,
  nameOnly,
}: {
  location: VenueLocation;
  icon?: ReactNode;
  nameOnly?: boolean;
}) => {
  const locale = useLocale();
  const { content: locationContent } = getLocalizedContent(
    location.localizedContent,
    locale,
  );
  const { isDefault, country, city, region } = location;

  return (
    <div className="text-balance hover:brightness-150">
      {locationContent.title}
      {!isDefault && !nameOnly
        ? `${city ? `, ${city}` : ""} ${country ? country : ""}`
        : null}
      <span className="inline-block px-2">{icon}</span>
    </div>
  );
};
