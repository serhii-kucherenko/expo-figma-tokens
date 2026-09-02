import { View } from "react-native";
import { Text } from "./Text";

const tones = {
  neutral: "border-border bg-surface",
  primary: "border-primary bg-primary",
  accent: "border-accent bg-accent",
} as const;

const labelTone = {
  neutral: "text-muted",
  primary: "text-primary-fg",
  accent: "text-bg",
} as const;

export function Badge({ children, tone = "neutral" }: { children: string; tone?: keyof typeof tones }) {
  return (
    <View className={`self-start rounded-pill border px-3 py-1 ${tones[tone]}`}>
      <Text variant="label" className={`text-xs ${labelTone[tone]}`}>
        {children}
      </Text>
    </View>
  );
}
