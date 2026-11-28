import {
  type SearchParams,
  VenueContent,
  type Page as VenuePage,
  getLocalizedContent,
} from "@venuecms/sdk-next";
import { useLocale } from "next-intl";

import {
  pageBodyStyles,
  pageContentComponents,
  pageContentHandlers,
} from "@/components/ListingBlock";
import { VenueImage } from "@/components/VenueImage";

import { ProfileCompact } from "../ProfileCompact";
import { FullWidthLayout, TwoSubColumnLayout } from "../layout";
import { splitSections } from "../utils/pageContent";

export const Page = ({
  page,
  searchParams,
}: {
  page: VenuePage;
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

  const { artists = [] } = page;
  const { content } = getLocalizedContent(page?.localizedContent, locale);
  const excerpt = (content.excerpt || content.shortContent)?.trim();

  return (
    <FullWidthLayout>
      {excerpt && (
        // The excerpt leads the page at full width, h2-sized.
        <p className="whitespace-pre-line text-xl text-primary">{excerpt}</p>
      )}
      <VenueImage image={page.image} className="h-auto w-full" withCaption />
      {splitSections(content).map(({ lead, columns }, index) => (
        // Each h2 runs full width; the h3 sections under it sit in two columns.
        <section key={index} className="flex flex-col gap-12">
          {lead && (
            <VenueContent
              className={pageBodyStyles}
              content={lead}
              contentStyles={pageContentComponents}
              components={pageContentHandlers}
              searchParams={searchParams}
            />
          )}
          {columns.length > 0 && (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {columns.map((column, columnIndex) => (
                <VenueContent
                  key={columnIndex}
                  className={pageBodyStyles}
                  content={column}
                  contentStyles={pageContentComponents}
                  components={pageContentHandlers}
                  searchParams={searchParams}
                />
              ))}
            </div>
          )}
        </section>
      ))}
      <TwoSubColumnLayout>
        {artists.map(({ profile }) => (
          <ProfileCompact key={profile.slug} profile={profile} />
        ))}
      </TwoSubColumnLayout>
    </FullWidthLayout>
  );
};
