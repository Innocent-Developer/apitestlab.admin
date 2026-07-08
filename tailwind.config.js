/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#0A0E14',
        surface: '#10161F',
        'surface-hover': '#161D29',
        border: '#1E2733',
        primary: '#E4E9F0',
        muted: '#6B7785',
        pulse: '#5EEAD4',
        warn: '#F5A623',
        danger: '#F0506E',
        info: '#6C8EF5',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
