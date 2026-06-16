"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, animate } from "framer-motion";
import { cardVariants } from "@/lib/motion";

// ─── Types ───────────────────────────────────────────────────────────────────

type StoredQuestion = {
  id: string;
  question_text: string;
  options: string[];
  order_index: number;
};

type Feedback = {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
};

type ReviewItem = {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  selected_answer: string | null;
  is_correct: boolean;
};

type Phase =
  | "loading"
  | "playing"
  | "answered"
  | "finished"
  | "review_loading"
  | "reviewing";

const LABELS = ["A", "B", "C", "D"];

// ─── Score message ────────────────────────────────────────────────────────────

function scoreMessage(score: number, total: number) {
  const pct = total === 0 ? 0 : score / total;
  if (pct === 1) return "Perfect score!";
  if (pct >= 0.8) return "Great job!";
  if (pct >= 0.5) return "Good effort!";
  return "Keep studying!";
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function CircularProgress({ score, total }: { score: number; total: number }) {
  const size = 160;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - (total > 0 ? score / total : 0));

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#scoreGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
      />
      <defs>
        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Option style ─────────────────────────────────────────────────────────────

function optionClass(opt: string, selected: string | null, feedback: Feedback | null) {
  const base =
    "w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all text-sm font-medium";

  if (!feedback) {
    return selected === opt
      ? `${base} border-indigo-500 bg-indigo-500/20 text-white`
      : `${base} border-white/12 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/8`;
  }

  if (opt === feedback.correctAnswer) {
    return `${base} border-green-500/60 bg-green-500/12 text-green-200`;
  }
  if (opt === selected) {
    return `${base} border-red-500/60 bg-red-500/12 text-red-200`;
  }
  return `${base} border-white/8 bg-white/3 text-white/35`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : ((current + 1) / total) * 100;
  return (
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  return feedback.isCorrect ? (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-500/12 border border-green-500/30"
    >
      <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</span>
      <span className="font-semibold text-green-200 text-sm">Correct!</span>
    </motion.div>
  ) : (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/12 border border-red-500/30">
        <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✗</span>
        <span className="font-semibold text-red-200 text-sm">Incorrect</span>
      </div>
      <div className="px-4 py-3 rounded-xl bg-green-500/8 border border-green-500/25 text-sm text-green-200">
        <span className="font-medium text-green-300">Correct: </span>
        {feedback.correctAnswer}
      </div>
    </motion.div>
  );
}

function ReviewCard({ item, index }: { item: ReviewItem; index: number }) {
  const answered = item.selected_answer !== null;
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      transition={{ delay: index * 0.05 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
            !answered
              ? "bg-white/15 text-white/50"
              : item.is_correct
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {!answered ? "–" : item.is_correct ? "✓" : "✗"}
        </span>
        <p className="text-sm font-medium text-white/90 leading-snug">
          <span className="text-white/35 mr-1">Q{index + 1}.</span>
          {item.question_text}
        </p>
      </div>

      <div className="space-y-1 pl-7">
        {item.options.map((opt, i) => {
          const isCorrect = opt === item.correct_answer;
          const isChosen = opt === item.selected_answer;
          const highlight = isCorrect
            ? "border-green-500/40 bg-green-500/8 text-green-200"
            : isChosen
            ? "border-red-500/40 bg-red-500/8 text-red-200"
            : "border-white/8 bg-white/3 text-white/35";
          return (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${highlight}`}>
              <span className="font-bold w-4 shrink-0">{LABELS[i]}</span>
              <span>{opt}</span>
              {isChosen && !isCorrect && <span className="ml-auto text-red-300 font-medium">your answer</span>}
              {isCorrect && <span className="ml-auto text-green-300 font-medium">correct</span>}
            </div>
          );
        })}
      </div>

      {item.explanation && (
        <p className="pl-7 text-xs text-white/40 leading-relaxed">
          <span className="font-medium text-white/55">Why: </span>
          {item.explanation}
        </p>
      )}
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlayPage({ params }: { params: { roomCode: string } }) {
  const { roomCode } = params;
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [nickname, setNickname] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`quizzard_${roomCode}`);
      if (!raw) throw new Error("No session");
      const session = JSON.parse(raw) as {
        playerId: string;
        nickname: string;
        questions: StoredQuestion[];
      };
      if (!session.playerId || !Array.isArray(session.questions)) throw new Error("Bad session");
      setPlayerId(session.playerId);
      setNickname(session.nickname ?? "");
      setQuestions(session.questions);
      setPhase(session.questions.length === 0 ? "finished" : "playing");
    } catch {
      router.replace("/join?error=session_expired");
    }
  }, [roomCode, router]);

  useEffect(() => {
    if (phase === "finished") {
      const controls = animate(0, score, {
        duration: 1.2,
        ease: "easeOut",
        onUpdate: (v) => setDisplayScore(Math.round(v)),
      });
      return () => controls.stop();
    }
  }, [phase, score]);

  async function handleSelect(option: string) {
    if (phase !== "playing" || submitting) return;
    setSelected(option);
    setSubmitting(true);

    try {
      const res = await fetch("/api/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          questionId: questions[currentIndex].id,
          selectedAnswer: option,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed.");

      if (data.isCorrect) setScore((s) => s + 1);
      setFeedback({
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation ?? "",
      });
      setPhase("answered");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setPhase("finished");
    } else {
      setCurrentIndex(nextIndex);
      setSelected(null);
      setFeedback(null);
      setPhase("playing");
    }
  }

  async function handleReview() {
    setPhase("review_loading");
    try {
      const res = await fetch(`/api/quiz-review/${roomCode}/${playerId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load review.");
      setReview(data.review ?? []);
      setReviewTotal(data.total ?? 0);
      setPhase("reviewing");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load review.");
      setPhase("finished");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-white/40">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/8 px-4 py-3 flex items-center gap-3 shrink-0">
        <span className="font-display font-bold text-white">Quizzard</span>
        {nickname && (
          <span className="text-sm text-white/40 truncate max-w-[120px]">{nickname}</span>
        )}
        <div className="ml-auto flex items-center gap-2.5">
          {(phase === "playing" || phase === "answered") && (
            <span className="text-xs text-white/35 font-mono">
              {currentIndex + 1}/{questions.length}
            </span>
          )}
          <span className="px-2.5 py-1 bg-indigo-600/25 border border-indigo-500/25 rounded-lg text-sm font-bold text-indigo-300 font-mono tabular-nums">
            {score}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-300 flex items-start justify-between gap-2 overflow-hidden"
            >
              {error}
              <button onClick={() => setError(null)} className="text-red-400 text-lg leading-none shrink-0">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Playing / Answered ── */}
        {(phase === "playing" || phase === "answered") && (
          <>
            <ProgressBar current={currentIndex} total={questions.length} />

            {feedback && <FeedbackBanner feedback={feedback} />}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex flex-col gap-4"
              >
                {/* Question */}
                <p className="text-base sm:text-lg font-semibold text-white leading-snug">
                  {questions[currentIndex].question_text}
                </p>

                {/* Options — 2×2 grid on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {questions[currentIndex].options.map((opt, i) => (
                    <motion.button
                      key={i}
                      type="button"
                      disabled={phase === "answered" || submitting}
                      onClick={() => handleSelect(opt)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={
                        feedback?.isCorrect && opt === feedback.correctAnswer
                          ? { opacity: 1, y: 0, scale: [1, 1.04, 1] }
                          : !feedback?.isCorrect && feedback && opt === selected
                          ? { opacity: 1, y: 0, x: [0, -8, 8, -6, 6, -3, 3, 0] }
                          : { opacity: 1, y: 0 }
                      }
                      transition={{ delay: feedback ? 0 : 0.05 * i, duration: feedback ? 0.45 : 0.25 }}
                      whileTap={phase === "answered" || submitting ? undefined : { scale: 0.97 }}
                      className={optionClass(opt, selected, feedback)}
                    >
                      <span className="shrink-0 w-6 h-6 rounded-lg bg-white/10 text-white/60 flex items-center justify-center text-xs font-bold">
                        {LABELS[i]}
                      </span>
                      <span className="leading-snug text-sm">{opt}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Explanation after wrong answer */}
                {feedback && !feedback.isCorrect && feedback.explanation && (
                  <p className="text-sm text-white/50 bg-white/5 border border-white/10 rounded-xl px-4 py-3 leading-relaxed">
                    <span className="font-medium text-white/70">Explanation: </span>
                    {feedback.explanation}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Next button */}
            {phase === "answered" && (
              <motion.button
                type="button"
                onClick={handleNext}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-base"
              >
                {currentIndex + 1 >= questions.length ? "See Results →" : "Next Question →"}
              </motion.button>
            )}

            {/* Submitting spinner */}
            {submitting && (
              <div className="flex justify-center">
                <svg className="animate-spin w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            )}
          </>
        )}

        {/* ── Finished ── */}
        {phase === "finished" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-8 py-8"
          >
            {/* Circular progress ring with score overlay */}
            <div className="relative flex items-center justify-center">
              <CircularProgress score={displayScore} total={questions.length} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-bold text-white tabular-nums">{displayScore}</span>
                <span className="text-sm text-white/40 font-mono">/{questions.length}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Quiz Complete</p>
              <p className="text-xl font-semibold text-white">{scoreMessage(score, questions.length)}</p>
            </div>

            <div className="w-full space-y-3">
              <motion.button
                type="button"
                onClick={handleReview}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
              >
                Review Answers
              </motion.button>
              <motion.button
                type="button"
                onClick={() => router.push("/join")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 border border-white/12 text-white/60 hover:text-white hover:border-white/25 font-medium rounded-xl transition-all"
              >
                Join Another Quiz
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Review loading ── */}
        {phase === "review_loading" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2.5 text-white/40">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading review…
            </div>
          </div>
        )}

        {/* ── Reviewing ── */}
        {phase === "reviewing" && (
          <>
            <div className="text-center pb-2">
              <p className="font-display text-2xl font-bold text-white">
                {score}
                <span className="text-white/35 font-normal text-xl"> / {reviewTotal}</span>
              </p>
              <p className="text-sm text-white/40 mt-1">{scoreMessage(score, reviewTotal)}</p>
            </div>

            <div className="space-y-3">
              {review.map((item, i) => (
                <ReviewCard key={i} item={item} index={i} />
              ))}
            </div>

            <motion.button
              type="button"
              onClick={() => router.push("/join")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 border border-white/12 text-white/60 hover:text-white hover:border-white/25 font-medium rounded-xl transition-all"
            >
              Join Another Quiz
            </motion.button>
          </>
        )}
      </main>
    </div>
  );
}
