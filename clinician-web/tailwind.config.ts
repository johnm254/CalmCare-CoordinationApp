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
          bg:          '#F5EFE3',
          card:        '#FFFFFF',
          'card-alt':  '#EDE8DF',
          'card-high': '#E8E0D4',
          border:      '#D6CFC4',
          'border-lt': '#E8E0D4',
          primary:     '#1F7A72',
          'primary-h': '#12383A',
          'primary-m': '#CFE0D8',
          success:     '#1F7A72',
          warning:     '#F1C76B',
          danger:      '#C8102E',
          info:        '#1F7A72',
          text:        '#0C1F20',
          secondary:   '#3A5255',
          muted:       '#6B8588',
          coral:       '#E8603C',
          'coral-dim': 'rgba(232,96,60,0.10)',
          honey:       '#F1C76B',
          'honey-dim': 'rgba(241,199,107,0.15)',
          sage:        '#CFE0D8',
          guardian:    '#12383A',
          sos:         '#C8102E',
          hero:        '#12383A',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        sm:        '0 1px 4px rgba(12,31,32,0.04)',
        md:        '0 4px 12px rgba(12,31,32,0.06)',
        lg:        '0 8px 24px rgba(12,31,32,0.08)',
        glow:      '0 0 24px rgba(31,122,114,0.22)',
        'glow-sm': '0 0 12px rgba(31,122,114,0.16)',
        card:      '0 4px 24px rgba(12,31,32,0.07)',
        'card-lg': '0 8px 40px rgba(12,31,32,0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
