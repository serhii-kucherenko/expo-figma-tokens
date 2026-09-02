import { Text as RNText, type TextProps } from "react-native";

// Roles read off the Figma design (node 2:67). One place to change when the type scale moves.
const variants = {
  title: "font-semibold text-28 text-text-primary", // Header "Settings"
  status: "font-semibold text-15 text-text-primary", // Status bar clock
  eyebrow: "text-13 tracking-[1.04px] text-text-secondary", // "APPEARANCE"
  body: "text-16 text-text-primary", // Row label
  value: "text-14 text-text-secondary", // Row value
  chevron: "text-18 text-text-tertiary",
  option: "text-13 text-text-secondary", // Theme option label
  optionActive: "font-semibold text-13 text-primary",
  stat: "font-semibold text-22",
  statLabel: "text-12 text-text-secondary",
  tabIcon: "text-20",
  tabLabel: "text-10",
} as const;

export type TextVariant = keyof typeof variants;

export function Text({ variant = "body", className = "", ...props }: TextProps & { variant?: TextVariant }) {
  return <RNText className={`font-sans ${variants[variant]} ${className}`} {...props} />;
}
