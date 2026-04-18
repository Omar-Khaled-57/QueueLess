"use client";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Moon, Sun, Languages } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeLangToggle() {
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLocale } = useLanguage();

  return (
    <div className="flex gap-2 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-full border border-primary/10 dark:border-white/10 shadow-md backdrop-blur">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white shadow-sm transition-colors"
      >
        {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleLocale}
        aria-label="Toggle language"
        className="px-4 h-10 flex items-center justify-center rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white shadow-sm font-bold text-sm uppercase gap-2 transition-colors"
      >
        <Languages className="w-4 h-4" />
        {locale === "en" ? "عربي" : "EN"}
      </motion.button>
    </div>
  );
}
