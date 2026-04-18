"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/context/ThemeContext";
import ThemeLangToggle from "@/components/ThemeLangToggle";

export default function Login() {
  const { login, user: authUser } = useAuth();
  const { t, dir } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect based on role
  useEffect(() => {
    if (authUser) {
      router.push(authUser.role === "admin" ? "/admin" : "/home");
    }
  }, [authUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // login sets the user in context, useEffect above will handle redirection
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 bg-background`}
      dir={dir}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-primary/10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-primary/5 translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Toggle — fixed top-right regardless of RTL */}
      <div className="fixed top-6 z-50 [&>div]:bg-white/10 [&>div]:border-white/20 [&_button]:bg-white/20 [&_button]:text-white" style={{ insetInlineEnd: "1.5rem" }}>
        <ThemeLangToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="w-full max-w-md md:max-w-lg mx-auto min-h-screen md:min-h-0 bg-white dark:bg-[#1a1a1a] shadow-2xl flex flex-col relative z-20 md:rounded-2xl overflow-hidden border border-primary/10 dark:border-white/5 md:my-12 transition-colors duration-300"
      >
        {/* Pink Header */}
        <div className="bg-primary p-10 arch-header text-white flex flex-col gap-4 shrink-0">
          <Link
            href="/"
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 text-white ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold italic">{t("welcome_back")}</h1>
            <p className="text-white/80">{t("login_subtitle")}</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-10 space-y-8 flex-1">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {[
                { icon: Mail, type: "email", placeholder: t("email_placeholder"), value: email, setter: setEmail },
                { icon: Lock, type: "password", placeholder: t("password_placeholder"), value: password, setter: setPassword },
              ].map(({ icon: Icon, type, placeholder, value, setter }) => (
                <div key={placeholder} className="relative">
                  <div className="absolute inset-y-0 inset-s-4 flex items-center pointer-events-none">
                    <Icon className="w-5 h-5 text-[#1A1A1A]/30 dark:text-white/25" />
                  </div>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    required
                    className="w-full ps-12 pe-4 py-4 rounded-2xl bg-[#FFF5F9] dark:bg-[#111] dark:text-white border border-transparent focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#222] transition-all outline-none text-[#1A1A1A] font-medium placeholder:text-[#1A1A1A]/30 dark:placeholder:text-white/25"
                  />
                </div>
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-rose-500 text-sm font-bold text-center bg-rose-50 dark:bg-rose-500/10 py-3 rounded-2xl px-4"
              >
                {error}
              </motion.p>
            )}

            <div className="flex justify-start">
              <button type="button" className="text-sm font-bold text-primary hover:underline">
                {t("forgot_password")}
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-60"
            >
              {loading ? t("signing_in") : t("login_button")}
              <LogIn className={`w-5 h-5 ${dir === "rtl" ? "rotate-180" : ""}`} />
            </motion.button>
          </form>

          <p className="text-center text-[#1A1A1A]/50 dark:text-white/40 font-medium pb-2">
            {t("no_account")}{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              {t("register_now")}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pb-6 text-[#1A1A1A]/20 dark:text-white/15 text-xs font-bold uppercase tracking-widest">
          Secured by JWT
        </div>
      </motion.div>
    </div>
  );
}
