/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orca: {
          navy: '#001a3a',
          navyDark: '#001026',
          blue: '#0284c7',
          red: '#d90429',
          coral: '#ff4757',
          green: '#10b981',
          gold: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Anuphan', 'Kanit', 'sans-serif'],
      }
    },
  },
  safelist: [
    {
      pattern: /(bg|text|border|ring|shadow|from|to)-(sky|indigo|emerald|rose|amber|blue|cyan|purple|pink|red|green|yellow|teal)-(50|100|200|300|400|500|600|700|800|900|950)/,
      variants: ['hover', 'focus', 'group-hover'],
    },
  ],
  plugins: [],
}
