/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#ffffff",
        ink: "#3c4043",
        accent: "#1a73e8",
        accentSoft: "#e8f0fe",
        chrome: "#f8f9fa",
        hover: "#e8eaed",
        workspace: "#f0f4f9",
      },
      boxShadow: {
        paper: "0 1px 3px rgba(60, 64, 67, 0.16), 0 4px 8px rgba(60, 64, 67, 0.08)",
      },
      fontFamily: {
        sans: ["Google Sans", "Roboto", "Arial", "sans-serif"],
        display: ["Google Sans", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
