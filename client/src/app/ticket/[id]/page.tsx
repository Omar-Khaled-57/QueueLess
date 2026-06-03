"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, Users, Share2, Home, Download } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, startTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { ticketAPI, type Ticket } from "@/lib/api";
import { Loader2 } from "lucide-react";

// Simple QR-code-like visual built with SVG dots
function QRCodeDisplay({ value }: { value: string }) {
  // A decorative QR-looking pattern (not a real scannable QR)
  const size = 9;
  const pattern: boolean[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      // Corners
      if ((r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3)) return true;
      // Center data noise pattern based on value
      const seed = (r * size + c + value.charCodeAt(0)) % 3;
      return seed === 0;
    })
  );

  return (
    <div className="inline-flex flex-col gap-1 p-4 bg-white dark:bg-[#222] rounded-3xl shadow-inner border border-cream dark:border-white/10">
      {pattern.map((row, r) => (
        <div key={r} className="flex gap-1">
          {row.map((filled, c) => (
            <div
              key={c}
              className={`w-5 h-5 rounded-sm transition-colors ${filled ? "bg-accent dark:bg-white" : "bg-cream dark:bg-[#333]"}`}
            />
          ))}
        </div>
      ))}
      <p className="text-center text-accent/40 dark:text-white/40 text-xs font-bold tracking-widest mt-1">{value}</p>
    </div>
  );
}

export default function TicketConfirmPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      startTransition(() => setLoading(false));
      return;
    }
    ticketAPI.myActive(token).then((res) => {
      startTransition(() => setTicket(res.ticket));
    }).catch(console.error).finally(() => startTransition(() => setLoading(false)));
  }, [token, id]);

  const ticketId = `#${String(id).padStart(3, "0")}`;

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10"/></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Top Band */}
        <div className="bg-linear-to-br from-primary to-secondary p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 z-10 relative"
          >
            <CheckCircle className="w-9 h-9 text-primary" />
          </motion.div>

          <h1 className="text-2xl font-bold relative z-10">Your ticket is confirmed!</h1>
          <p className="text-white/70 text-sm mt-1 relative z-10">{ticket?.business_name || "Business"} • {ticket?.queue_name || "Queue"}</p>
        </div>

        {/* Ticket Body */}
        <div className="p-8 flex flex-col items-center gap-6">
          {/* Ticket Number */}
          <div className="text-center">
            <p className="text-accent/40 dark:text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Your Ticket</p>
            <motion.p
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="text-7xl font-black text-accent dark:text-white"
            >
              {ticketId}
            </motion.p>
          </div>

          {/* QR Code */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <QRCodeDisplay value={ticketId} />
            <p className="text-center text-accent/30 dark:text-white/30 text-xs mt-2 font-medium">Scan to check in at the venue</p>
          </motion.div>

          {/* Queue Info */}
            <div className="w-full grid grid-cols-2 gap-3">
              <div className="bg-cream dark:bg-[#111] rounded-2xl p-4 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="font-black text-accent dark:text-white text-lg">{ticket?.position_ahead ?? "-"}</p>
                <p className="text-accent/40 dark:text-white/40 text-xs font-bold">Before you</p>
              </div>
              <div className="bg-cream dark:bg-[#111] rounded-2xl p-4 text-center">
                <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="font-black text-accent dark:text-white text-lg">~{(ticket?.position_ahead ?? 0) * 10}m</p>
                <p className="text-accent/40 dark:text-white/40 text-xs font-bold">Est. wait</p>
              </div>
            </div>

            {/* Dashed Separator */}
            <div className="w-full border-t-2 border-dashed border-cream dark:border-white/10" />

            {/* Action Buttons */}
            <div className="w-full flex gap-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="flex-1 bg-cream dark:bg-[#111] text-accent/60 dark:text-white/60 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-cream/80 dark:hover:bg-[#222] transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="flex-1 bg-cream dark:bg-[#111] text-accent/60 dark:text-white/60 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-cream/80 dark:hover:bg-[#222] transition-all"
              >
                <Download className="w-4 h-4" />
                Save
              </motion.button>
            </div>

            <Link href="/home" className="w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-accent dark:bg-[#333] text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Bottom note */}
        <p className="mt-6 text-accent/30 dark:text-white/30 text-xs font-medium text-center">
          We&apos;ll notify you when your turn is close 🔔
        </p>
    </div>
  );
}
