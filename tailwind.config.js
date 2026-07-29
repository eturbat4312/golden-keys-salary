/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        mint: "#0f766e",
        coral: "#c2410c"
      }
    }
  },
  plugins: []
};
