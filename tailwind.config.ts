import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14171C',       // app background
        'ink-soft': '#1D2129', // raised surfaces on dark bg
        paper: '#FBF8F2',      // card surface (index card)
        'paper-dim': '#F0ECE2',
        graphite: '#5B5F6B',   // secondary text
        line: '#DFDACE',       // hairline borders on paper
        profit: '#1F7A4D',     // buy / profit signal
        'profit-soft': '#E6F0EA',
        risk: '#B23A2F',       // pass / risk signal
        'risk-soft': '#F6E7E4',
        caution: '#C98A2C',    // negotiate / caution signal
        'caution-soft': '#F5EBDA',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        card: '3px',
      },
    },
  },
  plugins: [],
};

export default config;
