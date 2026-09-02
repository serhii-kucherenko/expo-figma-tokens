import { Text as RNText, type TextProps } from "react-native";

const variants = {
  display: "text-display font-bold text-text",
  title: "text-xl font-semibold text-text",
  body: "text-base text-text",
  label: "text-sm font-medium text-text",
  muted: "text-sm text-muted",
} as const;

export type TextVariant = keyof typeof variants;

export function Text({ variant = "body", className = "", ...props }: TextProps & { variant?: TextVariant }) {
  return <RNText className={`${variants[variant]} ${className}`} {...props} />;
}
