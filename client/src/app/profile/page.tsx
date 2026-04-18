"use client";

import { motion } from "framer-motion";
import {
  Mail, MapPin, Edit2, LogOut,
  Bell, Globe, Moon, Shield, ChevronRight, Camera
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import ThemeLangToggle from "@/components/ThemeLangToggle";
import { useRef, useState, useEffect } from "react";
import { authAPI, notificationsAPI, type Notification } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export default function ProfilePage() {
  const { user, logout, token, updateUser } = useAuth();
  const { t } = useTranslation();
  const { locale, toggleLocale, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  
  // Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editGender, setEditGender] = useState("");
  const [saving, setSaving] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarSrc(user.avatar_url);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      notificationsAPI.getAll(token)
        .then(r => {
          setNotifications(r.notifications);
          setUnreadCount(r.notifications.filter(n => !n.is_read).length);
        })
        .catch(console.error);
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && token) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result as string;
        setAvatarSrc(base64Str);
        // Save to backend immediately
        try {
          const res = await authAPI.updateMe({ avatar_url: base64Str }, token);
          updateUser(res.user);
        } catch (err) {
          console.error("Failed to update avatar", err);
          alert("Could not save profile picture.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!token || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await authAPI.updateMe({
        name: editName, phone: editPhone, city: editCity, address: editAddress, gender: editGender
      }, token);
      updateUser(res.user);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    if (!token) return;
    try {
      await notificationsAPI.markRead(id, token);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  type MenuItem = {
    icon: any;
    label: string;
    badge: string | null;
    isToggle?: boolean;
    toggleValue?: boolean | string;
  };

  const MENU_ITEMS: { section: string, items: MenuItem[] }[] = [
    {
      section: t("account") || "Account",
      items: [
        { icon: Edit2, label: t("edit_profile") || "Edit Profile", badge: null },
        { icon: Bell, label: t("notifications") || "Notifications", badge: unreadCount > 0 ? String(unreadCount) : null },
        { icon: Shield, label: t("privacy") || "Privacy & Security", badge: null },
      ],
    },
    {
      section: t("preferences") || "Preferences",
      items: [
        { icon: Globe, label: t("language") || "Language", badge: locale === 'ar' ? 'العربية' : 'English', isToggle: false },
        { icon: Moon, label: t("dark_mode") || "Dark Theme", badge: null, isToggle: true, toggleValue: theme === 'dark' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-(--color-cream) dark:bg-[#0f0f0f] flex flex-col md:flex-row items-start" dir={dir}>
      <Navigation />

      {/* Page Content */}
      <div className="w-full md:ms-64 min-h-screen flex flex-col">
        {/* Header Controls */}
        <div className="absolute top-6 z-50 [&>div]:bg-white/10 [&>div]:border-white/20 [&_button]:bg-white/20 [&_button]:text-white" style={{ insetInlineEnd: "1.5rem" }}>
          <ThemeLangToggle />
        </div>

        {/* Pink Header Banner */}
        <div className="bg-primary px-6 pt-10 pb-24 arch-header md:rounded-b-none md:rounded-bl-[4rem] relative overflow-hidden shrink-0">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute bottom-4 left-8 w-20 h-20 rounded-full bg-secondary/30" />
          <p className="text-white/70 text-sm font-semibold relative z-10">{t("profile")}</p>
        </div>

        {/* Avatar — Overlapping */}
        <div className="px-6 md:px-12 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
            {/* Avatar with camera button */}
            <div className="relative w-28 h-28 shrink-0">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                onClick={handleAvatarClick}
                className="w-28 h-28 bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl flex items-center justify-center cursor-pointer overflow-hidden border-4 border-white dark:border-[#1a1a1a] ring-2 ring-primary/20"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-primary select-none">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </motion.div>
              <button
                onClick={handleAvatarClick}
                className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary rounded-xl shadow-lg flex items-center justify-center hover:bg-primary-dark transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Name & Role */}
            <div className="flex flex-col md:mb-2 relative z-10 w-full md:w-auto">
              <div className="bg-white dark:bg-[#1a1a1a] px-6 py-3 rounded-2xl shadow-md border border-primary/5 inline-block w-fit mb-2 transition-colors">
                <h1 className="text-3xl font-black text-(--color-accent) dark:text-white tracking-tight leading-none">{user?.name || "User"}</h1>
              </div>
              <div className="flex items-center gap-2 pl-2">
                <span className="text-(--color-accent)/60 dark:text-white/50 text-sm font-bold capitalize">
                  {user?.role === "admin" ? t("business") : t("customer")}
                </span>
                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-widest">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {(
              [
                { icon: Mail, value: user?.email || "No email" },
                { icon: MapPin, value: user?.city ? `${user.city}${user.address ? `, ${user.address}` : ""}` : "No location provided" },
              ] as const
            ).map(({ icon: Icon, value }, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm border border-primary/5"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-(--color-accent) dark:text-white font-medium text-sm flex-1">{value}</span>
              </motion.div>
            ))}
          </div>

          {/* Settings Menu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {MENU_ITEMS.map(({ section, items }) => (
              <div key={section}>
                <p className="text-(--color-accent)/40 dark:text-white/30 text-xs font-black uppercase tracking-widest mb-3 pl-1">
                  {section}
                </p>
                <div className="space-y-2">
                  {items.map(({ icon: Icon, label, badge, isToggle, toggleValue }) => (
                    <motion.button
                      key={label}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (Icon === Edit2) {
                          setEditName(user?.name || "");
                          setEditPhone(user?.phone || "");
                          setEditCity(user?.city || "");
                          setEditAddress(user?.address || "");
                          setEditGender(user?.gender || "");
                          setIsEditModalOpen(true);
                        } else if (Icon === Bell) {
                          setIsNotifModalOpen(true);
                        } else if (Icon === Globe) {
                          toggleLocale();
                        } else if (Icon === Moon) {
                          toggleTheme();
                        }
                      }}
                      className="w-full bg-white dark:bg-[#1a1a1a] rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-all border border-primary/5"
                    >
                      <div className="w-10 h-10 bg-(--color-cream) dark:bg-[#2a2a2a] rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-(--color-accent)/40 dark:text-white/40" />
                      </div>
                      <span className="text-(--color-accent) dark:text-white font-bold text-sm flex-1 text-start">
                        {label}
                      </span>
                      {badge && (
                        <span className="bg-primary text-white text-xs font-black px-2 py-0.5 rounded-full">
                          {badge}
                        </span>
                      )}
                      {isToggle ? (
                        <div className={`relative w-10 h-6 flex items-center rounded-full p-1 transition-colors ${toggleValue === true || toggleValue === 'AR' ? 'bg-primary' : 'bg-black/10 dark:bg-white/10'}`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${
                            toggleValue === true || toggleValue === 'AR' 
                              ? (dir === 'rtl' ? '-translate-x-4' : 'translate-x-4') 
                              : 'translate-x-0'
                          }`} />
                        </div>
                      ) : (
                        <ChevronRight className={`w-4 h-4 text-(--color-accent)/20 dark:text-white/20 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Logout */}
          <motion.button
            onClick={handleLogout}
            whileTap={{ scale: 0.98 }}
            className="w-full md:max-w-sm bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all portrait:mb-28"
          >
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-rose-500" />
            </div>
            <span className="font-bold text-sm flex-1 text-start">{t("logout")}</span>
          </motion.button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative"
          >
            <h2 className="text-2xl font-black text-accent dark:text-white mb-6">Edit Profile</h2>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-accent/60 dark:text-white/60 uppercase tracking-widest mb-1">Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-(--color-cream) dark:bg-[#0f0f0f] border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none font-bold text-accent dark:text-white transition-all"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-accent/60 dark:text-white/60 uppercase tracking-widest mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-(--color-cream) dark:bg-[#0f0f0f] border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none font-bold text-accent dark:text-white transition-all"
                  placeholder="Enter phone"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-accent/60 dark:text-white/60 uppercase tracking-widest mb-1">City</label>
                  <input 
                    type="text" 
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full bg-(--color-cream) dark:bg-[#0f0f0f] border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none font-bold text-accent dark:text-white transition-all"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-accent/60 dark:text-white/60 uppercase tracking-widest mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full bg-(--color-cream) dark:bg-[#0f0f0f] border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none font-bold text-accent dark:text-white transition-all"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-accent/60 dark:text-white/60 uppercase tracking-widest mb-1">Address</label>
                <input 
                  type="text" 
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-(--color-cream) dark:bg-[#0f0f0f] border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none font-bold text-accent dark:text-white transition-all"
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-accent/60 dark:text-white/60 bg-(--color-cream) dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={saving || !editName.trim()}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Notifications Modal */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-2xl font-black text-accent dark:text-white">Notifications</h2>
              <button onClick={() => setIsNotifModalOpen(false)} className="text-accent/40 hover:text-accent p-2">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2 pb-4">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-accent/40 font-bold">No notifications yet!</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)} className={`p-4 rounded-2xl border transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5 border-primary/20' : 'bg-(--color-cream) dark:bg-[#111] border-transparent'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`font-bold text-sm ${!n.is_read ? 'text-primary' : 'text-accent dark:text-white'}`}>{n.title}</h4>
                        <p className="text-accent/70 dark:text-white/60 text-xs mt-1 leading-relaxed">{n.message}</p>
                      </div>
                      {!n.is_read && <span className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 animate-pulse mt-1" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
