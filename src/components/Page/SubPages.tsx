import {
  type SearchParams,
  VenueContent,
  getLocalizedContent,
  getPage,
  getPages,
} from "@venuecms/sdk-next";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { Link } from "@/lib/i18n";
import { PageWithParent } from "@/lib/utils/tree";

import {
  contentComponents,
  contentHandlers,
  pageBodyStyles,
} from "@/components/ListingBlock";

import { hasRenderableContent } from "../utils/pageContent";
import { resolvePageHref } from "../utils/pageHref";

/**
 * A page's direct sub-pages, each stacked below it with its own body, so a
 * section reads top to bottom on one page. Each still has its own route; the
 * heading links there.
 *
 * Fetched one by one rather than read off the page list: the list is what the
 * nav draws from, and only the single-page read is sure to carry
 * a body. Both reads are cached by the SDK.
 */
export const SubPages = async ({
  parentId,
  pages,
  searchParams = {},
  frame = (sections) => sections,
}: {
  parentId: string;
  /** The site's pages, when the caller already has them; read here otherwise. */
  pages?: Array<PageWithParent>;
  /** For the pagers on any listing blocks in the sub-pages' bodies. */
  searchParams?: SearchParams;
  /**
   * Wraps the sections in the caller's layout. Only called when there is a
   * sub-page to show, so a page without any gets no empty frame or padding.
   */
  frame?: (sections: ReactNode) => ReactNode;
}) => {
  const siblings =
    pages ?? ((await getPages()).data?.records as Array<PageWithParent>) ?? [];

  // A LINK page points elsewhere and has no body of its own to stack.
  const children = siblings.filter(
    (page) => page.parentId === parentId && page.type !== "LINK",
  );

  if (!children.length) {
    return null;
  }

  const [locale, records] = await Promise.all([
    getLocale(),
    Promise.all(children.map(({ slug }) => getPage({ slug }))),
  ]);

  const sections = records.flatMap(({ data: page }) => {
    if (!page) return [];

    const { content } = getLocalizedContent(page.localizedContent, locale);
    return [{ page, content }];
  });

  if (!sections.length) {
    return null;
  }

  return frame(
    sections.map(({ page, content }) => {
      const { href, target } = resolvePageHref(page);

      return (
        <section key={page.id} className="flex flex-col gap-6">
          <h2 className="text-sm text-primary">
            <Link href={href} target={target}>
              {content.title}
            </Link>
          </h2>
          {hasRenderableContent(content) ? (
            <VenueContent
              className={pageBodyStyles}
              content={content}
              contentStyles={contentComponents}
              components={contentHandlers}
              searchParams={searchParams}
            />
          ) : null}
        </section>
      );
    }),
  );
};
