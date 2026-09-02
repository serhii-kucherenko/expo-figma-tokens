import { Pressable, View } from "react-native";
import { themes, type ThemeName } from "../../theme/tokens.gen";
import { Text } from "./Text";

// A miniature of the theme: three bars on that theme's own background.
function Preview({ name }: { name: ThemeName }) {
  const t = themes[name];
  return (
    <View
      className="h-52 w-full gap-4 rounded-8 px-8 pt-8"
      style={{ backgroundColor: t["--color-background"] }}
    >
      <View className="h-4 w-40 rounded-2" style={{ backgroundColor: t["--color-primary"] }} />
      <View className="h-4 w-56 rounded-2" style={{ backgroundColor: t["--color-border"], opacity: 0.5 }} />
      <View className="h-4 w-56 rounded-2" style={{ backgroundColor: t["--color-border"], opacity: 0.5 }} />
    </View>
  );
}

export function ThemeOption({
  name,
  label,
  selected,
  onPress,
}: {
  name: ThemeName;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} theme`}
      onPress={onPress}
      className={`flex-1 items-center gap-8 rounded-12 px-8 py-12 active:opacity-70 ${
        selected ? "border-2 border-primary" : "border border-border"
      }`}
    >
      <Preview name={name} />
      <Text variant={selected ? "optionActive" : "option"}>{label}</Text>
    </Pressable>
  );
}
