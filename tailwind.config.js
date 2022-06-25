/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/*.html'],
  theme: {
    screens: {
      sm: '640px',
      md: '640px',
      lg: '640px',
      xl: '640px',
      '2xl': '640px',
    },
    container: {
      center: true,
    },
    extend: {
      colors: {
      },
    },
  },
  plugins: [],
};

