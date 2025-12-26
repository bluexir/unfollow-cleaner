import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'farcaster-purple': '#633DFF',
        'farcaster-dark': '#1A1A2E',
        'farcaster-darker': '#0F0F1E',
      },
    },
  },
  plugins: [],
};

export default config;
