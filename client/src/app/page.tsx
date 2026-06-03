"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, Smartphone, Zap, Users, QrCode } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ThemeLangToggle from "@/components/ThemeLangToggle";

export default function Home() {
  const { t, dir } = useTranslation();
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/home");
    }
  }, [user, loading, router]);

  const FEATURES = [
    { icon: Clock, title: t("save_time"), desc: t("save_time_desc"), color: "bg-primary/10 text-primary" },
    { icon: Smartphone, title: t("real_time"), desc: t("real_time_desc"), color: "bg-sun/20 text-amber-500" },
    { icon: Zap, title: t("instant_join"), desc: t("instant_join_desc"), color: "bg-sky-500/10 text-sky-500 dark:text-sky-400" },
    { icon: QrCode, title: t("smart_tickets"), desc: t("smart_tickets_desc"), color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "QueueLess",
    url: "https://queue-less-nu.vercel.app",
    description: "Eliminate physical waiting lines with a smart digital queue system. Book remotely and track your turn in real-time.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", name: "Omar Khaled" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div
      className={`relative min-h-[100dvh] md:h-[100dvh] bg-background text-foreground transition-colors duration-300 selection:bg-primary/30 overflow-x-hidden md:overflow-hidden ${theme === "dark" ? "dark" : ""}`}
      dir={dir}
    >
      {/* Language / Theme Toggle — always top-right regardless of dir */}
      <div className="fixed top-6 z-50" style={{ insetInlineEnd: "1.5rem" }}>
        <ThemeLangToggle glassOnPrimary />
      </div>

      <div className="h-full flex flex-col md:flex-row">

        {/* LEFT (or right on RTL): Pink Hero Panel */}
        <div className="bg-primary md:w-1/2 lg:w-[55%] flex flex-col items-center justify-center px-8 pt-20 pb-12 md:p-12 min-h-[50dvh] md:min-h-0 md:h-full relative overflow-hidden arch-header md:rounded-none md:rounded-br-[6rem]">
          {/* Decoration */}
          <div className="absolute top-10 left-10 w-24 h-24 rounded-full border-4 border-white/20" />
          <div className="absolute bottom-20 right-[-20px] w-48 h-48 rounded-full bg-secondary/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-md h-md rounded-full bg-white/5 pointer-events-none" />

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 120 }}
            className="z-10 text-center"
          >
            <h1 className="text-white text-6xl md:text-7xl font-black tracking-tight mb-3 drop-shadow-md">
              Queue<span className="text-sun">Less</span>
            </h1>
            <p className="text-white/80 text-xl font-medium mb-10">
              {t("hero_subtitle")}
            </p>

            {/* Logo — circular */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-50 h-50 md:w-52 md:h-52 mx-auto rounded-full overflow-hidden drop-shadow-2xl"> {/*bg-white/25 ring-4 ring-white/30*/}
            
              <Image
                src="/logo512x512tr.webp"
                alt="QueueLess Logo"
                width={512}
                height={512}
                className="w-full h-full object-cover"
                priority
              />
            </motion.div>

            {/* Stat pills */}
            <div className="flex gap-4 justify-center mt-8">
              {[
                { icon: Users, label: t("users_stat") },
                { icon: Clock, label: t("hours_saved_stat") },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-white text-xs font-bold">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT: Content Panel */}
        <div className="md:w-1/2 lg:w-[45%] flex flex-col px-6 sm:px-10 lg:px-14 xl:px-16 pt-24 portrait:pt-5 pb-8 md:pt-20 md:pb-10 md:h-full md:overflow-y-auto transition-colors duration-300">
          <motion.div
            initial={{ opacity: 0, x: dir === "rtl" ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="my-auto w-full max-w-xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-accent dark:text-white leading-[1.15] mb-2 sm:mb-3">
              <>{t("wait_less")} <span className="text-primary italic">{t("live_more")}</span></>
            </h2>
            <p className="text-accent/60 dark:text-white/50 text-sm md:text-base lg:text-lg mb-6 leading-relaxed max-w-lg">
              {t("description")}
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4 mb-6 lg:mb-8">
              {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="bg-[var(--card-bg)] rounded-xl portrait:rounded-xl sm:rounded-2xl md:rounded-3xl p-3 lg:p-4 border border-black/5 dark:border-white/5 shadow-sm transition-colors flex flex-col"
                >
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 ${color} rounded-md portrait:rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center mb-2 lg:mb-3`}>
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <p className="font-bold text-accent dark:text-white text-xs sm:text-sm lg:text-base">{title}</p>
                  <p className="text-accent/50 dark:text-white/40 text-[10px] sm:text-xs mt-1 leading-relaxed flex-1">{desc}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <Link href="/register" className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary text-white py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
                >
                  {t("get_started")}
                  <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 ${dir === "rtl" ? "rotate-180" : ""}`} />
                </motion.button>
              </Link>
              <Link href="/login" className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-accent text-white dark:text-black py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all hover:opacity-90"
                >
                  {t("sign_in")}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}
