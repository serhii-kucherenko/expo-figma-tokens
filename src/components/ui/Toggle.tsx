import { Pressable, View } from "react-native";

export function Toggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      className={`h-28 w-48 justify-center rounded-pill px-3 active:opacity-70 ${
        value ? "bg-switch-on" : "bg-border"
      }`}
    >
      <View className={`h-22 w-22 rounded-pill bg-white ${value ? "self-end" : "self-start"}`} />
    </Pressable>
  );
}
