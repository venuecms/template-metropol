import {
  ProductVariant,
  type SearchParams,
  Site,
  VenueContent,
  Product as VenueProduct,
  getLocalizedContent,
} from "@venuecms/sdk-next";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/lib/i18n";

import {
  contentHandlers,
  detailBodyComponents,
} from "@/components/ListingBlock";
import { siteIconOf } from "@/components/SiteIcon";
import { VenueImage } from "@/components/VenueImage";

import { Detail } from "../Event";

/**
 * A single product's page, laid out as an event's is:
 *
 *   author
 *   title
 *   a buy button per format
 *   body         | image
 *   artists
 *
 * On a phone it reads top to bottom with the image ahead of the body.
 */
export const Product = ({
  product,
  site,
  searchParams,
}: {
  product: VenueProduct;
  site: Site;
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
  const { artists = [], variants = [] } = product;

  const { content } = getLocalizedContent(product?.localizedContent, locale);
  const displayImage =
    product.image ??
    artists.find((artist) => !!artist.profile?.image)?.profile.image;
  const icon = siteIconOf(site);

  return (
    <article className="flex flex-col gap-12 pb-6 pt-6 lg:gap-16 lg:pb-24">
      {/* Spaced as the event page is: title and variants a little closer than
          the variants and the content; the artists further off. */}
      <div className="flex flex-col gap-10 lg:gap-14">
        <header className="flex flex-col gap-6 motion-safe:animate-slide-up lg:gap-10">
          <div className="flex flex-col gap-2">
            {product.author ? (
              <span className="text-sm text-secondary">{product.author}</span>
            ) : null}
            <h1 className="text-balance text-xl text-primary">
              {content.title}
            </h1>
          </div>

          {variants.length ? (
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {variants.map((variant, i) => (
                <VariantButton
                  key={variant.productType?.type ?? i}
                  variant={variant}
                />
              ))}
            </div>
          ) : null}
        </header>

        <div className="grid gap-12 lg:grid-cols-3">
          {displayImage ? (
            <div
              className="flex flex-col gap-4 motion-safe:animate-slide-up lg:order-2 lg:col-span-2"
              style={stagger(1)}
            >
              <VenueImage
                image={displayImage}
                className="h-auto w-full"
                props={{ sizes: "(min-width: 1024px) 66vw, 100vw" }}
              />
            </div>
          ) : null}

          <div
            className="flex flex-col gap-6 motion-safe:animate-slide-up lg:order-1"
            style={stagger(2)}
          >
            <VenueContent
              // The opening paragraph a step up, as a lead-in to the rest.
              className="flex flex-col gap-6 text-xs [&>p:first-of-type]:text-sm"
              content={content}
              contentStyles={detailBodyComponents}
              components={contentHandlers}
              searchParams={searchParams}
            />
            {/* The artists after the description, styled as the event page's
                location details: each led by the site's icon, side by side,
                wrapping when they run out of room. */}
            {artists.length ? (
              <ul className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
                {artists.map(({ profile }) => (
                  <li key={profile.slug}>
                    <Detail icon={icon}>
                      <Link
                        href={`/artists/${profile.slug}`}
                        className="hover:brightness-150"
                      >
                        {
                          getLocalizedContent(profile.localizedContent, locale)
                            .content.title
                        }
                      </Link>
                    </Detail>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

/**
 * The delay for the nth section of the page sliding up, so the sections come
 * in one after another in reading order, as on the event page.
 */
const stagger = (step: number) => ({ animationDelay: `${step * 80}ms` });

/**
 * A variant as its buy button, named for its format. A variant with no link has
 * nowhere to send anyone, so it shows its format as plain text.
 */
const VariantButton = ({ variant }: { variant: ProductVariant }) => {
  const t = useTranslations("shop");
  const label = variant.productType?.type || t("buy");

  if (!variant.externalLink) {
    return variant.productType?.type ? (
      <span className="text-secondary">{label}</span>
    ) : null;
  }

  return (
    <a
      href={variant.externalLink}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-primary px-[1.5em] py-[0.75em] text-xs leading-none text-background transition-transform duration-500 hover:scale-[1.02]"
    >
      {label}
    </a>
  );
};
