import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Barlow Condensed", "sans-serif"],
        sans:    ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono:    ["IBM Plex Mono", "monospace"],
        serif:   ["EB Garamond", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "var(--radius)",
        sm: "var(--radius-sm)",
        pill: "var(--radius-pill)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        /* Blue accent — homepage / broadcast */
        blue: {
          DEFAULT: "var(--blue)",
          dark:    "var(--blue-dark)",
          subtle:  "var(--blue-subtle)",
          bg:      "var(--blue-bg)",
        },

        /* Olive accent scale */
        olive: {
          DEFAULT: "var(--olive)",
          dark:    "var(--olive-dark)",
          light:   "var(--olive-light)",
          subtle:  "var(--olive-subtle)",
          mid:     "var(--olive-mid)",
        },

        /* Ink neutrals */
        ink: {
          DEFAULT: "var(--ink)",
          soft:    "var(--ink-soft)",
          muted:   "var(--ink-muted)",
          faint:   "var(--ink-faint)",
        },

        /* Paper surfaces */
        paper: {
          DEFAULT: "var(--paper)",
          warm:    "var(--paper-warm)",
          cool:    "var(--paper-cool)",
          border:  "var(--paper-border)",
        },

        /* Legacy alias so existing navy-* classes don't break */
        navy: {
          DEFAULT: "var(--olive)",
          dark:    "var(--olive-dark)",
          light:   "var(--olive-light)",
        },

        card: {
          DEFAULT:    "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT:    "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT:    "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT:    "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT:    "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT:    "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT:    "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input:  "var(--input)",
        ring:   "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT:              "var(--sidebar-background)",
          foreground:           "var(--sidebar-foreground)",
          primary:              "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent:               "var(--sidebar-accent)",
          "accent-foreground":  "var(--sidebar-accent-foreground)",
          border:               "var(--sidebar-border)",
          ring:                 "var(--sidebar-ring)",
        },
      },
      transitionTimingFunction: {
        "default":  "var(--ease-default)",
        "entrance": "var(--ease-entrance)",
        "exit":     "var(--ease-exit)",
        "spring":   "var(--ease-spring)",
      },
      transitionDuration: {
        "fast": "var(--duration-fast)",
        "base": "var(--duration-base)",
        "slow": "var(--duration-slow)",
      },
      boxShadow: {
        "card": "var(--shadow-card)",
        "md":   "var(--shadow-md)",
        "lg":   "var(--shadow-lg)",
      },
      maxWidth: {
        "editorial": "var(--container-editorial)",
        "site":      "var(--container-max)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "live-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.25" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "live-pulse":     "live-pulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
