/**
 * What this template renders content with: the prose class names, plus one
 * component per listing block an author can place in rich-text content.
 *
 * Class names and listing components share one map because no node type takes
 * both — the SDK sorts them by value, applying a string as a class to a node it
 * already draws and calling a function with the records for that block.
 *
 * Pass this to VenueContent's `contentStyles` anywhere editor content is
 * rendered. Content nested inside a listing passes plain `renderedStyles`
 * instead — without the listing entries, a listing cannot recurse into itself.
 */
import type {
  AllListingComponents,
  ContentEntries,
  NodeHandlers,
} from "@venuecms/sdk-next";

import { EmailListSignupBlock } from "@/components/EmailSignup";
import { proseHandlers } from "@/components/utils/handlers";
import { renderedStyles } from "@/components/utils/styles";

import { linkedContentImage } from "../Page/contentImage";
import {
  EventGridListingBlock,
  EventListingBlock,
  NewsListingBlock,
  PageListingBlock,
  ProductListingBlock,
  ProfileListingBlock,
} from "./blocks";

/**
 * The class names for a page body rendered through `contentComponents`, shared
 * by every layout that draws one so they cannot drift apart.
 */
export const pageBodyStyles = "flex flex-col gap-6 text-sm";

// Annotated with AllListingComponents as well, so a listing type added to the
// contract fails to compile here until this template can render it — rather
// than being dropped from published content with a console warning.
export const contentComponents: ContentEntries & AllListingComponents = {
  ...renderedStyles,

  eventListing: EventListingBlock,
  newsListing: NewsListingBlock,
  pageListing: PageListingBlock,
  productListing: ProductListingBlock,
  profileListing: ProfileListingBlock,
};

/**
 * `contentComponents` a step down, at text-xs, for the body of a record's own
 * page — an event's description, an artist's bio — set beside a large image.
 */
export const detailBodyComponents = resizedContentComponents("text-xs");

/**
 * `contentComponents` at the size of an h2 (text-xl), for the site's own text
 * on the homepage, which reads as a statement rather than body copy.
 */
export const siteContentComponents = resizedContentComponents("text-xl");

/**
 * `contentComponents` with every text-sm swapped for another size. The shared
 * styles set the size on each paragraph, heading and link, so it has to change
 * there rather than on the wrapper. Listing blocks pass through untouched.
 */
function resizedContentComponents(size: string): typeof contentComponents {
  return Object.fromEntries(
    Object.entries(contentComponents).map(([node, entry]) => [
      node,
      typeof entry === "string" ? entry.replace(/\btext-sm\b/g, size) : entry,
    ]),
  ) as typeof contentComponents;
}

/**
 * The 66-character measure as an image class. `ch` follows the element's own
 * font size, so text-sm keeps it equal to a body paragraph's width; the
 * min() keeps an image from overflowing a screen narrower than that.
 */
export const pageImageStyles = "max-w-[min(100%,66ch)] text-sm";

/**
 * `contentComponents` for a content page's own body, where
 * h3s are set as large as h2s, and paragraphs and inline images are capped at
 * 66 characters of body text.
 */
export const pageContentComponents: typeof contentComponents = {
  ...contentComponents,
  p: contentComponents.p?.replace(/max-w-\[72ch\]/g, "max-w-[66ch]"),
  h3: contentComponents.h3?.replace(/\btext-sm\b/g, "text-xl"),
  image: pageImageStyles,
  img: pageImageStyles,
};

/**
 * `contentComponents` for the body of a page typed as an event listing: its
 * event listing blocks draw the homepage's grid instead of the plain list.
 */
export const eventListPageComponents: ContentEntries & AllListingComponents = {
  ...contentComponents,
  eventListing: EventGridListingBlock,
};

/**
 * Handlers for content nodes the SDK's renderer does not draw itself.
 *
 * Without one, the renderer drops the node and leaves a gap where the author
 * put it. Pass this to VenueContent's `components` wherever `contentComponents`
 * (or `eventListPageComponents`) goes to `contentStyles`, so a page body
 * renders the same blocks everywhere.
 */
export const contentHandlers: NodeHandlers = {
  ...proseHandlers,
  emailListSignup: EmailListSignupBlock,
};

/**
 * `contentHandlers` for a content page's own body, where each image links to
 * its full-resolution original in a new tab. Pairs with `pageContentComponents`.
 */
export const pageContentHandlers: NodeHandlers = {
  ...contentHandlers,
  image: linkedContentImage(pageImageStyles),
};
