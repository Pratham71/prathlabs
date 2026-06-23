"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "gate" | "rickroll" | "construction";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("gate");

  return (
    <AnimatePresence mode="wait">
      {phase === "gate" && (
        <motion.div
          key="gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-4"
        >
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-white text-4xl md:text-6xl font-bold tracking-widest">
              PRATHLABS
            </h1>
            <p className="text-zinc-400 text-sm mt-3 tracking-[0.3em] uppercase">
              Welcome
            </p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            onClick={() => setPhase("rickroll")}
            className="btn-glow mt-4 px-10 py-3 border border-white text-white text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-colors duration-200 cursor-pointer"
          >
            Enter
          </motion.button>
        </motion.div>
      )}

      {phase === "rickroll" && (
        <motion.div
          key="rickroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative bg-black"
          style={{ height: "100dvh" }}
        >
          <iframe
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&modestbranding=1&rel=0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 0.5 }}
            onClick={() => setPhase("construction")}
            className="absolute bottom-6 right-6 z-10 bg-black/70 text-white text-xs px-4 py-2 border border-white/40 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Skip »
          </motion.button>
        </motion.div>
      )}

      {phase === "construction" && (
        <motion.div
          key="construction"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Construction />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Construction() {
  const [visitors, setVisitors] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/visitors", { method: "POST" })
      .then((r) => r.json())
      .then((data: { count: number }) => setVisitors(data.count))
      .catch(() => setVisitors(null));

    document.body.classList.add("retro");
    return () => document.body.classList.remove("retro");
  }, []);

  const displayCount =
    visitors !== null ? String(visitors).padStart(6, "0") : "??????";

  const stagger = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 py-12 px-4 text-center font-mono">
      <motion.div
        {...stagger}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="construction-banner text-lg md:text-2xl font-black px-4 py-3 w-full max-w-xl"
      >
        🚧 UNDER CONSTRUCTION 🚧
      </motion.div>

      <motion.h1
        {...stagger}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-yellow-300 text-3xl md:text-4xl font-black drop-shadow-lg"
      >
        PrathLabs
      </motion.h1>

      <motion.p
        {...stagger}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-white text-xl"
      >
        <span className="blink">🚧</span>{" "}
        PrathLabs is under construction{" "}
        <span className="blink">🚧</span>
      </motion.p>

      <motion.div
        {...stagger}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="border-4 border-yellow-400 bg-black px-6 py-4"
      >
        <div className="text-yellow-400 text-xs mb-1 tracking-widest uppercase">
          Visitor Count
        </div>
        <div className="text-green-400 text-4xl tracking-[0.5em] font-black">
          {displayCount}
        </div>
      </motion.div>

      <motion.div
        {...stagger}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="w-full max-w-xl overflow-hidden border border-yellow-400/40 py-2 bg-black/40"
      >
        <span className="marquee-inner text-yellow-200 text-sm">
          ★ Coming Soon... Maybe... Probably Not... ★ &nbsp;&nbsp;&nbsp; ★
          Coming Soon... Maybe... Probably Not... ★
        </span>
      </motion.div>

      <motion.p
        {...stagger}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="text-zinc-400 text-xs mt-8"
      >
        Best viewed in Internet Explorer 6 · 800×600 resolution
      </motion.p>
    </div>
  );
}
