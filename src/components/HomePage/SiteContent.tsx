import {
  type LocalizedContent,
  type SearchParams,
  VenueContent,
  getLocalizedContent,
  getSite,
} from "@venuecms/sdk-next";

import { contentComponents, contentHandlers } from "@/components/ListingBlock";
import { FullWidthLayout } from "@/components/layout";

/**
 * The site's own text on the homepage: the website's localized content, or
 * the site description when the website has none. Renders nothing when there
 * is neither.
 */
export async function SiteContent({
  locale,
  searchParams,
}: {
  locale: string;
  /**
   * Taken as a promise and awaited here, inside the section's Suspense
   * boundary: the content can hold a listing block whose pager needs the URL,
   * and awaiting it in the route would pull the whole home page out of the
   * prerendered shell.
   */
  searchParams: Promise<SearchParams>;
}) {
  const [{ data: site }, resolvedSearchParams] = await Promise.all([
    getSite(),
    searchParams,
  ]);

  if (!site) {
    return null;
  }

  const webSiteSettings = site.webSites ? site.webSites[0] : undefined;
  const { content: siteContent } = webSiteSettings?.localizedContent?.length
    ? getLocalizedContent(webSiteSettings.localizedContent, locale)
    : { content: { content: site.description } as LocalizedContent };

  if (!siteContent) {
    return null;
  }

  return (
    <FullWidthLayout className="text-sm text-secondary">
      <VenueContent
        className="flex max-w-2xl flex-col gap-6"
        content={siteContent}
        contentStyles={contentComponents}
        components={contentHandlers}
        searchParams={resolvedSearchParams}
      />
    </FullWidthLayout>
  );
}
