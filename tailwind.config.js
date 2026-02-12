/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "text-disabled": "#C8C8C8",
        "text-secondary": "#595959",
        brand: {
          50: "#F5F9FE",
          100: "#D8E6FD",
        },
        grey: {
          500: "#D0D0D0",
          grey110: "#8A8886",
          white7: "#F4F4F4",
        },
        status: {
          green: "#10B070",
          grey: "#605E5C",
        },
        theme: {
          primary: "#176df3",
        },
        border: {
          primary: "#dadada",
        },
        tertiary: "#898989",
        neutral: {
          dark: "#201F1E",
          light: "#edebe9",
          lighter: "#f3f2f1",
          quaternaryAlt: "#E1DFDD",
          secondary: "#605E5C",
          tertiaryAlt: "#C8C6C4",
        },
        separator: "#EDEBE9",
      },
      screens: {
        mobile: { max: "640px" },
        tablet: { max: "1080px" },
        desktop: { min: "1081px" },
      },
      flex: {
        "1-0-auto": "1 0 auto",
      },
    },
  },
  plugins: [],
};
