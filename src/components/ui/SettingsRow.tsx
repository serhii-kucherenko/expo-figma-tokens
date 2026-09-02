import { Pressable, View } from "react-native";
import { Text } from "./Text";

type Props = {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
};

export function SettingsRow({ icon, label, value, onPress, right }: Props) {
  const Row = onPress ? Pressable : View;
  return (
    <Row
      {...(onPress
        ? { onPress, accessibilityRole: "button" as const, accessibilityLabel: `${label}${value ? `, ${value}` : ""}` }
        : {})}
      className={`w-full flex-row items-center justify-between px-16 py-14 ${onPress ? "active:opacity-70" : ""}`}
    >
      <View className="flex-row items-center gap-12">
        <View className="h-32 w-32 items-center justify-center rounded-8 bg-surface">
          <Text className="text-16">{icon}</Text>
        </View>
        <Text variant="body">{label}</Text>
      </View>
      {right ?? (
        <View className="flex-row items-center gap-6">
          {value ? <Text variant="value">{value}</Text> : null}
          <Text variant="chevron">›</Text>
        </View>
      )}
    </Row>
  );
}

export function Divider() {
  return <View className="h-px w-full bg-border-subtle" />;
}
