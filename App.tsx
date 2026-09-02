import "./global.css";
import { ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import { Text } from "./src/components/ui/Text";
import { Card } from "./src/components/ui/Card";
import { Badge } from "./src/components/ui/Badge";
import { Button } from "./src/components/ui/Button";
import { themes } from "./src/theme/tokens.gen";

function Swatches() {
  const { theme } = useTheme();
  const entries = Object.entries(themes[theme]);
  return (
    <View className="flex-row flex-wrap gap-3">
      {entries.map(([name, value]) => (
        <View key={name} className="w-24">
          <View className="h-12 w-full rounded-sm border border-border" style={{ backgroundColor: value }} />
          <Text variant="muted" className="mt-1 text-xs">
            {name.replace("--color-", "")}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Screen() {
  const { theme, setTheme, themeNames } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <StatusBar style={theme === "light" ? "dark" : "light"} />
      <ScrollView contentContainerClassName="gap-6 p-5 pb-7">
        <View className="gap-2">
          <Badge tone="accent">tokens/tokens.json</Badge>
          <Text variant="display">Design tokens, live.</Text>
          <Text variant="muted">
            Every colour, radius and size on this screen comes from one JSON file that Figma writes.
          </Text>
        </View>

        <Card className="gap-4">
          <Text variant="title">Theme</Text>
          <View className="flex-row flex-wrap gap-2">
            {themeNames.map((name) => (
              <Button
                key={name}
                label={name}
                variant={name === theme ? "primary" : "secondary"}
                onPress={() => setTheme(name)}
              />
            ))}
          </View>
          <Text variant="muted">Active mode: {theme}. Themes come from Figma variable modes.</Text>
        </Card>

        <Card className="gap-4">
          <Text variant="title">Palette</Text>
          <Swatches />
        </Card>

        <Card className="gap-4">
          <Text variant="title">Components</Text>
          <View className="gap-3">
            <Button label="Primary" className="self-start" />
            <Button label="Secondary" variant="secondary" className="self-start" />
            <Button label="Ghost" variant="ghost" className="self-start" />
            <Button label="Danger" variant="danger" className="self-start" />
            <Button label="Loading" loading className="self-start" />
            <Button label="Disabled" disabled className="self-start" />
          </View>
        </Card>

        <Card className="gap-3">
          <Text variant="title">Type scale</Text>
          <Text variant="display">Display</Text>
          <Text variant="title">Title</Text>
          <Text variant="body">Body</Text>
          <Text variant="label">Label</Text>
          <Text variant="muted">Muted</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Screen />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
