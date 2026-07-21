/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        // Source Serif 4 = renamed Source Serif Pro; Inter for UI/chat
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // From peoplesarchive.ke (uicore / Elementor tokens)
        ink: {
          50: '#F1F6EF',   // uicore_light
          100: '#e4ece0',
          200: '#c8d6c4',
          300: '#9aaf96',
          400: '#6b8770',
          500: '#4a6654',
          600: '#354d3f',
          700: '#1e3a42',
          800: '#0B252E',  // uicore_dark / headline
          900: '#0B252E',
          950: '#0B0B0B',
        },
        leaf: {
          400: '#4FD965',  // uicore_primary
          500: '#3FAE51',  // uicore_secondary
          700: '#095C34',
        },
        ember: {
          400: '#FF9D4C',  // uicore_accent
          500: '#C5502D',  // PA terracotta / orange hero
          600: '#a3481c',
        },
        // Solid PA section greens (no gradients)
        forest: {
          DEFAULT: '#095C34',
          deep: '#0B252E',
        },
        cream: {
          DEFAULT: '#F1F6EF',
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          800: '#292524',
          900: '#1c1917',
        }
      },
      keyframes: {
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'insight-pop': {
          '0%': { opacity: '0', transform: 'scale(0.86) translateY(8px)' },
          '70%': { opacity: '1', transform: 'scale(1.03) translateY(0)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.7s ease-out both',
        float: 'float 5s ease-in-out infinite',
        'float-slow': 'float 7s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 1s infinite',
        'insight-pop': 'insight-pop 0.55s cubic-bezier(0.22, 1.2, 0.36, 1) both',
      },
    }
  },
  plugins: [],
}
