"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Slides its content up into place the first time it scrolls into view.
 *
 * Rendered visible, so a page without JavaScript, or a reader who prefers
 * reduced motion, sees the content as it is. Once mounted, content that is
 * still below the fold is held back — hidden, with every animation inside it
 * switched off — and released when it comes into view. Releasing restores the
 * animations, so they play from the start: the wrapper slides up and anything
 * inside with a staggered entrance (a grid's cards) plays it then too.
 *
 * Content already in view on mount is left alone; its animations have played.
 */
export const RevealOnScroll = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "held" | "shown">("idle");

  useEffect(() => {
    const element = ref.current;

    if (
      !element ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Already on screen: nothing to wait for.
    if (element.getBoundingClientRect().top < window.innerHeight) {
      return;
    }

    setState("held");

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState("shown");
          observer.disconnect();
        }
      },
      // Released a little before it is fully in, so the slide is seen.
      { rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        state === "held" && "opacity-0 [&_*]:!animate-none",
        state === "shown" && "animate-slide-up",
        className,
      )}
    >
      {children}
    </div>
  );
};
