import { Pressable, View } from "react-native";
import { Text } from "./Text";

const tabs = [
  { icon: "⌂", label: "Home" },
  { icon: "🔍", label: "Search" },
  { icon: "♡", label: "Favorites" },
  { icon: "⚙", label: "Settings" },
];

export function TabBar({ active, onChange }: { active: string; onChange: (label: string) => void }) {
  return (
    <View className="w-full flex-row justify-between border-t border-border-subtle bg-surface-elevated px-32 pb-28 pt-12">
      {tabs.map((tab) => {
        const isActive = tab.label === active;
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.label)}
            className="items-center gap-4 active:opacity-70"
          >
            <Text variant="tabIcon" className={isActive ? "text-tab-active" : "text-tab-inactive"}>
              {tab.icon}
            </Text>
            <Text
              variant="tabLabel"
              className={isActive ? "font-semibold text-tab-active" : "text-tab-inactive"}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
