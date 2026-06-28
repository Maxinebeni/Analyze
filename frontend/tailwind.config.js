/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gh: {
          bg:      '#0D1117',
          surface: '#161B22',
          border:  '#21262D',
          border2: '#30363D',
          text:    '#E6EDF3',
          muted:   '#7D8590',
          blue:    '#388BFD',
          green:   '#3FB950',
          green2:  '#238636',
          pink:    '#DB61A2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
