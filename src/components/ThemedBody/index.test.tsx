import type { Site } from "@venuecms/sdk-next";
import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSite = vi.fn();

vi.mock("@venuecms/sdk-next", () => ({ getSite: () => getSite() }));

// next/font/google is a compiler transform with no runtime outside a Next
// build, and next-themes only contributes the <html> class, which lives above
// the subtree rendered here.
vi.mock("next/font/google", () => {
  const font = () => ({ style: { fontFamily: "stub" } });

  return Object.fromEntries(
    [
      "Cardo",
      "EB_Garamond",
      "Hanken_Grotesk",
      "IBM_Plex_Mono",
      "Inter",
      "Jost",
      "Open_Sans",
      "Rethink_Sans",
      "Schibsted_Grotesk",
    ].map((name) => [name, font]),
  );
});
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

const { ThemedBody } = await import("./index");

const siteWithConfig = (config: Record<string, unknown>) =>
  ({
    id: "site-id",
    settings: { publicSite: { template: { config } } },
  }) as unknown as Site;

const render = async () => {
  const stream = await renderToReadableStream(<ThemedBody>{null}</ThemedBody>);
  await stream.allReady;

  return new Response(stream).text();
};

const renderWithConfig = async (config: Record<string, unknown>) => {
  getSite.mockResolvedValue({ data: siteWithConfig(config) });

  return render();
};

describe("ThemedBody", () => {
  beforeEach(() => {
    getSite.mockReset();
  });

  it("emits the site's color overrides as a stylesheet", async () => {
    const html = await renderWithConfig({
      themeId: "space",
      colorBackground: "#ffffff",
      colorPrimary: "#000000",
    });

    expect(html).toContain("--background: 0, 0%, 100%, 1;");
    expect(html).toContain("--primary: 0, 0%, 0%, 1;");
  });

  it("overrides the theme rather than replacing it", async () => {
    // Only the chosen variable is emitted, so every other color the theme
    // sets keeps applying.
    const html = await renderWithConfig({
      themeId: "space",
      colorNav: "#ff0000",
    });

    expect(html).toContain("--nav: 0, 100%, 50%, 1;");
    expect(html).not.toContain("--background");
    expect(html).not.toContain("--secondary");
  });

  it("pins the default theme's remaining colors to its light palette", async () => {
    // The default theme is the one that flips with the OS, so a lone override
    // would pair the site's background with the dark palette's text.
    const html = await renderWithConfig({
      themeId: "default",
      colorBackground: "#ffffff",
    });

    expect(html).toContain("--background: 0, 0%, 100%, 1;");
    expect(html).toContain("--primary: 50, 1%, 10%, 1;");
  });

  it("renders no color stylesheet when the site chose no colors", async () => {
    // An empty rule is still a rule; with nothing overridden the theme has to
    // be the only source of color. The font stylesheet is always there, so
    // this looks for the colors one by name.
    const html = await renderWithConfig({ themeId: "space" });

    expect(html).not.toContain("venue-theme-colors");
    expect(html).not.toContain(":root:root");
  });

  it("renders when the site has no template config at all", async () => {
    getSite.mockResolvedValue({ data: undefined });

    expect(await render()).not.toContain("venue-theme-colors");
  });

  // On <body>, not just the wrapper, so the mobile nav dialog — portalled to
  // document.body — renders in the site's font too.
  it("sets the theme font on the body", async () => {
    const html = await renderWithConfig({ themeId: "space" });

    expect(html).toMatch(/data-href="[^"]*venue-theme-font/);
    expect(html).toContain("body { font-family:");
  });

  // On by default: a site that never saved the setting has no value for it.
  it("tints images when the site has not set the duotone at all", async () => {
    const html = await renderWithConfig({ themeId: "space" });

    expect(html).toContain("venue-image-duotone");
  });

  it("leaves images alone when the duotone is switched off", async () => {
    const html = await renderWithConfig({
      themeId: "space",
      imageDuotone: false,
    });

    expect(html).not.toContain("venue-image-duotone");
  });

  it("tints images in the primary color when the duotone is on", async () => {
    const html = await renderWithConfig({
      themeId: "space",
      imageDuotone: true,
    });

    // React merges same-precedence stylesheets into one tag on the server, so
    // the name sits in a shared data-href.
    expect(html).toMatch(/data-href="[^"]*venue-image-duotone/);
    expect(html).toContain("background: hsla(var(--tint))");
    expect(html).toContain("mix-blend-mode: screen");
  });
});
