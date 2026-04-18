"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { Home, History, User, Settings, LayoutDashboard, Users, BarChart3, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function Navigation() {
  const { t, dir } = useTranslation();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  if (!user) return null; // Don't show nav for unauthenticated

  // Admin Nav vs Customer Nav
  const isAdmin = user.role === "admin";
  
  const LINKS = isAdmin ? [
    { icon: LayoutDashboard, label: t("dashboard"), href: "/admin" },
    { icon: Users, label: t("queue_list"), href: "/admin/queue" },
    { icon: BarChart3, label: t("analytics"), href: "/admin/analytics" },
    { icon: User, label: t("profile"), href: "/profile" },
    { icon: Settings, label: t("settings"), href: "/settings" },
  ] : [
    { icon: Home, label: t("home"), href: "/home" },
    { icon: History, label: t("history"), href: "/history" },
    { icon: User, label: t("profile"), href: "/profile" },
    { icon: Settings, label: t("settings"), href: "/settings" },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-[#1A1A1A] border-t border-primary/5 dark:border-white/5 px-6 py-4 flex justify-around items-center shadow-2xl z-50 transition-colors duration-300">
        {LINKS.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || (href !== "/home" && href !== "/admin" && pathname.startsWith(href));
          return (
            <Link key={label} href={href} className="flex flex-col items-center gap-1 relative">
              {active && (
                <motion.div layoutId="navIndicator" className="absolute -top-4 w-12 h-1 bg-primary rounded-b-full" />
              )}
              <Icon className={`w-6 h-6 transition-colors ${active ? "text-primary" : "text-accent/30 dark:text-white/30"}`} />
              <span className={`text-[10px] font-bold transition-colors ${active ? "text-primary" : "text-accent/30 dark:text-white/30"}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar Nav */}
      <aside className={`hidden md:flex fixed top-0 ${dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'} h-screen w-64 bg-white dark:bg-[#1A1A1A] border-primary/5 dark:border-white/5 flex-col shadow-2xl z-50 transition-colors duration-300`}>
        <div className="p-8">
          <p className="text-3xl font-black text-primary flex items-center gap-2">
            Queue<span className="text-accent dark:text-white">Less</span>
          </p>
        </div>
        
        <div className="px-4 space-y-2 flex-1 mt-4 scrollbar-hide overflow-y-auto">
          {LINKS.map(({ icon: Icon, label, href }) => {
            const active = pathname === href || (href !== "/home" && href !== "/admin" && pathname.startsWith(href));
            return (
              <Link key={label} href={href} className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all relative group overflow-hidden ${active ? "bg-primary/10 text-primary" : "text-accent/50 hover:bg-cream dark:text-white/50 dark:hover:bg-white/5"}`}>
                <Icon className={`w-5 h-5 z-10 transition-colors ${active ? "text-primary" : "group-hover:text-primary/70"}`} />
                <span className={`font-bold z-10 transition-colors ${active ? "text-primary" : "group-hover:text-primary/70"}`}>{label}</span>
                {active && (
                  <motion.div layoutId="sidebarIndicator" className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} w-1 bg-primary`} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Logout & User Info — Pinned at bottom */}
        <div className="p-4 border-t border-primary/5 dark:border-white/5 space-y-2 bg-white dark:bg-[#1A1A1A]">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-2xl bg-[#FFF5F9] dark:bg-[#111]">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black shadow-sm overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-accent dark:text-white truncate">{user.name}</p>
              <p className="text-[10px] text-accent/40 dark:text-white/30 truncate capitalize">{user.role}</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all font-bold group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
