"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * A box filling the rest of the screen below where it starts, leaving a gap
 * under it as wide as the page's side padding (`px-6`, `sm:px-12` on <body>).
 *
 * Where it starts depends on the header above it, whose height is set by its
 * content rather than fixed, so the box measures its own offset from the top
 * of the page once it has rendered and again on resize. Until then it assumes
 * a header of 5rem, the desktop header's minimum, so the server render is
 * close and the correction is small.
 *
 * `fromTop` off sizes the box to the screen less the gap above and below, for
 * a featured event further down that does not start under the header.
 */
export const FillScreen = ({
  children,
  className,
  fromTop = true,
}: {
  children: ReactNode;
  className?: string;
  fromTop?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !fromTop) return;

    const measure = () => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      element.style.setProperty("--fill-top", `${top}px`);
    };

    measure();
    window.addEventListener("resize", measure);

    return () => window.removeEventListener("resize", measure);
  }, [fromTop]);

  return (
    <div
      ref={ref}
      className={cn(
        // The gap is the body's side padding, so the bottom margin matches.
        // svh, so a phone's collapsing toolbar doesn't make it jump.
        fromTop
          ? "h-[calc(100svh-var(--fill-top,5rem)-1.5rem)] sm:h-[calc(100svh-var(--fill-top,5rem)-3rem)]"
          : "h-[calc(100svh-3rem)] sm:h-[calc(100svh-6rem)]",
        // Never so short on a landscape phone that the title cannot fit.
        "min-h-80",
        className,
      )}
    >
      {children}
    </div>
  );
};
