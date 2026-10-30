import { createContext, useContext, useState, useEffect } from "react"

import AsyncStorage from "@react-native-async-storage/async-storage"

import { t as tFn, type Locale } from "./i18n"

const STORAGE_KEY = "@mojo_locale"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: Parameters<typeof tFn>[0], ...args: any[]) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key as string,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "en" || stored === "sw") {
          setLocaleState(stored)
        }
      })
      .catch(() => {})
  }, [])

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale)
    AsyncStorage.setItem(STORAGE_KEY, newLocale).catch(() => {})
  }

  function translate(key: Parameters<typeof tFn>[0], ...args: any[]): string {
    return tFn(key, locale, ...args)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translate }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return useContext(I18nContext)
}
