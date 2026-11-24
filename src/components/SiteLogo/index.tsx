import { Site } from "@venuecms/sdk-next";

import { Link } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { VenueImage } from "@/components/VenueImage";

export const SiteLogo = ({
  className,
  site,
}: {
  className?: string;
  site: Site;
}) => {
  const { name, image } = site;

  // A website record can carry its own logo, which outranks the site-wide image.
  // Takes the first record, as FeaturedEventsContent and EventsContent both do:
  // the template treats a site's website settings as a singleton, and nothing
  // here knows which of several websites the current request is being served as.
  const logo = site.webSites?.[0]?.logo ?? image;

  const headerImage = logo ? (
    <VenueImage
      image={logo}
      // Sized from the base text size (`--sm`), so the logo follows the site's
      // Base Font Size setting and grows with the viewport as the text does.
      // `--logo-scale` is the Logo Scale setting; see ThemedBody/logoScale.
      className="h-[calc(var(--sm)*var(--logo-scale,1.5))] w-auto min-w-8 max-w-full object-contain object-left sm:max-w-[32rem]"
    />
  ) : null;

  return headerImage ? (
    <Link href="/">{headerImage}</Link>
  ) : (
    <h1 className={cn("text-sm text-nav", className)}>
      <Link href="/">{name}</Link>
    </h1>
  );
};
