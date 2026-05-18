/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0d', surface: '#161616', surface2: '#1f1f1f',
        border: '#2a2a2a', accent: '#e8ff47', accent2: '#ff4747',
        muted: '#666666',
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
