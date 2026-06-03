"use client";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const { dir } = useLanguage();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!loading && !user && !PUBLIC_ROUTES.includes(pathname)) {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  return (
    <main
      className={`min-h-screen transition-colors duration-300 bg-background text-foreground ${theme === "dark" ? "dark" : ""}`}
      dir={dir}
    >
      {children}
    </main>
  );
}
