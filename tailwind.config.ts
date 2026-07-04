import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#111827",
          foreground: "#F9FAFB",
        },
        accent: {
          DEFAULT: "#D97706",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        info: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },
        background: "#F9FAFB",
        card: "#FFFFFF",
        border: "#E5E7EB",
        // dark mode overrides consumed via CSS vars in globals.css
        surface: "hsl(var(--surface))",
        "surface-foreground": "hsl(var(--surface-foreground))",
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      spacing: {
        // 8-point spacing system
        "0.5": "4px",
        "1": "8px",
        "1.5": "12px",
        "2": "16px",
        "3": "24px",
        "4": "32px",
        "5": "40px",
        "6": "48px",
        "8": "64px",
        "10": "80px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-geist)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(17, 24, 39, 0.04), 0 1px 3px 0 rgba(17, 24, 39, 0.06)",
        card: "0 1px 3px 0 rgba(17, 24, 39, 0.05), 0 4px 12px -2px rgba(17, 24, 39, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
