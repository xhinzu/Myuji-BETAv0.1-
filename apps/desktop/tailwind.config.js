/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          elevated: 'var(--color-bg-elevated)',
        },
        border: {
          base: 'var(--color-border-base)',
          subtle: 'var(--color-border-subtle)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          active: 'var(--color-accent-active)',
          glow: 'var(--color-accent-glow)',
        },
        lyric: {
          active: 'var(--color-lyric-active)',
          inactive: 'var(--color-lyric-inactive)',
          highlight: 'var(--color-lyric-highlight)',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius-base)',
      },
      fontFamily: {
        sans: 'var(--font-ui)',
      },
    },
  },
  plugins: [],
};

