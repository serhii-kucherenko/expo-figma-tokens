import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import { Text } from "./Text";

const base = "flex-row items-center justify-center gap-2 rounded-md border px-5 py-3";

const variants = {
  primary: "bg-primary border-primary",
  secondary: "bg-surface border-border",
  ghost: "bg-transparent border-transparent",
  danger: "bg-danger border-danger",
} as const;

const labels = {
  primary: "text-primary-fg",
  secondary: "text-text",
  ghost: "text-text",
  danger: "text-bg",
} as const;

// States: default / hover (web) / focus-visible (web) / active / disabled / loading.
const states =
  "active:opacity-70 disabled:opacity-40 web:hover:opacity-90 web:transition-opacity " +
  "web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-accent";

export type ButtonVariant = keyof typeof variants;

type Props = Omit<PressableProps, "children" | "className"> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  ...props
}: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      className={`${base} ${variants[variant]} ${states} ${className}`}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" /> : null}
      <Text variant="label" className={labels[variant]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ponytail: no cva / clsx dependency. Four variants in a lookup table is the whole need.
