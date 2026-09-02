import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { View } from "react-native";
import { vars } from "nativewind";
import { themes, themeNames, type ThemeName } from "./tokens.gen";

type Ctx = { theme: ThemeName; setTheme: (t: ThemeName) => void; themeNames: ThemeName[] };
const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children, initial = "light" }: { children: ReactNode; initial?: ThemeName }) {
  // ponytail: in-memory only. Add AsyncStorage when a real app needs the choice to survive a restart.
  const [theme, setTheme] = useState<ThemeName>(initial);
  const value = useMemo(() => ({ theme, setTheme, themeNames }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={vars(themes[theme])} className="flex-1 bg-bg">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
