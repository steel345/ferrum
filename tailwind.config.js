/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mc: {
          bg:       '#060c18',
          deep:     '#040810',
          panel:    '#0b1525',
          sidebar:  '#08111f',
          border:   '#1a3050',
          hover:    '#112240',
          accent:   '#2563eb',
          'accent2':'#1d4ed8',
          glow:     '#3b82f6',
          text:     '#e2e8f0',
          muted:    '#64748b',
          dim:      '#94a3b8',
          green:    '#22c55e',
          red:      '#ef4444',
          yellow:   '#eab308',
          purple:   '#a855f7',
          orange:   '#f97316',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-sm': '0 0 8px rgba(37, 99, 235, 0.4)',
      },
    },
  },
  plugins: [],
}
