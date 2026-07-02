/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF9F5',
        surface: '#FFFFFF',
        accent: {
          DEFAULT: '#DA7756',
          hover: '#C86544',
          soft: '#F5E4DC',
        },
        ink: {
          DEFAULT: '#2B2622',
          soft: '#6B6259',
          faint: '#9A9187',
        },
        line: '#EAE6DE',
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
