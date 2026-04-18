"use client";

import { motion } from "framer-motion";
import {
  Bell, Globe, Moon, Sun, Shield, Smartphone,
  ChevronRight, Volume2, Wifi, Info, Star
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import Navigation from "@/components/Navigation";

function Toggle({ on, onToggle, dir }: { on: boolean; onToggle: () => void; dir: string }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      className={`relative w-10 h-6 flex items-center rounded-full p-1 transition-colors ${on ? 'bg-primary' : 'bg-black/10 dark:bg-white/10'}`}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${on ? (dir === 'rtl' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { t, dir } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLocale } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);

  const SETTINGS_SECTIONS = [
    {
      title: t("appearance"),
      items: [
        {
          icon: Moon,
          label: t("dark_mode") || "Dark Theme",
          toggle: true,
          value: theme === "dark",
          onToggle: toggleTheme,
        },
        {
          icon: Globe,
          label: t("language"),
          badge: locale === "ar" ? "العربية" : "English",
          toggle: false,
          action: toggleLocale,
        },
      ],
    },
    {
      title: t("notifications") || "Notifications",
      items: [
        {
          icon: Bell,
          label: t("push_notifications") || "Push Notifications",
          toggle: true,
          value: notifications,
          onToggle: () => setNotifications((v) => !v),
        },
        {
          icon: Volume2,
          label: t("sound_alerts") || "Sound Alerts",
          toggle: true,
          value: sounds,
          onToggle: () => setSounds((v) => !v),
        },
      ],
    },
    {
      title: t("account") || "Account & Security",
      items: [
        { icon: Shield, label: t("privacy") || "Privacy & Security", arrow: true },
        { icon: Smartphone, label: t("connected_devices") || "Connected Devices", badge: "1", arrow: true },
        { icon: Wifi, label: t("offline_mode") || "Offline Mode", arrow: true },
      ],
    },
    {
      title: "About",
      items: [
        { icon: Info, label: t("app_version") || "App Version", badge: "v1.0.0" },
        { icon: Star, label: t("rate_app") || "Rate QueueLess", arrow: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-cream dark:bg-[#0f0f0f] flex flex-col md:flex-row items-start" dir={dir}>
      <Navigation />

      <div className="w-full md:ms-64 min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-primary px-6 pt-10 pb-16 arch-header md:rounded-b-none md:rounded-bl-[4rem] relative overflow-hidden shrink-0">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="relative z-10">
            <h1 className="text-white text-2xl font-bold">{t("settings")}</h1>
            <p className="text-white/60 text-sm">{t("appearance")}</p>
          </div>
        </div>

        {/* Settings Panels */}
        <div className="px-6 md:px-12 -mt-6 pt-15 portrait:pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-0">
            {SETTINGS_SECTIONS.map(({ title, items }) => (
              <div key={title}>
                <p className="text-(--color-accent)/40 dark:text-white/30 text-xs font-black uppercase tracking-widest mb-3 pl-1">
                  {title}
                </p>
                <div className="space-y-2">
                  {items.map(({ icon: Icon, label, toggle, value, onToggle, badge, arrow, action }: {
                    icon: React.ElementType; label: string; toggle?: boolean; value?: boolean;
                    onToggle?: () => void; badge?: string; arrow?: boolean; action?: () => void;
                  }) => (
                    <motion.div
                      key={label}
                      whileTap={{ scale: 0.98 }}
                      onClick={action}
                      className={`w-full bg-white dark:bg-[#1a1a1a] rounded-2xl px-5 py-4 flex items-center gap-4 border border-primary/5 shadow-sm ${action ? "cursor-pointer hover:bg-primary/5 dark:hover:bg-white/5" : ""} transition-all`}
                    >
                      <div className="w-10 h-10 bg-cream dark:bg-[#2a2a2a] rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-accent/40 dark:text-white/40" />
                      </div>
                      <span className="text-accent dark:text-white font-bold text-sm flex-1 text-start">
                        {label}
                      </span>
                      {toggle && onToggle && (
                        <Toggle on={value ?? false} onToggle={onToggle} dir={dir} />
                      )}
                      {badge && !toggle && (
                        <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full">
                          {badge}
                        </span>
                      )}
                      {arrow && (
                        <ChevronRight className={`w-4 h-4 text-accent/20 dark:text-white/20 shrink-0 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* App Tagline */}
          <div className="text-center pt-12 pb-8">
            <p className="text-2xl font-black text-primary">Queue<span className="text-accent dark:text-white">Less</span></p>
            <p className="text-accent/30 dark:text-white/20 text-xs font-bold mt-1">Made with ❤️ — Skip the wait.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
