"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Locale = "en" | "ar";

type LanguageContextType = {
  locale: Locale;
  toggleLocale: () => void;
  dir: "ltr" | "rtl";
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getLocaleSnapshot(): Locale {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("ql_locale") as Locale) || "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const saved = localStorage.getItem("ql_locale") as Locale | null;
    if (saved) setLocale(saved);
  }, []);
  useEffect(() => {
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLocale = () => {
    setLocale((prev) => {
      const next = prev === "en" ? "ar" : "en";
      localStorage.setItem("ql_locale", next);
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = next;
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ locale, toggleLocale, dir: locale === "ar" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
