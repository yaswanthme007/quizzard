"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

export default function LandingPage() {
  const reduced = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 flex flex-col overflow-hidden">
      {/* Floating gradient orbs */}
      {!reduced && (
        <>
          <motion.div
            animate={{ y: [0, -24, 0], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="pointer-events-none absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, -14, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="pointer-events-none absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-fuchsia-600/15 blur-3xl"
          />
        </>
      )}

      {/* Nav */}
      <motion.header
        initial={reduced ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full px-6 py-5 flex items-center justify-between"
      >
        <span className="font-display text-xl font-bold text-white tracking-tight">Quizzard</span>
        <Link
          href="/login"
          className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200"
        >
          Teacher Login →
        </Link>
      </motion.header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-12 gap-10">
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          animate="show"
          className="space-y-6 max-w-3xl"
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/8 border border-white/15 rounded-full text-xs font-medium text-white/70 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Powered by Groq AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]"
          >
            Turn any PDF into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
              a quiz
            </span>
            ,{" "}like magic.
          </motion.h1>

          {/* Tagline */}
          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-white/55 max-w-xl mx-auto leading-relaxed">
            Upload a document, let AI generate questions, and host a live quiz your students
            join instantly from their phones — no accounts needed.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5 justify-center pt-2">
            {/* Teacher path */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                whileHover={reduced ? {} : { scale: 1.03, boxShadow: "0 0 32px rgba(99,102,241,0.5)" }}
                whileTap={reduced ? {} : { scale: 0.97 }}
              >
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-semibold rounded-2xl transition-colors duration-200 shadow-lg"
                >
                  Create a Quiz
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>
              <span className="text-xs text-white/30">For teachers</span>
            </div>

            {/* Student path */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                whileHover={reduced ? {} : { scale: 1.03, boxShadow: "0 0 24px rgba(255,255,255,0.08)" }}
                whileTap={reduced ? {} : { scale: 0.97 }}
              >
                <Link
                  href="/join"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white/8 hover:bg-white/12 border border-white/15 text-white text-base font-semibold rounded-2xl transition-all duration-200 backdrop-blur-sm"
                >
                  Join a Quiz
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7l5 5m0 0l-5 5m5-5H4" />
                  </svg>
                </Link>
              </motion.div>
              <span className="text-xs text-white/30">For students · no login needed</span>
            </div>
          </motion.div>

          {/* Feature pills */}
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 pt-2">
            {[
              { icon: "📄", text: "Upload any PDF" },
              { icon: "🤖", text: "AI-generated questions" },
              { icon: "📱", text: "Students join on mobile" },
              { icon: "📊", text: "Live leaderboard" },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 px-4 py-2 bg-white/6 rounded-full text-sm text-white/60 border border-white/10 backdrop-blur-sm"
              >
                <span>{icon}</span>
                {text}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      <motion.footer
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="relative z-10 text-center py-6 text-xs text-white/20"
      >
        Built with Next.js · Powered by Groq AI
      </motion.footer>
    </div>
  );
}
