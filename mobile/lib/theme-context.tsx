// Theme context provider for light/dark mode support
// Spec: EPIMOYO_REDESIGN.md §5.5 (Dark Theme)

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useColorScheme } from "react-native"

const THEME_STORAGE_KEY = "@epimoyo_theme"

export type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  isDark: false,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const systemColorScheme = useColorScheme()

  // Load saved theme preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark" || stored === "system") {
          setThemeState(stored)
        }
      })
      .catch(() => {})
  }, [])

  // Determine if dark mode is active
  const isDark =
    theme === "dark" ||
    (theme === "system" && systemColorScheme === "dark")

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme)
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch(() => {})
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
