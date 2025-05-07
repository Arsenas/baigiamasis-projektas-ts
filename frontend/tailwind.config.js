/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "815px", // nuo čia pradėsim rodyti 2 stulpelius
        xxl: "1350px", // nuo čia – 3 stulpeliai
      },

      animation: {
        "pulse-gradient": "gradientPulse 6s ease infinite",
      },
      keyframes: {
        gradientPulse: {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
        },
      },
      backgroundSize: {
        200: "200% 200%",
      },
    },
  },
  plugins: [],
};
