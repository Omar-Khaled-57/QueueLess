"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users, BarChart3,
  PhoneCall, SkipForward, UserX, ChevronRight,
  TrendingUp, Clock, CheckCircle, AlertCircle, Bell
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { queueAPI, businessAPI, notificationsAPI, type Ticket, type Business, type Queue, type QueueAnalytics, type Notification } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useTranslation } from "@/hooks/useTranslation";
import ThemeLangToggle from "@/components/ThemeLangToggle";

type View = "dashboard" | "queue" | "analytics";
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";


export default function AdminDashboard() {
  const { user, token } = useAuth();
  const { t, dir, locale } = useTranslation();
  const [view, setView] = useState<View>("dashboard");
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [queueInfo, setQueueInfo] = useState<Queue | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [analytics, setAnalytics] = useState<QueueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (!user || !token) return;
    async function load() {
      try {
        const { businesses } = await businessAPI.list();
        const myBiz = businesses.find(b => b.owner_id === user?.id);
        if (myBiz) {
          setBusiness(myBiz);
          const bizRes = await businessAPI.get(myBiz.id);
          const q = bizRes.queues[0]; // Active queue
          if (q) {
            setQueueInfo(q);
            const [tix, anly] = await Promise.all([
              queueAPI.tickets(q.id),
              queueAPI.analytics(q.id, token!)
            ]);
            setTickets(tix.tickets);
            setAnalytics(anly);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, token]);

  // Fetch notifications
  useEffect(() => {
    if (!token) return;
    notificationsAPI.getAll(token)
      .then(r => {
        setNotifications(r.notifications);
        setUnreadCount(r.notifications.filter(n => !n.is_read).length);
      })
      .catch(console.error);
  }, [token]);

  // Socket connection
  useEffect(() => {
    if (!queueInfo) return;
    const socket: Socket = io(SOCKET_URL);
    socket.emit("join_queue_room", queueInfo.id.toString());
    
    socket.on("queue:update", () => {
      // Refresh tickets & analytics
      if (token) {
        queueAPI.tickets(queueInfo.id).then(r => setTickets(r.tickets)).catch(console.error);
        queueAPI.analytics(queueInfo.id, token).then(setAnalytics).catch(console.error);
      }
    });

    return () => {
      socket.emit("leave_queue_room", queueInfo.id.toString());
      socket.disconnect();
    };
  }, [queueInfo, token]);

  const serving = tickets.find((t) => t.status === "serving");
  const waiting = tickets.filter((t) => t.status === "waiting");

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

  const callNext = async () => {
    if (!queueInfo || !token) return;
    try {
      await queueAPI.next(queueInfo.id, token);
    } catch (err) { console.error(err); }
  };

  const skipCurrent = async () => {
    if (!queueInfo || !token) return;
    try {
      await queueAPI.skip(queueInfo.id, token);
      await callNext();
    } catch (err) { console.error(err); }
  };

  const noShow = async (ticketId: number) => {
    if (!queueInfo || !token) return;
    try {
      await queueAPI.cancel(queueInfo.id, ticketId, token);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10"/></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row items-start transition-colors duration-300" dir={dir}>
      <Navigation />
      <div className="w-full md:ms-64 min-h-screen bg-white dark:bg-background md:bg-cream md:dark:bg-background shadow-2xl md:shadow-none flex flex-col relative transition-all">

        {/* Header */}
        <div className="bg-primary px-6 pt-10 pb-16 arch-header relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          {/* Top-right toggles */}
          <div className="flex justify-end mb-4 relative z-10">
            <ThemeLangToggle glassOnPrimary />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-white/60 text-sm font-medium">{t("admin_panel")}</p>
              <h1 className="text-white text-2xl font-bold">
                {(locale === "ar" && business?.name_ar) ? business.name_ar : (business?.name || "My Business")}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/analytics" className="hidden sm:block px-4 py-2 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
                {t("view_analytics")}
              </Link>
              <button
                onClick={() => setIsNotifModalOpen(true)}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-sun text-accent text-[10px] font-black rounded-full flex items-center justify-center border-2 border-primary">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-sun rounded-full border-2 border-secondary" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="md:grid md:grid-cols-3 flex gap-3 mt-6 relative z-10 md:mb-4">
            {[
              { value: waiting.length, label: t("waiting") },
              { value: analytics?.served_today ?? 0, label: t("served") },
              { value: `~${queueInfo?.avg_service_time_min ?? 0}${t("min")}`, label: t("avg_wait") },
            ].map(({ value, label }) => (
              <div key={label} className="flex-1 bg-white/15 backdrop-blur rounded-2xl p-3 text-center">
                <p className="text-white font-black text-xl leading-none">{value}</p>
                <p className="text-white/60 text-xs mt-1 font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 mt-6 pb-28 space-y-6">

          {/* Mobile View Tabs */}
          <div className="flex gap-2 mb-4 md:hidden">
            {[
              { key: "dashboard" as View, label: t("dashboard") },
              { key: "queue" as View, label: t("queue_list") },
              { key: "analytics" as View, label: t("analytics") },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setView(key)}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${
                  view === key ? "bg-primary text-white shadow-md" : "bg-white dark:bg-[#1a1a1a] text-accent/50 dark:text-white/50"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Combined Now Serving + Waiting List for Desktop */}
          <div className="md:grid md:grid-cols-2 md:gap-8">
            {/* Left Pane: Action Area — visible on desktop always, on mobile only in dashboard view */}
            <div className={`${view !== "dashboard" ? "hidden" : ""} md:block`}>
              <AnimatePresence mode="wait">
                <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {serving ? (
                  <motion.div layout className="bg-linear-to-br from-primary to-primary-light rounded-3xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 bg-sun rounded-full animate-pulse" />
                      <span className="text-white/70 text-xs font-black uppercase tracking-wider">{t("now_serving")}</span>
                    </div>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-4xl font-black">#{String(serving.ticket_number).padStart(3, "0")}</p>
                        <p className="text-white/80 text-lg font-medium">{serving.user_name}</p>
                      </div>
                      <PhoneCall className="w-12 h-12 text-white/30" />
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={callNext}
                        className="flex-1 bg-white text-secondary py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                        {t("call_next")}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={skipCurrent}
                        className="flex-1 bg-white/20 text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
                      >
                        <SkipForward className="w-4 h-4" />
                        {t("skip")}
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white dark:bg-[#1a1a1a] border border-primary/5 dark:border-white/5 rounded-3xl p-6 text-center transition-colors">
                    <AlertCircle className="w-10 h-10 text-accent/20 dark:text-white/20 mx-auto mb-2 transition-colors" />
                    <p className="font-bold text-accent/40 dark:text-white/40 transition-colors">{t("no_one_serving")}</p>
                    {waiting.length > 0 && (
                      <motion.button whileTap={{ scale: 0.96 }} onClick={callNext} className="mt-4 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm">
                        {t("call_first")}
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Pane: WaitList Full — visible on desktop always, on mobile only in queue view */}
            <div className={`${view !== "queue" ? "hidden" : ""} md:block`}>
              <AnimatePresence mode="wait">
                <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h2 className="font-bold text-accent/50 dark:text-white/50 text-xs uppercase tracking-widest mb-3 transition-colors">
                    {t("waiting_list")} ({waiting.length})
                  </h2>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {waiting.map((ticket, i) => (
                        <motion.div
                          key={ticket.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] border border-primary/5 dark:border-white/5 p-4 rounded-2xl transition-colors"
                        >
                          <div className="w-9 h-9 bg-cream dark:bg-[#2a2a2a] rounded-xl flex items-center justify-center font-black text-accent/40 dark:text-white/40 text-sm shrink-0 transition-colors">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-accent dark:text-white text-sm transition-colors">{ticket.user_name}</p>
                            <p className="text-accent/40 dark:text-white/40 text-xs transition-colors">
                              #{String(ticket.ticket_number).padStart(3, "0")} · ~{i * (queueInfo?.avg_service_time_min ?? 10)}{t("min")} {t("waiting")}
                            </p>
                          </div>
                          {user?.role === "admin" && (
                            <button onClick={() => noShow(ticket.id)} className="w-8 h-8 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
                              <UserX className="w-4 h-4 text-rose-400" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {waiting.length === 0 && (
                      <div className="text-center py-10 text-accent/30 dark:text-white/30 transition-colors">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="font-bold">{t("queue_empty")}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile analytics — hidden on desktop (shown in main grid via Link) */}
          <div className={`${view !== "analytics" ? "hidden" : ""} md:hidden`}>
            <AnimatePresence mode="wait">
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Stat cards — live data */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: t("served_today"), value: analytics?.served_today ?? 0, icon: CheckCircle, color: "text-primary", bg: "bg-primary/10 dark:bg-primary/20" },
                    { label: t("avg_wait"), value: `~${analytics?.avg_wait_min ?? 0}${t("min")}`, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
                    { label: t("no_shows"), value: analytics?.no_shows_today ?? 0, icon: UserX, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
                    { label: t("total_queued"), value: (analytics?.served_today ?? 0) + (analytics?.no_shows_today ?? 0), icon: TrendingUp, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white dark:bg-[#1a1a1a] border border-primary/5 dark:border-white/5 rounded-3xl p-5 space-y-3 transition-colors">
                      <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-accent dark:text-white transition-colors">{value}</p>
                        <p className="text-accent/40 dark:text-white/40 transition-colors text-xs font-bold uppercase tracking-wide">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Peak hours — live from hourly_distribution */}
                <div className="bg-white dark:bg-[#1a1a1a] border border-primary/5 dark:border-white/5 rounded-3xl p-5 transition-colors">
                  <h3 className="font-bold text-accent dark:text-white mb-4 transition-colors">{t("peak_hours")}</h3>
                  <div className="flex items-end gap-2 h-24">
                    {Array.from({ length: 8 }, (_, i) => i + 9).map((h, i) => {
                      const match = analytics?.hourly_distribution.find(hd => Number(hd.hour) === h);
                      const count = match ? Number(match.count) : 0;
                      const maxC = Math.max(...(analytics?.hourly_distribution.map(hd => Number(hd.count)) ?? [1]), 1);
                      const pct = Math.round((count / maxC) * 100);
                      const label = h > 12 ? `${h - 12}PM` : `${h}AM`;
                      return (
                        <div key={h} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ delay: i * 0.07, type: "spring" }}
                            className={`w-full rounded-t-lg ${pct >= 90 ? "bg-primary" : "bg-primary/30"}`}
                            style={{ height: `${pct}%` }}
                          />
                          <span className="text-accent/30 dark:text-white/30 text-[9px] font-bold transition-colors">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Link to full analytics page */}
                <Link href="/admin/analytics" className="block">
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    {t("view_analytics")}
                  </motion.div>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      {/* Notifications Modal */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-2xl font-black text-accent dark:text-white">{t("notifications")}</h2>
              <button onClick={() => setIsNotifModalOpen(false)} className="text-accent/40 hover:text-accent p-2">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2 pb-4">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-accent/40 font-bold">{t("no_notifications")}</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)} className={`p-4 rounded-xl border transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5 border-primary/20' : 'bg-(--color-cream) dark:bg-[#111] border-transparent'}`}>
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


