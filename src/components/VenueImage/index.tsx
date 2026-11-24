import { MediaItem, VenueImage as SdkVenueImage } from "@venuecms/sdk-next";

import { cn } from "@/lib/utils";

/**
 * The SDK image knows `square` and `video` by name and takes anything else as
 * the class itself, so other ratios are mapped to their class here — spelled
 * out in full so Tailwind finds it.
 */
const ASPECTS = {
  square: "aspect-square",
  video: "aspect-video",
  classic: "aspect-[4/3]",
  // No ratio: the image fills whatever height its container gives it,
  // cropped to cover around its focal point.
  fill: "h-full",
};

export type VenueImageAspect = keyof typeof ASPECTS;

/** Marks an image the site-wide duotone filter applies to; see ThemedBody. */
export const FILTERABLE_IMAGE_CLASS = "venue-image";

/**
 * Marks a filtered image that keeps its duotone on hover rather than fading to
 * full color, for an image with text set over it; see ThemedBody.
 */
export const HELD_FILTER_CLASS = "venue-image-held";

export const VenueImage = ({
  className,
  image,
  aspect,
  props,
  filter = false,
  withCredit = true,
  holdFilter = false,
}: {
  className?: string;
  image?: Partial<MediaItem>;
  aspect?: VenueImageAspect;
  props?: object;
  /**
   * Whether the site's image filter, when switched on, reaches this image.
   * Listings opt in — the cards in an event, product or artist list — and
   * the homepage's featured events, so a record's own page, the hero and the
   * logo all show their images in full color.
   */
  filter?: boolean;
  /**
   * Whether the image's photo credit is set over its corner. On by default;
   * a dense grid of cards turns it off, where a credit on every image crowds
   * the cards. The image's own page still credits it.
   */
  withCredit?: boolean;
  /**
   * Whether a filtered image keeps its duotone on hover. Off by default, so a
   * listing card fades to color under the pointer; an image with text over it
   * holds the tint the text was set against.
   */
  holdFilter?: boolean;
}) => {
  const img = (
    <SdkVenueImage
      className={className}
      image={image}
      aspect={aspect && ASPECTS[aspect]}
      props={props}
    />
  );

  return (
    <CreditWrapper credit={withCredit ? image?.credit : null}>
      {filter ? (
        // The filter's tint is a layer over the image, so it needs a box of
        // its own to sit in; `isolate` keeps its blend to this image alone.
        <div
          className={cn(
            FILTERABLE_IMAGE_CLASS,
            "relative isolate",
            // Passes a filled image's height down through the tint's box.
            aspect === "fill" && "h-full",
            holdFilter && HELD_FILTER_CLASS,
          )}
        >
          {img}
        </div>
      ) : (
        img
      )}
    </CreditWrapper>
  );
};

const CreditWrapper = ({
  children,
  credit,
}: {
  children?: React.ReactNode;
  credit?: string | null;
}) =>
  credit ? (
    <div className="relative">
      {children}
      <div className="absolute bottom--1 right-0 text-end text-xs text-muted opacity-60">
        {credit}
      </div>
    </div>
  ) : (
    children
  );
