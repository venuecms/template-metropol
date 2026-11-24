import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "font-bold",
    "line-through",
    "underline",
    "italic",
    "hover:underline",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsla(var(--background))",
        card: "var(--card)",
        black: "hsla(var(--black))",
        highlight: "hsla(var(highlight))",
        primary: "hsla(var(--primary))",
        secondary: "hsla(var(--secondary))",
        muted: "hsla(var(--muted))",
        "text-3": "hsla(var(--text-3))",
        nav: "hsla(var(--nav))",
        tint: "hsla(var(--tint))",
        "button-background": "hsla(var(--button-background))",
        error: "hsla(var(--error))",
        overlay: "hsla(var(--overlay))",
        "footer-background": "hsla(var(--footer-background))",
        "panel-background": "hsla(var(--panel-background))",
        "panel-background-2": "hsla(var(--panel-background-2))",
      },
      // Fluid sizes from the scale in globals.css. Line heights are unitless
      // so they track the size as it grows, tightening as the type gets larger.
      fontSize: {
        xxs: ["var(--xxs)", "1.5"],
        xs: ["var(--xs)", "1.5"],
        sm: ["var(--sm)", "1.5"],
        md: ["var(--md)", "1.4"],
        lg: ["var(--lg)", "1.3"],
        xl: ["var(--xl)", "1.2"],
        xxl: ["var(--xxl)", "1.1"],
        xxxl: ["var(--xxxl)", "1.05"],
      },
      fontWeight: {
        light: "300",
        regular: "500",
      },
      keyframes: {
        "slide-up": {
          from: { opacity: "0", transform: "translateY(1.5rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        // `both` holds the hidden start frame through any animation-delay, so
        // staggered items don't flash in before their turn.
        "slide-up": "slide-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
};
