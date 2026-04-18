"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Users, Clock, ToggleLeft, ToggleRight,
  Plus, ChevronRight, Loader2, CheckCircle, XCircle, Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { queueAPI, businessAPI, type Business, type Queue, type Ticket } from "@/lib/api";
import Navigation from "@/components/Navigation";
import { useTranslation } from "@/hooks/useTranslation";
import ThemeLangToggle from "@/components/ThemeLangToggle";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type QueueWithStats = Queue & {
  waiting: number;
  serving: number;
  tickets: Ticket[];
};

export default function QueueListPage() {
  const { user, token } = useAuth();
  const { dir } = useTranslation();

  const [business, setBusiness] = useState<Business | null>(null);
  const [queues, setQueues] = useState<QueueWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newQueueName, setNewQueueName] = useState("");
  const [newAvgTime, setNewAvgTime] = useState("10");
  const [creating, setCreating] = useState(false);

  const loadQueues = async () => {
    if (!user || !token) return;
    try {
      const { businesses } = await businessAPI.list();
      const myBiz = businesses.find(b => b.owner_id === user.id);
      if (!myBiz) return;
      setBusiness(myBiz);
      const bizRes = await businessAPI.get(myBiz.id);
      const enriched = await Promise.all(
        bizRes.queues.map(async (q) => {
          const { tickets } = await queueAPI.tickets(q.id);
          return {
            ...q,
            waiting: tickets.filter(t => t.status === "waiting").length,
            serving: tickets.filter(t => t.status === "serving").length,
            tickets,
          };
        })
      );
      setQueues(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueues(); }, [user, token]);

  // Live socket updates for all queues
  useEffect(() => {
    if (!queues.length) return;
    const sockets: Socket[] = queues.map(q => {
      const s: Socket = io(SOCKET_URL);
      s.emit("join_queue_room", q.id.toString());
      s.on("queue:update", () => loadQueues());
      return s;
    });
    return () => sockets.forEach(s => s.disconnect());
  }, [queues.map(q => q.id).join(",")]);

  const handleToggle = async (q: QueueWithStats) => {
    if (!token) return;
    setTogglingId(q.id);
    try {
      await queueAPI.open(q.id, !q.is_open, token);
      setQueues(prev => prev.map(item =>
        item.id === q.id ? { ...item, is_open: !q.is_open } : item
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    if (!token || !business || !newQueueName.trim()) return;
    setCreating(true);
    try {
      await queueAPI.create({
        business_id: business.id,
        name: newQueueName.trim(),
        avg_service_time_min: Number(newAvgTime) || 10,
      }, token);
      setNewQueueName("");
      setNewAvgTime("10");
      setShowCreate(false);
      await loadQueues();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create queue");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center transition-colors">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row items-start transition-colors duration-300" dir={dir}>
      <Navigation />
      <div className="w-full md:ms-64 min-h-screen bg-white dark:bg-background md:bg-cream md:dark:bg-background shadow-2xl md:shadow-none flex flex-col relative transition-all">

        {/* Header */}
        <div className="bg-primary px-6 pt-10 pb-16 arch-header relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />

          {/* Toggles */}
          <div className="flex justify-end mb-4 relative z-10">
            <div className="[&>div]:bg-white/10 [&>div]:border-white/20 [&_button]:bg-white/20 [&_button]:text-white">
              <ThemeLangToggle />
            </div>
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <p className="text-white/70 text-sm font-medium">Queue Management</p>
                <h1 className="text-white text-2xl font-bold">{business?.name || "My Business"}</h1>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors border border-white/20"
            >
              <Plus className="w-4 h-4" />
              New Queue
            </motion.button>
          </div>

          {/* Summary Pills */}
          <div className="flex gap-3 mt-6 relative z-10">
            {[
              { label: "Total Queues", value: queues.length },
              { label: "Open Now", value: queues.filter(q => q.is_open).length },
              { label: "Waiting", value: queues.reduce((s, q) => s + q.waiting, 0) },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 bg-white/15 backdrop-blur rounded-2xl p-3 text-center">
                <p className="text-white font-black text-xl leading-none">{value}</p>
                <p className="text-white/60 text-xs mt-1 font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Queue Cards */}
        <div className="flex-1 px-6 mt-6 pb-32 space-y-4">
          <AnimatePresence>
            {queues.map((q, i) => {
              const serving = q.tickets.find(t => t.status === "serving");
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white dark:bg-[#1a1a1a] border border-primary/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm transition-colors"
                >
                  {/* Status bar */}
                  <div className={`h-1.5 w-full ${q.is_open ? "bg-primary" : "bg-accent/10 dark:bg-white/10"}`} />

                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="font-black text-accent dark:text-white text-lg transition-colors">{q.name}</h2>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.is_open ? "bg-primary/10 text-primary" : "bg-accent/10 dark:bg-white/10 text-accent/50 dark:text-white/40"}`}>
                            {q.is_open ? "OPEN" : "CLOSED"}
                          </span>
                        </div>
                        <p className="text-accent/40 dark:text-white/40 text-sm transition-colors">
                          ~{q.avg_service_time_min} min avg · Queue #{q.id}
                        </p>
                      </div>

                      {/* Open/Close Toggle */}
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleToggle(q)}
                        disabled={togglingId === q.id}
                        className="shrink-0 transition-colors"
                        title={q.is_open ? "Close queue" : "Open queue"}
                      >
                        {togglingId === q.id ? (
                          <Loader2 className="w-9 h-9 animate-spin text-primary/50" />
                        ) : q.is_open ? (
                          <ToggleRight className="w-9 h-9 text-primary" />
                        ) : (
                          <ToggleLeft className="w-9 h-9 text-accent/20 dark:text-white/20" />
                        )}
                      </motion.button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { icon: Users, label: "Waiting", value: q.waiting, color: "text-primary" },
                        { icon: Zap, label: "Serving", value: q.serving, color: "text-amber-500" },
                        { icon: Clock, label: "Avg Wait", value: `~${q.avg_service_time_min}m`, color: "text-sky-500" },
                      ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="bg-cream dark:bg-[#111] rounded-2xl p-3 text-center transition-colors">
                          <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                          <p className="font-black text-accent dark:text-white text-base leading-none transition-colors">{value}</p>
                          <p className="text-accent/40 dark:text-white/40 text-[10px] font-bold mt-0.5 transition-colors">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Now Serving mini-card */}
                    {serving ? (
                      <div className="flex items-center gap-3 bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-2xl p-3 mb-4 transition-colors">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse shrink-0" />
                        <p className="text-primary font-bold text-sm">
                          Now serving <span className="font-black">#{String(serving.ticket_number).padStart(3, "0")}</span>
                          {serving.user_name && <span className="font-normal text-primary/70"> — {serving.user_name}</span>}
                        </p>
                      </div>
                    ) : q.is_open ? (
                      <div className="flex items-center gap-3 bg-accent/5 dark:bg-white/5 rounded-2xl p-3 mb-4 transition-colors">
                        <CheckCircle className="w-4 h-4 text-accent/20 dark:text-white/20 shrink-0" />
                        <p className="text-accent/40 dark:text-white/40 text-sm font-bold">No one currently being served</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-accent/5 dark:bg-white/5 rounded-2xl p-3 mb-4 transition-colors">
                        <XCircle className="w-4 h-4 text-accent/20 dark:text-white/20 shrink-0" />
                        <p className="text-accent/40 dark:text-white/40 text-sm font-bold">Queue is closed</p>
                      </div>
                    )}

                    {/* Link to live queue page */}
                    <Link href={`/queue/${business?.id}`}>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-primary/10 dark:bg-primary/15 text-primary rounded-2xl py-3 font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/15 dark:hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        View Live Queue
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {queues.length === 0 && (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-accent/20 dark:text-white/20 mx-auto mb-3" />
              <p className="font-black text-accent/40 dark:text-white/40 text-lg">No queues yet</p>
              <p className="text-accent/30 dark:text-white/30 text-sm mt-1">Create your first queue to get started.</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)}
                className="mt-6 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm"
              >
                + Create Queue
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Create Queue Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 shadow-2xl transition-colors"
            >
              <h2 className="text-xl font-black text-accent dark:text-white mb-1">New Queue</h2>
              <p className="text-accent/50 dark:text-white/40 text-sm mb-6">Add a new queue to your business.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-accent/50 dark:text-white/50 uppercase tracking-widest mb-2 block">Queue Name</label>
                  <input
                    type="text"
                    value={newQueueName}
                    onChange={e => setNewQueueName(e.target.value)}
                    placeholder="e.g. Main Counter, VIP Line..."
                    className="w-full bg-cream dark:bg-[#0f0f0f] border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none font-bold text-accent dark:text-white placeholder:font-normal placeholder:text-accent/30 dark:placeholder:text-white/30 transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-accent/50 dark:text-white/50 uppercase tracking-widest mb-2 block">Avg Service Time (minutes)</label>
                  <input
                    type="number"
                    value={newAvgTime}
                    onChange={e => setNewAvgTime(e.target.value)}
                    min={1}
                    max={120}
                    className="w-full bg-cream dark:bg-[#0f0f0f] border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none font-bold text-accent dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-accent/60 dark:text-white/60 bg-cream dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  disabled={creating || !newQueueName.trim()}
                  className="flex-1 py-3 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/30 disabled:opacity-50 transition-all"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
