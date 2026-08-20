import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0D0D0D',
        panel: '#171410',
        accent: '#D9A55F',
        accentSoft: '#F5D39A',
        ink: '#F4EDE3',
        muted: '#C2B7A3',
        border: '#2A241F',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(217,165,95,0.25), 0 18px 40px rgba(0,0,0,0.35)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
      },
      backgroundImage: {
        'hero-noise': 'radial-gradient(circle at top, rgba(217,165,95,0.12), transparent 32%)',
      },
    },
  },
  plugins: [],
};

export default config;
