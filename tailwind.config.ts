import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Oscilloscope theme colors
        phosphor: {
          cyan: '#00ffc8',
          green: '#39ff14',
          amber: '#ffb000',
        },
        oscilloscope: {
          bg: '#0a0f14',
          'bg-dark': '#050810',
          grid: 'rgba(0, 255, 200, 0.08)',
          border: 'rgba(0, 255, 200, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 255, 200, 0.3)',
        'glow-green': '0 0 20px rgba(57, 255, 20, 0.3)',
        'glow-amber': '0 0 20px rgba(255, 176, 0, 0.3)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'data-flow': 'dataFlow 3s linear infinite',
        'scan-down': 'scanDown 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        dataFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        scanDown: {
          '0%': { top: '-2px' },
          '100%': { top: '100%' },
        },
      },
    },
  },
  plugins: [],
}
export default config
