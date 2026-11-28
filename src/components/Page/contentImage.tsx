import type { NodeHandlers } from "@venuecms/sdk-next";

import { VenueImage } from "@/components/VenueImage";
import { getPublicImage } from "@/components/utils/image";

type ImageNode = { attrs?: { src?: string | null; alt?: string | null } };

/**
 * An image in a content page's body, linked to its full-resolution original in
 * a new tab. Mirrors the SDK's own image node, which takes the editor's src as
 * a media key with or without its `/media/` prefix; `/media/` serves the
 * stored original rather than a resized copy.
 */
export const linkedContentImage =
  (className: string): NodeHandlers[string] =>
  ({ node }) => {
    const { src, alt } = (node as ImageNode).attrs ?? {};

    if (!src) {
      return <></>;
    }

    const external = /^https?:\/\//.test(src);
    const url = src.replace(/^\/media\//, "");
    const href = external ? src : getPublicImage({ url });

    return (
      <a href={href || undefined} target="_blank" rel="noopener noreferrer">
        <VenueImage
          image={{ url, metadata: { altText: alt ?? undefined } }}
          className={className}
          withCredit={false}
        />
      </a>
    );
  };
