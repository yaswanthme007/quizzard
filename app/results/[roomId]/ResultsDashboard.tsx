"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, animate } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import TeacherNav from "@/components/TeacherNav";

// ─── Types ───────────────────────────────────────────────────────────────────

type Question = { id: string; question_text: string; order_index: number };
type Player = { id: string; nickname: string; score: number };
type Answer = {
  player_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
};

interface Props {
  roomId: string;
  roomCode: string;
  roomStatus: string;
  quizTitle: string;
  questions: Question[];
  initialPlayers: Player[];
  initialAnswers: Answer[];
  name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rankStyle(i: number) {
  if (i === 0) return { label: "1st", cls: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25", medal: "🥇" };
  if (i === 1) return { label: "2nd", cls: "bg-slate-400/10 text-slate-300 border border-slate-400/20", medal: "🥈" };
  if (i === 2) return { label: "3rd", cls: "bg-orange-500/12 text-orange-400 border border-orange-500/20", medal: "🥉" };
  return { label: `#${i + 1}`, cls: "bg-white/5 text-white/35 border border-white/10", medal: null };
}

function escapeCell(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBar({ correct, total }: { correct: number; total: number }) {
  const correctPct = total === 0 ? 0 : (correct / total) * 100;
  const wrongPct = total === 0 ? 0 : ((total - correct) / total) * 100;
  return (
    <div className="h-2 rounded-full overflow-hidden bg-white/6 flex">
      <motion.div
        className="bg-green-500 h-full"
        initial={{ width: "0%" }}
        animate={{ width: `${correctPct}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
      />
      <motion.div
        className="bg-red-500/60 h-full"
        initial={{ width: "0%" }}
        animate={{ width: `${wrongPct}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
      />
    </div>
  );
}

// ─── Close Room Modal ─────────────────────────────────────────────────────────

function CloseRoomModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="bg-[#0d0d1a] border border-white/12 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <h3 className="font-display text-lg font-semibold text-white mb-2">Close this room?</h3>
        <p className="text-sm text-white/50 leading-relaxed mb-6">
          Students will no longer be able to join. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-white/60 hover:text-white border border-white/12 hover:border-white/25 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all"
          >
            Close Room
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResultsDashboard({
  roomId,
  roomCode,
  roomStatus,
  quizTitle,
  questions,
  initialPlayers,
  initialAnswers,
  name,
}: Props) {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [answers, setAnswers] = useState<Answer[]>(initialAnswers);
  const [status, setStatus] = useState(roomStatus);
  const [closing, setClosing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    const controls = animate(displayCount, players.length, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplayCount(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  const playerIdsRef = useRef<Set<string>>(
    new Set(initialPlayers.map((p) => p.id))
  );

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`results:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const p = payload.new as Player;
            setPlayers((prev) => [...prev, p]);
            playerIdsRef.current.add(p.id);
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Player) : p))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answers" },
        (payload) => {
          const ans = payload.new as Answer;
          if (!playerIdsRef.current.has(ans.player_id)) return;
          setAnswers((prev) => {
            if (prev.some((a) => a.player_id === ans.player_id && a.question_id === ans.question_id))
              return prev;
            return [...prev, ans];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname)),
    [players]
  );

  const questionStats = useMemo(() => {
    return questions.map((q) => {
      const qAnswers = answers.filter((a) => a.question_id === q.id);
      const correct = qAnswers.filter((a) => a.is_correct).length;
      return {
        ...q,
        correct,
        wrong: qAnswers.length - correct,
        total: qAnswers.length,
        pct: qAnswers.length === 0 ? 0 : Math.round((correct / qAnswers.length) * 100),
      };
    });
  }, [questions, answers]);

  const avgScore = useMemo(() => {
    if (players.length === 0 || questions.length === 0) return 0;
    const total = players.reduce((acc, p) => acc + p.score, 0);
    return Math.round((total / players.length / questions.length) * 100);
  }, [players, questions.length]);

  async function handleCloseRoom() {
    setClosing(true);
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase
      .from("rooms")
      .update({ status: "finished" })
      .eq("id", roomId);
    if (err) {
      setError(err.message);
    } else {
      setStatus("finished");
    }
    setClosing(false);
  }

  function exportCSV() {
    const qHeaders = questions.flatMap((_, i) => [`Q${i + 1}_answer`, `Q${i + 1}_correct`]);
    const headers = ["nickname", "total_score", ...qHeaders];

    const rows = sortedPlayers.map((player) => {
      const aMap = new Map(
        answers.filter((a) => a.player_id === player.id).map((a) => [a.question_id, a])
      );
      return [
        player.nickname,
        String(player.score),
        ...questions.flatMap((q) => {
          const ans = aMap.get(q.id);
          return [ans?.selected_answer ?? "", ans ? (ans.is_correct ? "yes" : "no") : ""];
        }),
      ];
    });

    const csv =
      "﻿" +
      [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz_${roomCode}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const totalQuestions = questions.length;

  return (
    <div className="min-h-screen bg-[#080810]">
      {/* Close room modal */}
      <AnimatePresence>
        {showCloseModal && (
          <CloseRoomModal
            onConfirm={async () => {
              setShowCloseModal(false);
              await handleCloseRoom();
            }}
            onCancel={() => setShowCloseModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Sticky header */}
      <header className="sticky top-0 z-10">
        <TeacherNav name={name} />
        <div className="bg-[#080810]/90 backdrop-blur-xl border-b border-white/8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-white/40 hover:text-white/80 transition-colors shrink-0"
            >
              ← Dashboard
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/35 truncate">{quizTitle}</p>
            </div>

            {status === "active" && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 shrink-0">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Live
              </span>
            )}

            {status === "active" ? (
              <motion.button
                onClick={() => setShowCloseModal(true)}
                disabled={closing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-1.5 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/15 disabled:opacity-50 transition-all shrink-0"
              >
                {closing ? "Closing…" : "Close Room"}
              </motion.button>
            ) : (
              <span className="px-3 py-1.5 text-xs font-semibold bg-white/5 text-white/35 border border-white/10 rounded-lg shrink-0">
                Room Closed
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300 flex justify-between overflow-hidden"
            >
              {error}
              <button onClick={() => setError(null)} className="text-red-400 text-lg leading-none ml-4">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Players", value: displayCount, suffix: "" },
            { label: "Questions", value: totalQuestions, suffix: "" },
            { label: "Avg Score", value: avgScore, suffix: "%" },
          ].map(({ label, value, suffix }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center"
            >
              <p className="font-display text-3xl font-bold text-white tabular-nums">
                {value}{suffix}
              </p>
              <p className="text-xs text-white/40 mt-1 uppercase tracking-wide">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Room code + export */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">
              Room Code
            </p>
            <p className="font-display text-5xl font-bold tracking-[0.2em] text-white font-mono">
              {roomCode}
            </p>
            {status === "active" && (
              <p className="text-xs text-white/30 mt-1">
                Students join at <span className="font-medium text-white/50">/join</span>
              </p>
            )}
          </motion.div>

          <div className="sm:ml-auto">
            <motion.button
              onClick={exportCSV}
              disabled={players.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white/8 hover:bg-white/12 border border-white/12 text-white/70 hover:text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </motion.button>
          </div>
        </div>

        {/* Leaderboard */}
        <section>
          <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">
            Leaderboard
          </h2>

          {sortedPlayers.length === 0 ? (
            <div className="bg-white/3 border border-dashed border-white/10 rounded-2xl px-6 py-12 text-center text-white/30 text-sm">
              Waiting for students to join…
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl divide-y divide-white/6 overflow-hidden">
              <AnimatePresence>
                {sortedPlayers.map((player, i) => {
                  const rank = rankStyle(i);
                  const barPct = totalQuestions > 0 ? (player.score / totalQuestions) * 100 : 0;
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      layout
                      className="flex items-center gap-4 px-5 py-3.5"
                    >
                      <div className="shrink-0 flex items-center gap-1.5">
                        {rank.medal && (
                          <span className="text-base leading-none">{rank.medal}</span>
                        )}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rank.cls}`}>
                          {rank.label}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{player.nickname}</p>
                        <div className="mt-1.5 h-1 bg-white/6 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${barPct}%` }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      <span className="shrink-0 text-sm font-semibold text-white tabular-nums font-mono">
                        {player.score}
                        <span className="text-white/30 font-normal"> / {totalQuestions}</span>
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Question breakdown */}
        <section>
          <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">
            Question Breakdown
          </h2>

          {questionStats.length === 0 ? (
            <div className="bg-white/3 border border-dashed border-white/10 rounded-2xl px-6 py-12 text-center text-white/30 text-sm">
              No questions loaded.
            </div>
          ) : (
            <div className="space-y-3">
              {questionStats.map((q, i) => (
                <div
                  key={q.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 text-xs font-bold text-white/30 mt-0.5 font-mono">
                      Q{i + 1}
                    </span>
                    <p className="text-sm text-white/85 leading-snug flex-1">
                      {q.question_text}
                    </p>
                  </div>

                  <div className="pl-7 space-y-2">
                    <StatBar correct={q.correct} total={q.total} />

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-green-400">
                          <span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />
                          {q.correct} correct
                        </span>
                        <span className="flex items-center gap-1.5 text-red-400/80">
                          <span className="w-2 h-2 rounded-sm bg-red-500/60 inline-block" />
                          {q.wrong} wrong
                        </span>
                      </div>
                      <span className="font-semibold text-white/60 font-mono">
                        {q.total === 0 ? "—" : `${q.pct}%`}
                        <span className="font-normal text-white/30"> ({q.total})</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
