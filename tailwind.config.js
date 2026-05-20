/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       'var(--color-bg)',
        surface:  'var(--color-surface)',
        surface2: 'var(--color-surface2)',
        border:   'var(--color-border)',
        fg:       'var(--color-fg)',
        accent:   'var(--color-accent)',
        accent2:  'var(--color-accent2)',
        muted:    'var(--color-muted)',
        push: '#ff6b35', pull: '#4ecdc4', legs: '#a855f7',
        upper: '#3b82f6', lower: '#f59e0b', full: '#e8ff47',
      },
      fontFamily: {
        heading: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '2px', sm: '1px', md: '2px', lg: '4px' },
    },
  },
  plugins: [],
};
