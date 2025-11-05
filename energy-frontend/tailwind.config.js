/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkteal: {
          50: '#e6f7f7',
          100: '#b3ebeb',
          200: '#80dfdf',
          300: '#4dd3d3',
          400: '#26c7c7',
          500: '#00baba',
          600: '#009292',
          700: '#006969',
          800: '#004141',
          900: '#001818',
        },
        darkblue: {
          50: '#e9f0fb',
          100: '#c6d5f3',
          200: '#a2baeb',
          300: '#7e9fe3',
          400: '#5b84db',
          500: '#426ac2',
          600: '#33529a',
          700: '#243a72',
          800: '#15224a',
          900: '#070a23',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 14px rgba(0,0,0,0.08)',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #004141, #243a72)',
        'gradient-blue': 'linear-gradient(135deg, #007bff, #00baba)',
      },
    },
  },
  plugins: [],
}
