import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',            // page background - true black, OLED-style depth
        'ink-soft': '#1C1C1E',      // solid raised surface (inputs, secondary chips)
        'ink-elevated': '#2C2C2E',  // hover/active state on raised surfaces
        paper: '#F5F5F7',           // primary text on dark + solid light CTA fill
        'paper-dim': '#E5E5EA',     // solid light secondary-button fill
        graphite: '#98989D',        // secondary/tertiary text
        line: 'rgba(255,255,255,0.12)', // hairline border on glass surfaces
        profit: '#30D158',          // buy / profit signal
        'profit-soft': 'rgba(48,209,88,0.16)',
        risk: '#FF453A',            // pass / risk signal
        'risk-soft': 'rgba(255,69,58,0.16)',
        caution: '#FF9F0A',         // negotiate / caution signal
        'caution-soft': 'rgba(255,159,10,0.16)',
        accent: '#0A84FF',          // links, focus ring
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        control: '14px',
      },
      backdropBlur: {
        card: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
