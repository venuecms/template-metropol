import { type Page, getLocalizedContent } from "@venuecms/sdk-next";

import { resolvePageHref } from "../utils/pageHref";

/**
 * One entry in the site nav. Plain data rather than rendered elements, so the
 * desktop and mobile menus — both client components — can each lay out the
 * same items their own way.
 */
export type NavItem = {
  id: string;
  title: string;
  href: string;
  target: "_blank" | "_self";
  /** Direct sub-pages; the nav goes one level deep. */
  children: NavItem[];
};

const toNavItem = (page: Page, locale: string, children: NavItem[]) => {
  const { content } = getLocalizedContent(page.localizedContent, locale);
  const { href, target } = resolvePageHref(page);

  return { id: page.id, title: content.title ?? "", href, target, children };
};

/**
 * The root pages, in the order the CMS returns them, each with its direct
 * sub-pages. Deeper descendants are not shown in the nav.
 */
export const buildNavItems = (pages: Page[], locale: string): NavItem[] =>
  pages
    .filter((page) => page.parentId == null)
    .map((root) =>
      toNavItem(
        root,
        locale,
        pages
          .filter((page) => page.parentId === root.id)
          .map((child) => toNavItem(child, locale, [])),
      ),
    );
