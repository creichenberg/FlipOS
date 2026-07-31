import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Light, near-monochrome system: warm-gray canvas, white cards,
        // near-black for text/buttons, one gray for secondary text. Color
        // is reserved for exactly two things - profit and loss figures -
        // the same restraint as a single "verified" dot on an otherwise
        // black-and-white interface.
        canvas: '#F1EFEC',   // page background
        card: '#FFFFFF',      // card/sheet surface
        ink: '#121212',       // primary text + solid button fill
        graphite: '#8A8985',  // secondary/meta text
        line: 'rgba(18,18,18,0.08)', // hairline border, used sparingly
        profit: '#1E9E5C',    // profit figures only
        risk: '#DC4C4C',      // loss / pass signal only
      },
      fontFamily: {
        // One typeface, referenced under two names so existing
        // `font-display`/`font-body` usage keeps working without a
        // find-and-replace across every component.
        display: ['var(--font-body)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        control: '16px',
        card: '28px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(18,18,18,0.04), 0 12px 24px -8px rgba(18,18,18,0.10)',
        tight: '0 1px 2px rgba(18,18,18,0.06), 0 4px 10px -2px rgba(18,18,18,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
