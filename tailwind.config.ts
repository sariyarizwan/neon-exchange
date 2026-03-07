import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/mock/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#05060A",
          900: "#0A0E16",
          800: "#0F1622"
        },
        neon: {
          cyan: "#33F5FF",
          magenta: "#FF3DF2",
          lime: "#B7FF3C",
          amber: "#FFB84D"
        }
      },
      boxShadow: {
        "neon-cyan": "0 0 0 1px rgba(51,245,255,0.35), 0 0 24px rgba(51,245,255,0.18)",
        "neon-magenta": "0 0 0 1px rgba(255,61,242,0.3), 0 0 28px rgba(255,61,242,0.16)",
        panel: "0 20px 60px rgba(0, 0, 0, 0.35)"
      },
      animation: {
        flicker: "flicker 5s linear infinite",
        drift: "drift 12s linear infinite",
        pulseSoft: "pulseSoft 1.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
