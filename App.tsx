import "./global.css";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import { Card } from "./src/components/ui/Card";
import { Divider, SettingsRow } from "./src/components/ui/SettingsRow";
import { StatCard } from "./src/components/ui/StatCard";
import { TabBar } from "./src/components/ui/TabBar";
import { Text } from "./src/components/ui/Text";
import { ThemeOption } from "./src/components/ui/ThemeOption";
import { Toggle } from "./src/components/ui/Toggle";

const themeLabels = { light: "Light", dark: "Dark", ocean: "Ocean" } as const;

function Header() {
  return (
    <View className="w-full flex-row items-center justify-between px-24 py-12">
      <Text variant="title">Settings</Text>
      <View className="h-36 w-36 rounded-pill bg-primary" />
    </View>
  );
}

function Settings() {
  const { theme, setTheme, themeNames } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [tab, setTab] = useState("Settings");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <StatusBar style={theme === "light" ? "dark" : "light"} />
      <Header />

      <ScrollView contentContainerClassName="gap-20 px-20 pb-24 pt-8">
        <Card className="gap-12 p-16">
          <Text variant="eyebrow">APPEARANCE</Text>
          <View className="w-full flex-row gap-10">
            {themeNames.map((name) => (
              <ThemeOption
                key={name}
                name={name}
                label={themeLabels[name] ?? name}
                selected={name === theme}
                onPress={() => setTheme(name)}
              />
            ))}
          </View>
        </Card>

        <Card className="py-4">
          <SettingsRow
            icon="🔔"
            label="Notifications"
            right={<Toggle value={notifications} onValueChange={setNotifications} />}
          />
          <Divider />
          <SettingsRow icon="🔒" label="Privacy" value="Default" onPress={() => {}} />
          <Divider />
          <SettingsRow icon="💾" label="Storage" value="24.5 GB" onPress={() => {}} />
          <Divider />
          <SettingsRow icon="🌐" label="Language" value="English" onPress={() => {}} />
        </Card>

        <View className="w-full flex-row gap-12">
          <StatCard value="2.4k" label="Following" tone="primary" />
          <StatCard value="18.7k" label="Followers" tone="success" />
          <StatCard value="342" label="Posts" tone="warning" />
        </View>
      </ScrollView>

      <TabBar active={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
