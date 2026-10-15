import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        notebook: {
          50: '#FBFBFA',
          100: '#F7F6F3',
          200: '#E9E7E2',
          300: '#D7D4CC',
          700: '#3F3E3A',
          800: '#252422',
          900: '#181716',
          950: '#0F0E0D',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        concept: {
          bg: 'rgba(59, 130, 246, 0.08)',
          border: 'rgba(59, 130, 246, 0.25)',
          text: '#3B82F6',
        },
        graphic: {
          bg: 'rgba(168, 85, 247, 0.08)',
          border: 'rgba(168, 85, 247, 0.25)',
          text: '#A855F7',
        },
        curiosity: {
          bg: 'rgba(234, 179, 8, 0.08)',
          border: 'rgba(234, 179, 8, 0.25)',
          text: '#EAB308',
        },
        free: {
          bg: 'rgba(16, 185, 129, 0.08)',
          border: 'rgba(16, 185, 129, 0.25)',
          text: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
