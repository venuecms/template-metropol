import {
  ArrowBottomRightIcon,
  DotFilledIcon,
  TriangleRightIcon,
} from "@radix-ui/react-icons";
import type { Site } from "@venuecms/sdk-next";

import { cn } from "@/lib/utils";
import { templateConfigOf } from "@/lib/utils/templateConfig";

import { type IconStyle, iconStyleOf } from "./style";

export { ICON_STYLES, type IconStyle, iconStyleOf } from "./style";

const ICONS = {
  "Arrow Bottom Right": ArrowBottomRightIcon,
  "Triangle Right": TriangleRightIcon,
  "Dot Filled": DotFilledIcon,
} satisfies Record<Exclude<IconStyle, "None" | "Custom">, unknown>;

/** The site's chosen icon: its style and, for `Custom`, where its SVG is. */
export type SiteIconChoice = { style: IconStyle; src?: string };

/**
 * The site's icon, from its template config. A `Custom` icon is read from the
 * site's media at `icons/custom.svg`, as the custom font is from `fonts/`.
 */
export const siteIconOf = (site: Site): SiteIconChoice => {
  const style = iconStyleOf(templateConfigOf(site));
  return style === "Custom"
    ? { style, src: `/media/sites/${site.id}/icons/custom.svg` }
    : { style };
};

/**
 * Extra weight for the icons, in their own 15-unit frame. Radix draws them as
 * filled outlines about one unit thick; a stroke of the same color around the
 * outline thickens each line by this much, and rounds its corners off.
 */
const WEIGHT = 0.6;

/**
 * The 15-unit frame cropped to the arrow's own bounds (3.5–12, widened by half
 * the stroke on each side), the largest of the three, so the drawing fills the
 * box. The triangle and dot are smaller and sit near its centre, at the same
 * relative size as in the set.
 */
const CROP = `${3.5 - WEIGHT / 2} ${3.5 - WEIGHT / 2} ${8.5 + WEIGHT} ${8.5 + WEIGHT}`;

/**
 * The site's marker icon, or nothing for `None`. Decorative, so hidden from
 * readers.
 *
 * Set against the capitals of the first line, as a typographic mark: a box one
 * line tall centres a cap-height box (`1cap`), which lands on the capitals for
 * fonts whose ascent and descent are balanced the usual way. The icon then
 * hangs from the top of that box at 85% of cap height, level with
 * the tops of the letters, and stays there however many lines the block runs
 * to.
 */
export const SiteIcon = ({
  icon: { style, src },
  className,
}: {
  icon: SiteIconChoice;
  className?: string;
}) => {
  if (style === "None" || (style === "Custom" && !src)) return null;

  return (
    <span
      aria-hidden
      className={cn("flex h-[1lh] shrink-0 items-center", className)}
    >
      <span className="flex h-[1cap] items-start">
        {style === "Custom" ? (
          <CustomIcon src={src!} />
        ) : (
          <RadixIcon style={style} />
        )}
      </span>
    </span>
  );
};

const RadixIcon = ({ style }: { style: keyof typeof ICONS }) => {
  const Icon = ICONS[style];

  return (
    <Icon
      viewBox={CROP}
      stroke="currentColor"
      strokeWidth={WEIGHT}
      strokeLinejoin="round"
      className="size-[0.85cap]"
    />
  );
};

/**
 * A site's own SVG, used as a mask over the current color, so it takes the
 * Site Icon Color whatever color it was drawn in: only its shape counts.
 * Fitted into the same box as the Radix icons, against its top edge. It gets
 * no added weight: a mask has no outline to thicken, so the drawing is used
 * as it is. A missing file shows nothing rather than a broken image.
 */
const CustomIcon = ({ src }: { src: string }) => {
  const mask = `url("${src}") center top / contain no-repeat`;

  return (
    <span
      className="block size-[0.85cap] bg-current"
      style={{ mask, WebkitMask: mask }}
    />
  );
};
