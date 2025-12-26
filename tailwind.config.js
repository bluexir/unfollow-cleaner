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
        canvas: '#F2F0ED', // Kirli Beyaz Kağıt
        ink: '#111111',    // Karbon Siyah
        klein: '#002FA7',  // Elektrik Mavisi
        alert: '#FF3300',  // Neon Turuncu
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'], // Next.js default fontu üzerine bindiriyoruz
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px #111111',
        'hard-hover': '2px 2px 0px 0px #111111',
        'hard-active': '0px 0px 0px 0px #111111',
      },
    },
  },
  plugins: [],
};
export default config;
