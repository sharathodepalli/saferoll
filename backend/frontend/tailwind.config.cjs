/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ring: {
          pilot: "#7dd3fc",
          five: "#a5b4fc",
          twentyfive: "#fbcfe8",
          all: "#fde68a",
        },
        status: {
          good: "#22c55e",
          warn: "#fbbf24",
          bad: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
