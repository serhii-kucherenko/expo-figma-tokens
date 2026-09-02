import { View, type ViewProps } from "react-native";

export function Card({ className = "", ...props }: ViewProps) {
  return <View className={`rounded-lg border border-border bg-surface p-5 ${className}`} {...props} />;
}
