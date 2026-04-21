// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}", // Root directory
    "./src/**/*.{js,ts,jsx,tsx}", // src directory
    "./components/**/*.{js,ts,jsx,tsx}", // components directory
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}