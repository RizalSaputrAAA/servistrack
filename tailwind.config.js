/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213D",
        paper: "#F4F6F4",
        brand: { DEFAULT: "#0F766E", dark: "#115E59", soft: "#CCFBF1" },
      },
    },
  },
  plugins: [],
};
