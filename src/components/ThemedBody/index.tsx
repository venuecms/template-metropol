import { getSite } from "@venuecms/sdk-next";
import { ThemeProvider } from "next-themes";
import {
  Cardo,
  EB_Garamond,
  Hanken_Grotesk,
  IBM_Plex_Mono,
  Inter,
  Jost,
  Open_Sans,
  Rethink_Sans,
  Schibsted_Grotesk,
} from "next/font/google";
import { ReactNode } from "react";

import { templateConfigOf } from "@/lib/utils/templateConfig";

import {
  FILTERABLE_IMAGE_CLASS,
  HELD_FILTER_CLASS,
} from "@/components/VenueImage";

import { buildThemeColorOverrideCss } from "./colors";
import { buildTextCaseCss } from "./textCase";
import { themeIdOf } from "./theme";
import { buildTypeScaleCss } from "./typeScale";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["500", "800"],
  display: "swap",
});

const SchibstedGrotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const HankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  display: "swap",
});

const IBMPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "500"],
  display: "swap",
});

const OpenSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "500"],
  display: "swap",
});

const RethinkSans = Rethink_Sans({
  subsets: ["latin"],
  display: "swap",
});

const cardo = Cardo({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const ThemeFonts = {
  Inter: inter.style,
  EB_Garamond: ebGaramond.style,
  Schibsted_Grotesk: SchibstedGrotesk.style,
  Hanken_Grotesk: HankenGrotesk.style,
  jost: jost.style,
  IBM_Plex_Mono: IBMPlexMono.style,
  Open_Sans: OpenSans.style,
  Rethink_Sans: RethinkSans.style,
  Cardo: cardo.style,
  default: SchibstedGrotesk.style,
  custom: { fontFamily: "custom" },
};

/**
 * The duotone image filter for listing images, on by default and switched off
 * by `imageDuotone: false` in the template config. It reaches only images
 * that opt in through VenueImage's `filter`: the cards in a listing. Each image goes grayscale, then a layer of the tint color (`--tint`, the primary color unless a site picks
 * its own) is
 * screened over it: black takes the tint, white stays white, and
 * the grays between run from one to the other. Being CSS, it follows the
 * theme and any color override with no image processing.
 *
 * Hovering an image fades it back to full color — only where a pointer can
 * hover, so a tap on a touch screen doesn't leave it stuck in color — and the
 * fade is skipped for readers who ask for reduced motion. An image marked
 * with VenueImage's `holdFilter` keeps its tint instead: one with text set
 * over it, such as a featured event.
 *
 * Screen lightens towards white, so the effect suits light themes; on a dark
 * one the highlights still come out white rather than the theme's background.
 */
const imageDuotoneCss = `
  .${FILTERABLE_IMAGE_CLASS} img { filter: grayscale(1) contrast(1.1); }
  .${FILTERABLE_IMAGE_CLASS}::after {
    content: "";
    position: absolute;
    inset: 0;
    background: hsla(var(--tint));
    mix-blend-mode: screen;
    pointer-events: none;
  }
  @media (hover: hover) {
    .${FILTERABLE_IMAGE_CLASS}:not(.${HELD_FILTER_CLASS}):hover img { filter: none; }
    .${FILTERABLE_IMAGE_CLASS}:not(.${HELD_FILTER_CLASS}):hover::after { opacity: 0; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .${FILTERABLE_IMAGE_CLASS} img { transition: filter 400ms ease; }
    .${FILTERABLE_IMAGE_CLASS}::after { transition: opacity 400ms ease; }
  }
`;

export const ThemedBody = async ({ children }: { children: ReactNode }) => {
  const { data: site } = await getSite();

  const templateConfig = templateConfigOf(site);

  const themeId = themeIdOf(templateConfig);
  const fontName =
    typeof templateConfig.fontName === "string"
      ? templateConfig.fontName
      : "default";
  const colorOverrideCss = buildThemeColorOverrideCss(templateConfig, themeId);
  // On unless a site switches it off: a site that never saved the setting has
  // no value for it, and the schema's default only reaches the settings form.
  const imageDuotone = templateConfig.imageDuotone !== false;
  const textCaseCss = buildTextCaseCss(templateConfig);
  const typeScaleCss = buildTypeScaleCss(templateConfig);
  const fontStyle =
    ThemeFonts[fontName as keyof typeof ThemeFonts] ?? ThemeFonts.default;

  return (
    <ThemeProvider attribute="class" forcedTheme={themeId}>
      {/* Hoisted into <head> by React so the site's colors land with the rest
          of the stylesheets rather than flashing in mid-body. */}
      {colorOverrideCss && (
        <style href="venue-theme-colors" precedence="high">
          {colorOverrideCss}
        </style>
      )}
      {/* Applied to <body> rather than only the wrapper div so content that
          portals to document.body (e.g. the mobile nav dialog) inherits it. */}
      <style href="venue-theme-font" precedence="high">
        {`body { font-family: ${fontStyle.fontFamily}; }`}
      </style>
      {textCaseCss && (
        <style href="venue-text-case" precedence="high">
          {textCaseCss}
        </style>
      )}
      {typeScaleCss && (
        <style href="venue-type-scale" precedence="high">
          {typeScaleCss}
        </style>
      )}
      {imageDuotone && (
        <style href="venue-image-duotone" precedence="high">
          {imageDuotoneCss}
        </style>
      )}
      <div className="flex min-h-screen flex-col" style={fontStyle}>
        {fontName === "custom" && site && (
          <style>
            {`
              @font-face {
                font-family: 'custom';
                src: url('/media/sites/${site.id}/fonts/custom.woff2') format('woff2');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
              }
            `}
          </style>
        )}
        {children}
      </div>
    </ThemeProvider>
  );
};
