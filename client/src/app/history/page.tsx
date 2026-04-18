"use client";

import { motion } from "framer-motion";
import {
  Clock, CheckCircle, XCircle, RotateCcw,
  Home, History, User, Settings, MapPin, ChevronRight
} from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import ThemeLangToggle from "@/components/ThemeLangToggle";
import { useTranslation } from "@/hooks/useTranslation";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ticketAPI, type Ticket } from "@/lib/api";

const CARD_COLORS: Record<string, string> = {
  clinic:     "from-pink-400 to-rose-500",
  bank:       "from-purple-400 to-fuchsia-600",
  lab:        "from-amber-400 to-orange-500",
  government: "from-sky-400 to-blue-600",
  pharmacy:   "from-emerald-400 to-teal-600",
  general:    "from-slate-400 to-slate-600",
};

const STATUS_CONFIG: Record<string, { icon: any, label: string, color: string, bg: string }> = {
  done: { icon: CheckCircle, label: "Completed", color: "text-emerald-500", bg: "bg-emerald-50" },
  cancelled: { icon: XCircle, label: "Cancelled", color: "text-rose-500", bg: "bg-rose-50" },
  skipped: { icon: Clock, label: "Skipped", color: "text-amber-500", bg: "bg-amber-50" },
  waiting: { icon: Clock, label: "Waiting", color: "text-blue-500", bg: "bg-blue-50" },
  serving: { icon: Clock, label: "Serving", color: "text-purple-500", bg: "bg-purple-50" },
};


export default function HistoryPage() {
  const { t, dir } = useTranslation();
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (token) {
      ticketAPI.myHistory(token)
        .then((res) => setTickets(res.tickets))
        .catch(console.error);
    }
  }, [token]);

  const stats = {
    total: tickets.length,
    completed: tickets.filter((h) => h.status === "done").length,
    cancelled: tickets.filter((h) => h.status === "cancelled").length,
  };

  const getWaitTime = (t: Ticket) => {
    if (t.completed_at) {
      const diff = new Date(t.completed_at).getTime() - new Date(t.joined_at).getTime();
      return Math.floor(diff / 60000) + " min";
    }
    return "—";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row items-start transition-colors duration-300" dir={dir}>
      <Navigation />
      <div className="w-full md:ms-64 min-h-screen bg-cream md:bg-cream dark:bg-background md:dark:bg-background shadow-2xl md:shadow-none flex flex-col relative transition-all">

        {/* Header */}
        <div className="bg-primary px-6 pt-10 pb-16 arch-header md:rounded-b-none md:rounded-bl-[4rem] relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute bottom-4 -left-4 w-24 h-24 rounded-full bg-secondary/25" />
          <div className="relative z-10 flex justify-between items-start [&>div]:bg-white/10 [&>div]:border-white/20 [&_button]:bg-white/20 [&_button]:text-white">
            <div>
              <p className="text-white/70 text-sm font-medium">Your Activity</p>
              <h1 className="text-white text-3xl font-bold">{t("history")}</h1>
            </div>
            <ThemeLangToggle />
          </div>

          {/* Mini Stats */}
          <div className="flex gap-3 mt-6 relative z-10">
            {[
              { value: stats.total, label: "Total Visits" },
              { value: stats.completed, label: "Completed" },
              { value: stats.cancelled, label: "Cancelled" },
            ].map(({ value, label }) => (
              <div key={label} className="flex-1 bg-white/20 backdrop-blur rounded-2xl p-3 text-center">
                <p className="text-white font-black text-xl leading-none">{value}</p>
                <p className="text-white/60 text-xs mt-1 font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 mt-10 pb-28">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-accent/30 dark:text-white/30 h-64 mt-10">
              <span className="text-6xl mb-4">📭</span>
              <p className="text-xl font-bold">You haven't queued yet.</p>
              <p className="text-sm mt-1">Join a queue to see your history here.</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:mt-6">
              {tickets.map((item, i) => {
                const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.waiting;
                const Icon = cfg.icon;
                const catColor = item.category && CARD_COLORS[item.category.toLowerCase()] ? CARD_COLORS[item.category.toLowerCase()] : CARD_COLORS.general;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white dark:bg-[#1a1a1a] border border-primary/5 dark:border-white/5 rounded-3xl overflow-hidden transition-colors"
                  >
                    {/* Color accent bar */}
                    <div className={`h-1.5 w-full bg-linear-to-r ${catColor}`} />
                    <div className="p-5 flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-accent dark:text-white transition-colors">{item.business_name}</h3>
                            <div className="flex items-center gap-1 text-accent/40 dark:text-white/40 transition-colors text-xs mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span className="capitalize">{item.category}</span>
                              <span className="mx-1">·</span>
                              <span>{formatDate(item.joined_at)}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-black px-3 py-1 rounded-full shrink-0 ${cfg.bg} ${cfg.color} flex items-center gap-1 transition-colors border border-[currentColor]/10`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                          <div className="bg-cream dark:bg-[#2a2a2a] transition-colors rounded-xl px-3 py-2">
                            <p className="text-accent/40 dark:text-white/40 transition-colors text-[10px] font-bold uppercase tracking-wider">Ticket</p>
                            <p className="text-accent dark:text-white transition-colors font-black text-sm">#{String(item.ticket_number).padStart(3, '0')}</p>
                          </div>
                          <div className="bg-cream dark:bg-[#2a2a2a] transition-colors rounded-xl px-3 py-2">
                            <p className="text-accent/40 dark:text-white/40 transition-colors text-[10px] font-bold uppercase tracking-wider">Wait Time</p>
                            <p className="text-accent dark:text-white transition-colors font-black text-sm">{getWaitTime(item)}</p>
                          </div>
                          {item.status === "done" && (
                            <Link href={`/queue/${item.queue_id}`} className="ml-auto">
                              <div className="flex items-center gap-1 text-primary text-xs font-black">
                                <RotateCcw className="w-3.5 h-3.5" />
                                Again
                              </div>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
