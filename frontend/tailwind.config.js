/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        diavise: {
          night: '#050816',
          panel: '#0b1020',
          cyan: '#22d3ee',
          blue: '#60a5fa',
          emerald: '#34d399',
          violet: '#a78bfa',
          amber: '#fbbf24',
        },
      },
      boxShadow: {
        glowCyan: '0 24px 80px rgba(34, 211, 238, 0.18)',
        glowEmerald: '0 24px 80px rgba(52, 211, 153, 0.16)',
        glass: '0 28px 80px rgba(2, 6, 23, 0.28)',
      },
    },
  },
  plugins: [],
};
