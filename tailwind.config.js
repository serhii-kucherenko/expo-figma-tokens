// ponytail: reads tokens/tokens.json directly - no extra generated file to keep in sync.
const tokens = require("./tokens/tokens.json");

const group = (name) =>
  Object.fromEntries(
    Object.entries(tokens.collections.primitives.variables)
      .filter(([k]) => k.startsWith(name + "/"))
      .map(([k, v]) => [k.split("/")[1], v.value])
  );

const colors = Object.fromEntries(
  Object.keys(tokens.collections.theme.variables)
    .filter((k) => k.startsWith("color/"))
    .map((k) => [k.split("/")[1], `var(--color-${k.split("/")[1]})`])
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      borderRadius: group("radius"),
      spacing: group("space"),
      fontSize: group("text"),
      fontFamily: {
        sans: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
      },
    },
  },
  plugins: [],
};
