import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:          '#04030D',
          card:        '#0C0A1E',
          'card-alt':  '#131029',
          'card-high': '#1A1835',
          border:      '#1E1B38',
          'border-lt': '#2C2952',
          primary:     '#7B35FA',
          'primary-h': '#9B69FF',
          'primary-m': '#2A1760',
          success:     '#00D97E',
          warning:     '#FFB020',
          danger:      '#F43F5E',
          info:        '#4A8AFF',
          text:        '#EDE8FF',
          secondary:   '#9490BF',
          muted:       '#504875',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(123, 53, 250, 0.25)',
        'glow-sm': '0 0 12px rgba(123, 53, 250, 0.18)',
        card: '0 4px 24px rgba(0, 0, 0, 0.45)',
        'card-lg': '0 8px 40px rgba(0, 0, 0, 0.55)',
      },
    },
  },
  plugins: [],
};

export default config;
