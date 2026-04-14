import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        amber: {
          DEFAULT: '#f5a623',
          dim: '#9a660f',
          glow: 'rgba(245,166,35,0.12)',
        },
        terminal: {
          base: '#080810',
          panel: '#0f0f1a',
          elevated: '#161625',
          input: '#12121e',
          border: '#2a2a40',
          subtle: '#1e1e2e',
        },
        status: {
          pending: '#f5a623',
          executed: '#22c55e',
          cancelled: '#6b7280',
          rejected: '#ef4444',
        },
        text: {
          primary: '#e8e8f0',
          secondary: '#8888aa',
          muted: '#444466',
        },
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
        xl: '6px',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
