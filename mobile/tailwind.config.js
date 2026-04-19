module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#EB4898",
        nexus: {
          pink: "#EB4898",
          blue: "#007AFF",
          black: "#000000",
        }
      }
    },
  },
  plugins: [],
};
