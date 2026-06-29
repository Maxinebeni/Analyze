/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ambi: {
          bg:      '#EFF4FF',
          surface: '#FFFFFF',
          border:  '#D8E3F5',
          border2: '#B8CDE8',
          text:    '#0D1F45',
          muted:   '#6B7A94',
          green:   '#5DB840',
          green2:  '#3F9020',
          navy:    '#0D1F45',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
