"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock, Users, CheckCircle, PhoneCall, XCircle, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, startTransition, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { queueAPI, businessAPI, getBusinessImage, type Ticket, type Business, type Queue } from "@/lib/api";
import Navigation from "@/components/Navigation";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function QueuePage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [queueInfo, setQueueInfo] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  
  // Scheduling state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notify30Mins, setNotify30Mins] = useState(true);
  
  const { t, dir, locale } = useTranslation();

  const fetchState = useCallback(async () => {
    if (!id) return;
    try {
      const bizRes = await businessAPI.get(Number(id));
      startTransition(() => setBusiness(bizRes.business));
      const q = bizRes.queues[0];
      if (q) {
        startTransition(() => setQueueInfo(q));
        const tixRes = await queueAPI.tickets(q.id, selectedDate);
        startTransition(() => setTickets(tixRes.tickets));
      }
    } catch (err) {
      console.error(err);
    } finally {
      startTransition(() => setLoading(false));
    }
  }, [id, selectedDate]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (!queueInfo) return;
    const socket: Socket = io(SOCKET_URL);
    socket.emit("join_queue_room", queueInfo.id.toString());

    socket.on("queue:update", () => {
      // Re-fetch tickets on any update
      queueAPI.tickets(queueInfo.id, selectedDate)
        .then(r => setTickets(r.tickets))
        .catch(console.error);
    });

    return () => {
      socket.emit("leave_queue_room", queueInfo.id.toString());
      socket.disconnect();
    };
  }, [queueInfo, selectedDate]);

  const serving = tickets.find((t) => t.status === "serving");
  const waiting = tickets.filter((t) => t.status === "waiting" || (user && t.user_id === user.id));
  const myTicket = user ? tickets.find((t) => t.user_id === user.id && (t.status === "waiting" || t.status === "serving")) : null;
  const myPosition = waiting.findIndex((t) => user && t.user_id === user.id) + 1;
  const joined = !!myTicket;

  const handleJoin = async () => {
    if (!token || !queueInfo) {
      router.push("/login");
      return;
    }
    setJoining(true);
    try {
      const settings = notify30Mins ? [30] : [];
      await queueAPI.join(queueInfo.id, selectedDate, settings, token);
      // Wait a moment then fetch so socket catches up or just fetch directly
      const tixRes = await queueAPI.tickets(queueInfo.id, selectedDate);
      setTickets(tixRes.tickets);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  const handleCancel = async () => {
    if (!token || !queueInfo || !myTicket) return;
    if (!confirm(t("cancel_turn_confirm"))) return;
    try {
      await queueAPI.cancel(queueInfo.id, myTicket.id, token);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10"/></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row items-start transition-colors duration-300" dir={dir}>
      <Navigation />
      <div className={`w-full ${user ? "md:ms-64" : ""} min-h-screen bg-white dark:bg-[#1a1a1a] md:bg-cream md:dark:bg-background shadow-md md:shadow-none flex flex-col relative transition-all overflow-x-hidden`}>

        {/* Header */}
        <div 
          className="bg-primary px-6 pt-10 pb-20 arch-header md:rounded-b-none md:rounded-bl-[4rem] relative overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url(${getBusinessImage(business!)})` }}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="flex items-center gap-4 relative z-10">
            <Link href="/home" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-white text-xl font-bold">
                {(locale === "ar" && business?.name_ar) ? business.name_ar : (business?.name || t("business"))}
              </h1>
              <p className="text-white/70 text-sm">
                {(locale === "ar" && queueInfo?.name_ar) ? queueInfo.name_ar : (queueInfo?.name || t("live_queue"))}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex gap-3 mt-6 relative z-10">
            {[
              { icon: Users, value: `${waiting.length}`, label: t("waiting") },
              { icon: Clock, value: queueInfo ? `~${queueInfo.avg_service_time_min}${t("min")}` : "-", label: t("avg_wait") },
              { icon: CheckCircle, value: "-", label: t("served_today") },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex-1 bg-white/20 backdrop-blur rounded-2xl p-3 text-center">
                <Icon className="w-4 h-4 text-white/70 mx-auto mb-1" />
                <p className="text-white font-black text-lg leading-none">{value}</p>
                <p className="text-white/60 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 mt-6 pb-40 space-y-6 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">

          <div className="space-y-6">
          
          {/* Scheduling Preferences */}
          {!joined && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-5 border border-primary/5 shadow-sm space-y-5"
            >
              <div>
                <h2 className="font-bold text-accent/60 dark:text-white/60 text-xs uppercase tracking-widest mb-2">{t("queue_date")}</h2>
                <input 
                  id="queue-date"
                  name="queue_date"
                  type="date" 
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  aria-label={t("queue_date")}
                  onChange={(e) => {
                    const d = new Date(e.target.value);
                    if (business?.operating_days && !business.operating_days.includes(d.getDay())) {
                      alert(t("closed_day_alert"));
                      return;
                    }
                    setSelectedDate(e.target.value);
                  }}
                  className="w-full bg-(--color-cream) dark:bg-[#0f0f0f] border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none font-bold text-accent dark:text-white transition-all cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
                <div>
                  <h3 className="font-bold text-accent dark:text-white text-sm">{t("notify_me")}</h3>
                  <p className="text-accent/60 dark:text-white/60 text-xs mt-0.5">{t("push_notifications")}</p>
                </div>
                <button
                  onClick={() => setNotify30Mins(!notify30Mins)}
                  aria-pressed={notify30Mins}
                  className={`relative w-11 h-7 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${notify30Mins ? 'bg-primary' : 'bg-black/10 dark:bg-white/10'}`}
                  style={{ minHeight: '28px' }}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${notify30Mins ? 'ltr:translate-x-full rtl:-translate-x-full' : 'translate-x-0'}`} />
                </button>
              </div>
            </motion.div>
          )}

            {/* Now Serving Card */}
          {serving && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-linear-to-br from-primary to-secondary rounded-3xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 bg-sun rounded-full animate-pulse" />
                <span className="text-white/80 text-xs font-bold uppercase tracking-wider">{t("now_serving")}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black">#{String(serving.ticket_number).padStart(3, "0")}</p>
                  <p className="text-white/80 font-medium">{serving.user_name}</p>
                </div>
                <PhoneCall className="w-10 h-10 text-white/40" />
              </div>
            </motion.div>
          )}

          {/* My Ticket (if joined) */}
          {joined && myTicket && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-sun/10 border-2 border-sun/30 rounded-3xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-sun" />
                <span className="text-accent/60 text-xs font-bold uppercase tracking-wider">{t("your_ticket")}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-black text-accent">#{String(myTicket.ticket_number).padStart(3, "0")}</p>
                  <p className="text-accent/60 font-medium mt-1">{t("position_in_queue", { position: myPosition })}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">~{(myPosition - 1) * (queueInfo?.avg_service_time_min || 10)}{t("min")}</p>
                  <p className="text-accent/40 text-xs font-bold">{t("est_wait")}</p>
                </div>
              </div>
            </motion.div>
          )}
          </div>

          {/* Queue List */}
          <div>
            <h2 className="font-bold text-accent/60 text-xs uppercase tracking-widest mb-4">{t("queue_list")}</h2>
            <div className="space-y-3">
              {waiting.map((ticket, i) => {
                const isMe = user && ticket.user_id === user.id;
                return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    ticket.status === "serving"
                      ? "bg-primary/10 border-2 border-primary/20"
                      : isMe
                      ? "bg-sun/10 border-2 border-sun/30"
                      : "bg-cream dark:bg-[#111] border border-black/5 dark:border-white/5 shadow-sm"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    ticket.status === "serving"
                      ? "bg-primary text-white"
                      : isMe
                      ? "bg-sun text-accent"
                      : "bg-white text-accent/40"
                  }`}>
                    {ticket.status === "serving" ? "●" : i + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${isMe ? "text-primary" : "text-accent"}`}>
                      {ticket.user_name} {isMe && "✨"}
                    </p>
                    <p className="text-accent/40 text-xs font-medium">#{String(ticket.ticket_number).padStart(3, "0")}</p>
                  </div>
                  <div className="text-right">
                    {ticket.status === "serving" ? (
                      <span className="text-primary text-xs font-black uppercase">{t("now_serving")}</span>
                    ) : (
                      <span className="text-accent/30 text-xs font-bold">~{i * (queueInfo?.avg_service_time_min || 10)}{t("min")}</span>
                    )}
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className={`fixed bottom-0 left-0 w-full ${user ? "md:ps-64" : ""} bg-transparent z-50 pointer-events-none`}>
          <div className="bg-white/95 dark:bg-[#111]/95 backdrop-blur-md border-t border-black/5 dark:border-white/5 px-6 py-5 pointer-events-auto shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            {!joined ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoin}
                disabled={joining}
                className="w-full max-w-7xl mx-auto block bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/30 ring-4 ring-primary/10 disabled:opacity-60 transition-all hover:bg-primary/95"
              >
                <div className="flex items-center justify-center gap-3">
                  {joining ? t("joining") : t("confirm_queue", { date: new Date(selectedDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US") })}
                  {!joining && <Users className="w-5 h-5" />}
                </div>
              </motion.button>
            ) : (
              <div className="flex gap-3 max-w-7xl mx-auto">
                <Link href={`/ticket/${myTicket.ticket_number}`} className="flex-1">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  className="w-full bg-cream text-accent/60 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 border-transparent hover:border-accent/10 transition-all cursor-pointer"
                >
                  <CheckCircle className="w-5 h-5" />
                  {t("view_ticket")}
                </motion.button>
              </Link>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleCancel}
                className="flex-1 bg-rose-50 text-rose-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 border-rose-100 hover:bg-rose-100 transition-all"
              >
                <XCircle className="w-5 h-5" />
                {t("cancel")}
              </motion.button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
