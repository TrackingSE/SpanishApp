/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#f4f1e9',
          card: '#fbf9f3',
          dark: '#ece7da',
        },
        ink: {
          50: '#f4f1e9',
          100: '#e9e3d4',
          200: '#ddd6c4',
          300: '#c7bfa9',
          400: '#a9a088',
          500: '#857c64',
          600: '#665e49',
          700: '#4f4838',
          800: '#3a3529',
          900: '#232019',
        },
        rust: {
          100: '#efd9d2',
          500: '#b9543f',
          600: '#a23b2c',
          700: '#83301f',
        },
        moss: {
          100: '#dde6d3',
          500: '#5d7f4f',
          600: '#4a6b3f',
          700: '#3a5531',
        },
        ochre: {
          100: '#efe2c7',
          500: '#b5832b',
          600: '#9a6b1f',
          700: '#7c5417',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Spectral', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        notebook: '3px 3px 0 0 rgba(35,32,25,0.07)',
        'notebook-sm': '2px 2px 0 0 rgba(35,32,25,0.06)',
      },
    },
  },
  plugins: [],
};
