/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        phosphor: {
          cyan: '#00ffc8',
          green: '#39ff14',
          amber: '#ffb000',
        },
        oscilloscope: {
          bg: '#0a0f14',
          bgDark: '#050810',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
