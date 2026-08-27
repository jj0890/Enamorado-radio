import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["IBM Plex Mono", "monospace"],
        serif: ["Playfair Display", "serif"],
        crimson: ["Crimson Text", "Crimson Pro", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: {
          50: "var(--cream-50)",
          100: "var(--cream-100)",
          200: "var(--cream-200)",
          300: "var(--cream-300)",
          400: "var(--cream-400)",
        },
        charcoal: {
          100: "var(--charcoal-100)",
          200: "var(--charcoal-200)",
          300: "var(--charcoal-300)",
          400: "var(--charcoal-400)",
          500: "var(--charcoal-500)",
          600: "var(--charcoal-600)",
          700: "var(--charcoal-700)",
          800: "var(--charcoal-800)",
          900: "var(--charcoal-900)",
          950: "var(--charcoal-950)",
        },
        'burnt-orange': {
          100: "var(--burnt-orange-100)",
          300: "var(--burnt-orange-300)",
          400: "var(--burnt-orange-400)",
          500: "var(--burnt-orange-500)",
          600: "var(--burnt-orange-600)",
        },
        terracotta: {
          400: "var(--terracotta-400)",
          500: "var(--terracotta-500)",
        },
        olive: {
          400: "var(--olive-400)",
          500: "var(--olive-500)",
        },
        navy: {
          DEFAULT: '#1e2d4a',
          50: '#f0f3f8',
          100: '#dde5f0',
          200: '#b8cce0',
          300: '#89aacb',
          400: '#5a88b5',
          500: '#3a6899',
          600: '#2d547e',
          700: '#234263',
          800: '#1a3350',
          900: '#1e2d4a',
          950: '#0f1a2d',
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
