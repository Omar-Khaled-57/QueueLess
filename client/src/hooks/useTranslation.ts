"use client";

import { useLanguage } from "@/context/LanguageContext";
import en from "@/locales/en/common.json";
import ar from "@/locales/ar/common.json";

const TRANSLATIONS = { en, ar };

export function useTranslation() {
  const { locale, dir } = useLanguage();
  const dict = TRANSLATIONS[locale];

  // Simple string replacer for template translation like {position}
  const t = (key: keyof typeof en, params?: Record<string, string | number>) => {
    let str = dict[key] || en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return { t, dir, locale };
}
