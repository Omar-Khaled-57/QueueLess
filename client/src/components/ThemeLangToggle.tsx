"use client";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Moon, Sun, Languages } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeLangToggle({ glassOnPrimary = false }: { glassOnPrimary?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLocale } = useLanguage();

  return (
    <div className={`flex gap-2 relative overflow-hidden p-1.5 rounded-full border shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl ${
      glassOnPrimary 
        ? 'border-white/20 bg-white/20' 
        : 'border-white/40 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] bg-white/15 dark:bg-black/30'
    }`}>
      <div
        className={`absolute inset-0 pointer-events-none mix-blend-overlay ${glassOnPrimary ? 'opacity-[0.4]' : 'opacity-[0.4] dark:opacity-[0.05]'}`}
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}
      />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className={`relative z-10 w-10 h-10 flex items-center justify-center rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] transition-colors backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          glassOnPrimary
            ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
            : 'bg-white/70 hover:bg-white/90 dark:bg-white/15 dark:hover:bg-white/25 text-slate-800 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
        }`}
      >
        {theme === "light" ? <Moon className="w-5 h-5 drop-shadow-sm" /> : <Sun className="w-5 h-5 drop-shadow-sm" />}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleLocale}
        aria-label="Toggle language"
        className={`relative z-10 px-4 h-10 flex items-center justify-center rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] font-bold text-sm uppercase gap-2 transition-colors backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          glassOnPrimary
            ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
            : 'bg-white/70 hover:bg-white/90 dark:bg-white/15 dark:hover:bg-white/25 text-slate-800 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
        }`}
      >
        <Languages className="w-4 h-4 drop-shadow-sm" />
        <span className="drop-shadow-sm">{locale === "en" ? "عربي" : "EN"}</span>
      </motion.button>
    </div>
  );
}
