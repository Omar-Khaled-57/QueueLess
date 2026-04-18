"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Clock, Users, Star, ChevronRight,
  Bell, User, Home, History, Settings, Zap, Loader2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { businessAPI, ticketAPI, notificationsAPI, type Business, type Ticket, type Notification } from "@/lib/api";
import Navigation from "@/components/Navigation";

const CATEGORIES = ["All", "Clinic", "Bank", "Lab", "Government", "Pharmacy"];

const CARD_COLORS: Record<string, string> = {
  clinic:     "from-pink-400 to-rose-500",
  bank:       "from-purple-400 to-fuchsia-600",
  lab:        "from-amber-400 to-orange-500",
  government: "from-sky-400 to-blue-600",
  pharmacy:   "from-emerald-400 to-teal-600",
  general:    "from-slate-400 to-slate-600",
};

export default function CustomerDashboard() {
  const { user, token } = useAuth();
  const { t, dir } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [loadingBiz, setLoadingBiz] = useState(true);

  useEffect(() => {
    businessAPI.list()
      .then((r) => setBusinesses(r.businesses))
      .catch(console.error)
      .finally(() => setLoadingBiz(false));
  }, []);

  useEffect(() => {
    if (!token) return;
    ticketAPI.myActive(token)
      .then((r) => setActiveTicket(r.ticket))
      .catch(console.error);
      
    notificationsAPI.getAll(token)
      .then((r) => {
        setNotifications(r.notifications);
        setUnreadCount(r.notifications.filter(n => !n.is_read).length);
      })
      .catch(console.error);
  }, [token]);

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

  const filtered = businesses.filter((b) => {
    const matchCat = activeCategory === "All" || b.category.toLowerCase() === activeCategory.toLowerCase();
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("good_morning");
    if (h < 17) return t("good_afternoon");
    return t("good_evening");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row items-start transition-colors duration-300" dir={dir}>
      <Navigation />
      <div className={`w-full ${user ? "md:ms-64" : ""} min-h-screen bg-cream md:bg-cream shadow-2xl md:shadow-none flex flex-col relative transition-all`}>

        {/* Top Bar */}
        <div className="bg-primary px-6 pt-10 pb-16 arch-header md:rounded-b-none md:rounded-bl-[4rem] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-secondary/20" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-white/70 text-sm font-medium">{greeting()},</p>
              <h1 className="text-white text-2xl font-bold">{user?.name?.split(" ")[0] ?? "there"} 👋</h1>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsNotifModalOpen(true)}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-sun text-accent text-[10px] font-black rounded-full flex items-center justify-center border-2 border-primary">
                    {unreadCount}
                  </span>
                )}
              </button>
              <Link href="/profile" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden hover:bg-white/30 transition-colors border-2 border-transparent hover:border-white/20">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </Link>
            </div>
          </div>

          {/* Active Ticket Pill */}
          {activeTicket ? (
            <Link href={`/queue/${activeTicket.queue_id}`}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 bg-white/20 backdrop-blur rounded-2xl p-4 flex items-center gap-4 relative z-10 cursor-pointer hover:bg-white/30 transition-colors"
              >
                <div className="w-12 h-12 bg-sun rounded-2xl flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-wider">{t("active_ticket")}</p>
                  <p className="text-white font-bold">{activeTicket.business_name}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sun text-2xl font-black">#{activeTicket.ticket_number}</p>
                  <p className="text-white/70 text-xs">{t("tap_to_track")}</p>
                </div>
              </motion.div>
            </Link>
          ) : (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center gap-3 relative z-10"
            >
              <Zap className="w-5 h-5 text-white/40" />
              <p className="text-white/50 text-sm font-medium">{t("no_active_tickets")}</p>
            </motion.div>
          )}
        </div>

        {/* Main Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 -mt-6 pb-28">

          {/* Search */}
          <div className="relative mb-5">
            <div className="absolute inset-y-0 inset-s-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-accent/30 dark:text-white/30" />
            </div>
            <input
              type="text"
              placeholder={t("search_businesses")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-12 pe-4 py-4 rounded-2xl bg-cream border-transparent focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-accent font-medium shadow-sm dark:bg-[#1a1a1a] dark:text-white dark:placeholder:text-white/30"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6 md:mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "bg-cream dark:bg-[#1a1a1a] text-accent/50 dark:text-white/50 hover:bg-primary/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Business Cards */}
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {loadingBiz ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((biz, i) => (
                  <motion.div
                    key={biz.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="h-full"
                  >
                    <Link href={`/queue/${biz.id}`} className="block h-full">
                      <div className="bg-white dark:bg-[#1a1a1a] h-full rounded-3xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all group border border-primary/5 dark:border-white/5">
                        {/* Image or Color Banner */}
                        <div
                          className={`h-24 relative flex items-end p-4 bg-cover bg-center bg-linear-to-r ${CARD_COLORS[biz.category] ?? CARD_COLORS.general}`}
                          style={biz.image_url ? { backgroundImage: `url(${biz.image_url})` } : {}}
                        >
                          {/* Dark overlay for readability if using an image */}
                          {biz.image_url && <div className="absolute inset-0 bg-black/40" />}
                          <div className="relative z-10 w-full flex justify-between items-end">
                            <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                              {biz.category}
                            </span>
                            {!biz.is_active && (
                              <span className="text-white text-xs font-bold bg-red-500/80 px-3 py-1 rounded-full backdrop-blur-sm">
                                {t("closed")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-accent dark:text-white text-base">{biz.name}</h3>
                            <div className="flex items-center gap-1 mt-1 text-accent/50 dark:text-white/50 text-xs">
                              <MapPin className="w-3 h-3" />
                              <span>{biz.address}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1 text-xs font-bold text-accent/60 dark:text-white/60">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                ~10 {t("min")}
                              </div>
                              <div className="flex items-center gap-1 text-xs font-bold text-accent/60 dark:text-white/60">
                                <Users className="w-3.5 h-3.5 text-secondary" />
                                {t("live_queue")}
                              </div>
                              <div className="flex items-center gap-1 text-xs font-bold text-accent/60 dark:text-white/60">
                                <Star className="w-3.5 h-3.5 text-sun" />
                                4.8
                              </div>
                            </div>
                          </div>
                          <div className={`w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all mt-1 ${dir === 'rtl' ? 'rotate-180' : ''}`}>
                            <ChevronRight className="w-5 h-5 text-primary group-hover:text-white" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}

                {filtered.length === 0 && !loadingBiz && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-accent/30 dark:text-white/30">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-bold">{t("no_businesses")}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Modal */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-2xl font-black text-accent dark:text-white">{t("notifications") || "Notifications"}</h2>
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
