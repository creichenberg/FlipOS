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
        canvas: '#F1EFEC', // page background
        card: '#FFFFFF', // card/sheet surface
        ink: '#121212', // primary text + solid button fill
        'ink-soft': '#5C5B57', // body copy that shouldn't compete with headings
        graphite: '#8A8985', // secondary/meta text
        line: 'rgba(18,18,18,0.08)', // hairline border, used sparingly
        profit: '#137F46', // profit figures only
        'profit-wash': '#E8F3EC', // tinted fill behind profit stats
        risk: '#C43D3D', // loss / pass signal only
        'risk-wash': '#FBEAEA', // tinted fill behind risk callouts
      },
      fontFamily: {
        // One typeface, referenced under two names so existing
        // `font-display`/`font-body` usage keeps working without a
        // find-and-replace across every component.
        display: ['var(--font-body)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      fontSize: {
        // Display sizes for the numbers that matter (profit, score). The
        // whole point of the app is "how much can I make" - that figure
        // should read from across the room, not match the body copy.
        figure: ['2.25rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '800' }],
        'figure-lg': ['3.25rem', { lineHeight: '0.95', letterSpacing: '-0.035em', fontWeight: '800' }],
        display: ['2rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'display-lg': ['2.75rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        control: '16px',
        card: '28px',
        sheet: '32px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(18,18,18,0.04), 0 12px 24px -8px rgba(18,18,18,0.10)',
        tight: '0 1px 2px rgba(18,18,18,0.06), 0 4px 10px -2px rgba(18,18,18,0.08)',
        lift: '0 2px 4px rgba(18,18,18,0.05), 0 20px 40px -12px rgba(18,18,18,0.16)',
      },
      keyframes: {
        'card-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.25)', opacity: '0' },
          '100%': { transform: 'scale(1.25)', opacity: '0' },
        },
      },
      animation: {
        'card-in': 'card-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
