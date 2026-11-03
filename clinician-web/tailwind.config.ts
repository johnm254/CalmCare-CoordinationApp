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
          bg:          '#F6F9FC',
          card:        '#FFFFFF',
          'card-alt':  '#F1F5FA',
          'card-high': '#EEF3F9',
          border:      '#E6ECF2',
          'border-lt': '#EEF3F9',
          primary:     '#14B8A6',
          'primary-h': '#0D9488',
          'primary-m': '#CCFBEF',
          success:     '#22C08A',
          warning:     '#FFC24B',
          danger:      '#EF4444',
          info:        '#4A8AFF',
          text:        '#0F1B2D',
          secondary:   '#5B6B7F',
          muted:       '#8C9AAB',
          iris:        '#6C63FF',
          'iris-dim':  '#F1F0FF',
          coral:       '#FF6B4A',
          'coral-dim': '#FFF2EF',
          amber:       '#FFC24B',
          'amber-dim': '#FFF4D6',
          hero:        '#0F1B2D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sm:      '0 1px 4px rgba(15,27,45,0.04)',
        md:      '0 4px 12px rgba(15,27,45,0.06)',
        lg:      '0 8px 24px rgba(15,27,45,0.08)',
        glow:    '0 0 24px rgba(20,184,166,0.22)',
        'glow-sm': '0 0 12px rgba(20,184,166,0.16)',
        card:    '0 4px 24px rgba(15,27,45,0.07)',
        'card-lg': '0 8px 40px rgba(15,27,45,0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
