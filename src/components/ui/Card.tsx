import { View, type ViewProps } from "react-native";

export function Card({ className = "", ...props }: ViewProps) {
  return <View className={`w-full rounded-16 bg-card-bg ${className}`} {...props} />;
}
