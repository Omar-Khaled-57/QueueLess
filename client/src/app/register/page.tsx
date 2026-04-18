"use client";

import { motion } from "framer-motion";
import { ArrowLeft, User, Building2, Mail, Lock, UserPlus, Smartphone, MapPin, Home, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/context/ThemeContext";
import ThemeLangToggle from "@/components/ThemeLangToggle";

export default function Register() {
  const { register, user: authUser } = useAuth();
  const { t, dir } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const [role, setRole] = useState<"user" | "admin">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
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
      await register(name, email, password, role, phone, city, address, gender);
      // Auth data is updated in context, useEffect will handle redirect
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
      <div className="fixed top-6 z-50" style={{ right: "1.5rem" }}>
        <ThemeLangToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="w-full max-w-md md:max-w-lg mx-auto min-h-screen md:min-h-0 bg-white dark:bg-[#1a1a1a] shadow-2xl flex flex-col relative z-20 md:rounded-2xl overflow-hidden border border-primary/10 dark:border-white/5 md:my-12 transition-colors duration-300"
      >
        {/* Pink Header */}
        <div className="bg-primary p-8 arch-header text-white flex flex-col gap-4 shrink-0">
          <Link
            href="/"
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 text-white ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t("create_account")}</h1>
            <p className="text-white/80">{t("register_subtitle")}</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6 flex-1">

          {/* Role Switcher */}
          <div className="flex p-1 bg-[#FFF5F9] dark:bg-[#111] rounded-2xl gap-1 transition-colors">
            {([
              { value: "user" as const, label: t("customer"), icon: User },
              { value: "admin" as const, label: t("business"), icon: Building2 },
            ]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setRole(value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                  role === value
                    ? "bg-white dark:bg-[#2a2a2a] text-primary shadow-sm"
                    : "text-[#1A1A1A]/40 dark:text-white/30 hover:text-primary/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3">
              {[
                { icon: User, type: "text", placeholder: t("full_name"), value: name, setter: setName, required: true },
                { icon: Mail, type: "email", placeholder: t("email_placeholder"), value: email, setter: setEmail, required: true },
                { icon: Lock, type: "password", placeholder: t("password_hint"), value: password, setter: setPassword, required: true },
                { icon: Smartphone, type: "tel", placeholder: "Phone Number", value: phone, setter: setPhone, required: false },
                { icon: MapPin, type: "text", placeholder: "City", value: city, setter: setCity, required: false },
                { icon: Home, type: "text", placeholder: "Address", value: address, setter: setAddress, required: false },
              ].map(({ icon: Icon, type, placeholder, value, setter, required }) => (
                <div key={placeholder} className="relative">
                  <div className="absolute inset-y-0 inset-s-4 flex items-center pointer-events-none">
                    <Icon className="w-5 h-5 text-[#1A1A1A]/30 dark:text-white/25" />
                  </div>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    required={required}
                    minLength={type === "password" ? 6 : undefined}
                    className="w-full ps-12 pe-4 py-4 rounded-2xl bg-[#FFF5F9] dark:bg-[#111] dark:text-white border border-transparent focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#222] transition-all outline-none text-[#1A1A1A] font-medium placeholder:text-[#1A1A1A]/30 dark:placeholder:text-white/25"
                  />
                </div>
              ))}
              
              {/* Gender selector */}
              <div className="relative">
                <div className="absolute inset-y-0 inset-s-4 flex items-center pointer-events-none">
                  <Users className="w-5 h-5 text-[#1A1A1A]/30 dark:text-white/25" />
                </div>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full ps-12 pe-4 py-4 rounded-2xl bg-[#FFF5F9] dark:bg-[#111] dark:text-white border border-transparent focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#222] transition-all outline-none text-[#1A1A1A] font-medium appearance-none"
                >
                  <option value="" disabled>Select Gender (Optional)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Prefer not to say</option>
                </select>
              </div>
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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all mt-6 disabled:opacity-60"
            >
              {loading ? t("creating_account") : `${t("register_btn")} ${role === "user" ? t("customer") : t("business")}`}
              <UserPlus className="w-5 h-5" />
            </motion.button>
          </form>

          <p className="text-center text-[#1A1A1A]/50 dark:text-white/40 font-medium">
            {t("already_have_account")}{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              {t("login_button")}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pb-6 text-[#1A1A1A]/20 dark:text-white/15 text-xs font-bold uppercase tracking-widest">
          QueueLess v1.0
        </div>
      </motion.div>
    </div>
  );
}
