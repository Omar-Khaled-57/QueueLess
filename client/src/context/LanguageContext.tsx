"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Locale = "en" | "ar";

// Helper hook to use dynamically imported local dictionaries
type LanguageContextType = {
  locale: Locale;
  toggleLocale: () => void;
  dir: "ltr" | "rtl";
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("ql_locale") as Locale | null;
    if (stored) {
      setLocale(stored);
      document.documentElement.dir = stored === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = stored;
    }
  }, []);

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
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
