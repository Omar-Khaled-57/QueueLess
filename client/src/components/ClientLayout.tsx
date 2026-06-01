"use client";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const { dir } = useLanguage();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering themed content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (mounted && !loading && !user && !PUBLIC_ROUTES.includes(pathname)) {
      router.replace("/");
    }
  }, [mounted, loading, user, pathname, router]);

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
