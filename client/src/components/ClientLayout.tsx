"use client";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { ReactNode, useEffect, useState } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const { dir } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering themed content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main
      className={`min-h-screen transition-colors duration-300 bg-background text-foreground ${theme === "dark" ? "dark" : ""}`}
      dir={dir}
    >
      {/* If not mounted, show a skeleton or just an empty background to avoid flash */}
      {mounted ? children : (
        <div className="invisible">
          {children}
        </div>
      )}
    </main>
  );
}
