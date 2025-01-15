import flowbite from 'flowbite-react/tailwind'
import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
    flowbite.content()
  ],
  theme: {
    extend: {
      colors: {
        current: 'currentColor',
        primary: colors.green,
        secondary: {
          50: '#EBE6FE',
          100: '#D8CEFD',
          200: '#B19CFC',
          300: '#8A6BFA',
          400: '#7A58F3',
          500: '#714CF9',
          600: '#3007C5',
          700: '#240594',
          800: '#180363',
          900: '#0C0231'
        },
        neutral: {
          50: '#FFFFFF',
          100: '#F6F6F6',
          200: '#E9E9E9',
          300: '#D8D8D8',
          400: '#E3E3E3',
          500: '#C6C6C6',
          600: '#B4B4B4',
          700: '#8D8D8D',
          800: '#363636',
          900: '#272727',
          1000: '#191B1E',
          1100: '#0C0C0C'
        },
        information: {
          50: '#EDFBFE',
          100: '#D5F6FE',
          200: '#B3F0FC',
          300: '#8FE8FB',
          400: '#6EE1FA',
          500: '#4EDBF9',
          600: '#42BAD4',
          700: '#379BB1',
          800: '#2C7D8E',
          900: '#236370'
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F'
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#F87171',
          400: '#EF4444',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D'
        },
        green: {
          50: '#EBFAF5',
          100: '#D6F5EB',
          200: '#ADEBD6',
          300: '#85E0C2',
          400: '#5CD6AD',
          500: '#33CC99',
          600: '#29A37A',
          700: '#1F7A5C',
          800: '#14523D',
          900: '#0A291F'
        },
        purple: colors.secondary,
        cyan: colors.information,
        yellow: colors.warning,
        red: colors.error,
        gray: colors.neutral
      },
      screens: {
        mobile: '430px',
        tablet: '768px',
        laptop: '1280px',
        desktop: '1512px'
      },
      animation: {
        appear: 'appear 0.2s linear'
      },
      keyframes: {
        appear: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        }
      }
    }
  },
  plugins: [flowbite.plugin()]
}
