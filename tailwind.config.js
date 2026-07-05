/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // All colors resolve through CSS variables (RGB triplets set in
      // index.css) so the .dark class can swap the whole palette at once.
      colors: {
        cream: 'rgb(var(--c-cream) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          hover: 'rgb(var(--c-accent-hover) / <alpha-value>)',
          soft: 'rgb(var(--c-accent-soft) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          soft: 'rgb(var(--c-ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--c-ink-faint) / <alpha-value>)',
        },
        line: 'rgb(var(--c-line) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Iowan Old Style"', 'Palatino', 'Georgia', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(43,38,34,0.04), 0 4px 16px rgba(43,38,34,0.06)',
        pop: '0 8px 30px rgba(43,38,34,0.14)',
      },
    },
  },
  plugins: [],
}
