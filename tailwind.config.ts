import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "glitch-hover": {
          "0%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
          "100%": { transform: "translate(0)" },
        },
        "sparkle": {
          "0%": { opacity: "1", transform: "scale(0)" },
          "50%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.5)" },
        },
        "fire-main": {
          "0%, 100%": { transform: "translateX(-0.5px) scale(1)" },
          "50%": { transform: "translateX(0.5px) scale(1.1)" },
        },
        "fire-left": {
          "0%, 100%": { transform: "translate(-1px, 0) scale(1.1)" },
          "50%": { transform: "translate(0, -1px) scale(0.9)" },
        },
        "fire-right": {
          "0%, 100%": { transform: "translate(1px, 0) scale(1.1)" },
          "50%": { transform: "translate(0, -1px) scale(0.9)" },
        },
        "spark": {
          "0%": { transform: "translate(0, 0) scale(1)", opacity: "1" },
          "50%": { transform: "translate(calc(random() * 20px - 10px), -20px) scale(0.5)", opacity: "0.5" },
          "100%": { transform: "translate(calc(random() * 40px - 20px), -40px) scale(0)", opacity: "0" },
        },
      },
      animation: {
        "glitch-hover": "glitch-hover 0.3s ease-in-out",
        "sparkle": "sparkle 0.8s ease-in-out forwards",
        "fire-main": "fire-main 2s ease-in-out infinite",
        "fire-left": "fire-left 1.5s ease-in-out infinite",
        "fire-right": "fire-right 1.5s ease-in-out infinite",
        "spark": "spark 2s ease-out infinite",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
