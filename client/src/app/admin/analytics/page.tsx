"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft, Users, Clock, CheckCircle, UserX,
  TrendingUp, TrendingDown, BarChart3, Calendar, Loader2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { queueAPI, businessAPI, type QueueAnalytics, type Business, type Queue } from "@/lib/api";
import Navigation from "@/components/Navigation";
import { useTranslation } from "@/hooks/useTranslation";
import ThemeLangToggle from "@/components/ThemeLangToggle";


export default function AnalyticsPage() {
  const { user, token } = useAuth();
  const { t, dir } = useTranslation();
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [queueInfo, setQueueInfo] = useState<Queue | null>(null);
  const [analytics, setAnalytics] = useState<QueueAnalytics | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ day: string; served: number; noshow: number }[]>([]);
  const [loading, setLoading] = useState(true);

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
            const [anly, weekly] = await Promise.all([
              queueAPI.analytics(q.id, token!),
              queueAPI.weeklyAnalytics(q.id, token!),
            ]);
            setAnalytics(anly);
            setWeeklyData(weekly.weekly.map(r => ({ day: r.day, served: Number(r.served), noshow: Number(r.noshow) })));
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

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10"/></div>;
  }

  const statCards = [
    { label: "Served Today", value: analytics?.served_today ?? 0, icon: CheckCircle, color: "text-primary", bg: "bg-primary/10" },
    { label: "Avg Wait", value: `~${analytics?.avg_wait_min ?? 0}m`, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "No-Shows", value: analytics?.no_shows_today ?? 0, icon: UserX, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "Total Queued", value: (analytics?.served_today ?? 0) + (analytics?.no_shows_today ?? 0), icon: Users, color: "text-sky-500", bg: "bg-sky-50" },
  ];

  // Convert DB hourly data (0-23) to UI format
  const hoursData = Array.from({ length: 8 }, (_, i) => i + 9); // 9AM to 4PM
  const peakHours = hoursData.map(h => {
    const dbMatch = analytics?.hourly_distribution.find(hd => Number(hd.hour) === h);
    const count = dbMatch ? Number(dbMatch.count) : 0;
    return {
      hour: h > 12 ? `${h-12}PM` : `${h}AM`,
      count
    };
  });
  const maxCount = Math.max(...peakHours.map(ph => ph.count), 1);
  const peakHour = peakHours.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), { hour: "N/A", count: 0 });
  // Compute health score from real metrics
  const servedToday = analytics?.served_today ?? 0;
  const noShowsToday = analytics?.no_shows_today ?? 0;
  const totalToday = servedToday + noShowsToday;
  const noShowRate = totalToday > 0 ? Math.round((noShowsToday / totalToday) * 100) : 0;
  const onTimeRate = analytics?.avg_wait_min != null && analytics.avg_wait_min <= (queueInfo?.avg_service_time_min ?? 15)
    ? Math.min(100, Math.round(100 - (analytics.avg_wait_min / (queueInfo?.avg_service_time_min ?? 15)) * 20))
    : Math.max(0, 100 - (analytics?.avg_wait_min ?? 0) * 2);
  const satisfactionEst = totalToday > 0 ? Math.max(0, Math.round(100 - noShowRate * 1.5)) : 85;
  const healthScore = Math.round((onTimeRate + satisfactionEst + (100 - noShowRate)) / 3);

  // Dynamic weekly chart
  const maxServed = Math.max(...weeklyData.map(d => d.served), 1);
  const bestDay = weeklyData.reduce<{ day: string; served: number } | null>(
    (prev, curr) => (!prev || curr.served > prev.served ? curr : prev), null
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row items-start transition-colors duration-300" dir={dir}>
      <Navigation />
      <div className="w-full md:ms-64 min-h-screen bg-white dark:bg-background md:bg-cream md:dark:bg-background shadow-2xl md:shadow-none flex flex-col relative transition-all">

        {/* Header */}
        <div className="bg-primary px-6 pt-10 pb-16 arch-header relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          {/* Top-right toggles */}
          <div className="flex justify-end mb-4 relative z-10">
            <div className="[&>div]:bg-white/10 [&>div]:border-white/20 [&_button]:bg-white/20 [&_button]:text-white">
              <ThemeLangToggle />
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <Link href="/admin" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-white text-2xl font-bold">Analytics</h1>
              <p className="text-white/60 text-sm">{business?.name || "Business Dashboard"}</p>
            </div>
          </div>

          {/* Period Toggle */}
          <div className="flex gap-2 mt-6 relative z-10">
            {["Today", "This Week", "This Month"].map((p, i) => (
              <button
                key={p}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${i === 0 ? "bg-white text-secondary" : "bg-white/20 text-white/70"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 mt-6 mb-6 portrait:pb28 pb-12 space-y-6 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white dark:bg-[#1a1a1a] border border-primary/5 dark:border-white/5 rounded-3xl p-5 space-y-3 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-accent dark:text-white transition-colors">{value}</p>
                  <p className="text-accent/40 dark:text-white/40 text-xs font-bold uppercase tracking-wide mt-0.5 transition-colors">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Peak Hours Chart */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-primary/5 dark:border-white/5 rounded-3xl p-5 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-accent dark:text-white transition-colors">Peak Hours</h3>
              <div className="flex items-center gap-1 text-accent/40 text-xs font-bold">
                <BarChart3 className="w-3.5 h-3.5" />
                Patients / hour
              </div>
            </div>
            <div className="flex items-end gap-2" style={{ height: "100px" }}>
              {peakHours.map(({ hour, count }, i) => {
                const barH = Math.round((count / maxCount) * 76);
                const pct = (count / maxCount) * 100;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center justify-end" style={{ height: "100px" }}>
                    <span className="text-accent/40 dark:text-white/40 text-[9px] font-bold mb-1 transition-colors">{count}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: barH }}
                      transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 18 }}
                      className={`w-full rounded-t-lg ${
                        pct >= 90 ? "bg-primary" : pct >= 60 ? "bg-primary/50" : "bg-primary/25"
                      }`}
                      style={{ height: `${barH}px` }}
                    />
                    <span className="text-accent/30 dark:text-white/30 text-[9px] font-bold mt-1.5 transition-colors">{hour}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-accent/30 dark:text-white/30 text-xs text-center mt-2 font-medium transition-colors">
              Peak at {peakHour.hour} with {peakHour.count} patients
            </p>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] border border-primary/5 dark:border-white/5 rounded-3xl p-5 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-accent dark:text-white transition-colors">This Week</h3>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1 text-primary"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Served</span>
                <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />No-show</span>
              </div>
            </div>
            {weeklyData.length === 0 ? (
              <p className="text-center text-accent/30 dark:text-white/30 py-8 font-bold text-sm">No data for the past 7 days yet.</p>
            ) : (
              <>
                <div className="relative flex items-end gap-2" style={{ height: "90px" }}>
                  {weeklyData.map(({ day, served, noshow }, i) => {
                    const servedH = Math.round((served / maxServed) * 72);
                    const noshowH = noshow > 0 ? Math.max(4, Math.round((noshow / maxServed) * 20)) : 0;
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center justify-end" style={{ height: "90px" }}>
                        <div className="w-full flex flex-col items-center justify-end gap-0.5" style={{ height: "72px" }}>
                          {noshowH > 0 && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: noshowH }}
                              transition={{ delay: i * 0.06 + 0.2, type: "spring", stiffness: 180 }}
                              className="w-full rounded-sm bg-rose-300"
                              style={{ height: `${noshowH}px` }}
                            />
                          )}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: servedH }}
                            transition={{ delay: i * 0.06, type: "spring", stiffness: 180 }}
                            className={`w-full rounded-t-lg ${served === maxServed ? "bg-primary" : "bg-primary/40"}`}
                            style={{ height: `${servedH}px` }}
                          />
                        </div>
                        <span className="text-accent/30 dark:text-white/30 text-[9px] font-bold mt-1.5 transition-colors">{day}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-accent/30 dark:text-white/30 text-xs text-center mt-2 font-medium transition-colors">
                  {bestDay ? `Best day: ${bestDay.day} (${bestDay.served} served)` : "Collecting data…"}
                </p>
              </>
            )}
          </div>

          {/* Queue Health Score — computed dynamically */}
          <div className="bg-linear-to-br from-primary to-primary-light rounded-3xl p-6 text-white portrait:mb-20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Queue Health Score</p>
                <p className="text-5xl font-black mt-2">{healthScore}<span className="text-2xl text-white/50">/100</span></p>
                <p className="text-white/80 text-sm mt-1 font-medium">
                  {healthScore >= 85 ? "Great performance today 🎉" : healthScore >= 65 ? "Doing well, keep it up 👍" : "Needs attention today ⚠️"}
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                {healthScore >= 65 ? <TrendingUp className="w-8 h-8 text-white" /> : <TrendingDown className="w-8 h-8 text-white" />}
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {[
                { label: "On-time service rate", pct: Math.min(100, onTimeRate) },
                { label: "Customer satisfaction (est.)", pct: satisfactionEst },
                { label: "No-show rate (lower = better)", pct: Math.max(0, 100 - noShowRate) },
              ].map(({ label, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs font-bold text-white/70 mb-1">
                    <span>{label}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                      className="h-full bg-white/80 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
