"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cardVariants, scaleIn } from "@/lib/motion";
import Confetti from "@/components/Confetti";
import { saveQuiz, publishQuiz, type QuestionData } from "./actions";
import TeacherNav from "@/components/TeacherNav";

// ─── Types ───────────────────────────────────────────────────────────────────

type LocalQuestion = QuestionData & { regenerating: boolean };

interface QuizProps {
  id: string;
  title: string;
  status: string;
  source_text: string;
  questions: QuestionData[];
}

interface ExistingRoom {
  id: string;
  code: string;
}

interface RoomSession {
  id: string;
  code: string;
  status: string;
  created_at: string;
}

interface Props {
  quiz: QuizProps;
  existingRoom: ExistingRoom | null;
  sessions: RoomSession[];
  userName: string;
}

type PublishedRoom = { roomId: string; code: string; qrDataUrl: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function blankQuestion(): LocalQuestion {
  return {
    id: crypto.randomUUID(),
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: "",
    explanation: "",
    order_index: 0,
    regenerating: false,
  };
}

// ─── Question Card ────────────────────────────────────────────────────────────

interface CardProps {
  q: LocalQuestion;
  index: number;
  total: number;
  dbIds: Set<string>;
  onChange: (id: string, patch: Partial<LocalQuestion>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRegenerate: (id: string) => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

function QuestionCard({ q, index, total, dbIds, onChange, onDelete, onMove, onRegenerate }: CardProps) {
  function handleOptionChange(i: number, val: string) {
    const newOptions = [...q.options] as [string, string, string, string];
    const wasCorrect = newOptions[i] === q.correct_answer;
    newOptions[i] = val;
    onChange(q.id, {
      options: newOptions,
      ...(wasCorrect ? { correct_answer: val } : {}),
    });
  }

  const canRegenerate = dbIds.has(q.id);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
      {/* Regenerating overlay */}
      {q.regenerating && (
        <div className="absolute inset-0 bg-[#080810]/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-300">
            <motion.svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </motion.svg>
            Regenerating…
          </div>
        </div>
      )}

      {/* Card header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/35 uppercase tracking-widest">
          Q{index + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Move up"
            disabled={index === 0}
            onClick={() => onMove(q.id, -1)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            title="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(q.id, 1)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            title="Delete question"
            onClick={() => onDelete(q.id)}
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Question text */}
      <motion.div key={q.question_text.slice(0, 20)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Question</label>
        <textarea
          rows={2}
          value={q.question_text}
          onChange={(e) => onChange(q.id, { question_text: e.target.value })}
          placeholder="Enter your question…"
          className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
        />
      </motion.div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {q.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/30 w-4 shrink-0">{OPTION_LABELS[i]}</span>
            <input
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              placeholder={`Option ${OPTION_LABELS[i]}`}
              className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>
        ))}
      </div>

      {/* Correct answer */}
      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Correct Answer</label>
        <select
          value={q.correct_answer}
          onChange={(e) => onChange(q.id, { correct_answer: e.target.value })}
          className="w-full px-3 py-2 text-sm appearance-none bg-[#0d0d1a] border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 [&>option]:bg-[#0d0d1a] [&>option]:text-white"
        >
          <option value="">— select correct answer —</option>
          {q.options.map((opt, i) => (
            <option key={i} value={opt}>
              {OPTION_LABELS[i]}: {opt || "(empty)"}
            </option>
          ))}
        </select>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Explanation</label>
        <textarea
          rows={2}
          value={q.explanation}
          onChange={(e) => onChange(q.id, { explanation: e.target.value })}
          placeholder="One sentence explaining the correct answer…"
          className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
        />
      </div>

      {/* Regenerate button */}
      <div className="pt-1 border-t border-white/8">
        <button
          type="button"
          disabled={!canRegenerate || q.regenerating}
          onClick={() => onRegenerate(q.id)}
          title={canRegenerate ? undefined : "Save the quiz first to enable regeneration"}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 hover:border-indigo-500/50 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
        >
          {q.regenerating ? (
            <motion.svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </motion.svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {canRegenerate ? "Regenerate with AI" : "Save first to regenerate"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export default function QuizEditor({ quiz, existingRoom, sessions, userName }: Props) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [title, setTitle] = useState(quiz.title);
  const [questions, setQuestions] = useState<LocalQuestion[]>(() =>
    quiz.questions.map((q) => ({ ...q, regenerating: false }))
  );
  const [dbIds, setDbIds] = useState(() => new Set(quiz.questions.map((q) => q.id)));

  const [saving, setSaving] = useState(false);
  const [generatingNew, setGeneratingNew] = useState(false);
  const [status, setStatus] = useState(quiz.status);
  const [publishedRoom, setPublishedRoom] = useState<PublishedRoom | null>(
    existingRoom ? { roomId: existingRoom.id, code: existingRoom.code, qrDataUrl: "" } : null
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  function updateQuestion(id: string, patch: Partial<LocalQuestion>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function moveQuestion(id: string, dir: -1 | 1) {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  function deleteQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, { ...blankQuestion(), order_index: prev.length }]);
  }

  async function handleGenerateNew() {
    setGeneratingNew(true);
    setError(null);
    try {
      const res = await fetch("/api/regenerate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed.");
      setQuestions((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          question_text: data.question.question_text,
          options: data.question.options,
          correct_answer: data.question.correct_answer,
          explanation: data.question.explanation,
          order_index: prev.length,
          regenerating: false,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGeneratingNew(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const result = await saveQuiz(
        quiz.id,
        title,
        questions.map(({ question_text, options, correct_answer, explanation }) => ({
          question_text,
          options,
          correct_answer,
          explanation,
        }))
      );
      setQuestions(result.questions.map((q) => ({ ...q, regenerating: false })));
      setDbIds(new Set(result.questions.map((q) => q.id)));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    setError(null);
    try {
      const room = await publishQuiz(quiz.id);
      setPublishedRoom(room);
      setStatus("published");
      setQrDataUrl(room.qrDataUrl);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate(questionId: string) {
    updateQuestion(questionId, { regenerating: true });
    setError(null);
    try {
      const res = await fetch("/api/regenerate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Regeneration failed.");
      updateQuestion(questionId, {
        question_text: data.question.question_text,
        options: data.question.options,
        correct_answer: data.question.correct_answer,
        explanation: data.question.explanation,
        regenerating: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed.");
      updateQuestion(questionId, { regenerating: false });
    }
  }

  const anyRegenerating = questions.some((q) => q.regenerating) || generatingNew;

  return (
    <div className="min-h-screen bg-[#080810]">
      {/* Sticky header: nav + controls */}
      <div className="sticky top-0 z-20">
        <TeacherNav name={userName} />
        <div className="bg-[#080810]/90 backdrop-blur-xl border-b border-white/8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-sm text-white/40 hover:text-white/80 transition-colors shrink-0"
            >
              ← Dashboard
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz title"
              className="flex-1 min-w-0 text-base font-semibold bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-1 text-white placeholder:text-white/25"
            />
            <div className="flex items-center gap-2 shrink-0">
              <AnimatePresence>
                {saveSuccess && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-xs text-green-400 font-medium"
                  >
                    Saved!
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || anyRegenerating}
                className="px-4 py-1.5 text-sm font-medium text-white/70 hover:text-white border border-white/12 hover:border-white/25 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {status !== "published" ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving || anyRegenerating || questions.length === 0}
                  className="px-4 py-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Publish
                </button>
              ) : (
                <span className="px-3 py-1.5 text-xs font-semibold text-green-400 bg-green-500/12 border border-green-500/25 rounded-lg">
                  Published
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start justify-between gap-3 overflow-hidden"
            >
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question cards */}
        {questions.length === 0 ? (
          <div className="text-center py-16 text-white/25 bg-white/3 rounded-2xl border border-dashed border-white/10">
            <p className="text-sm">No questions yet.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {questions.map((q, index) => (
              <motion.div
                key={q.id}
                layout
                variants={reduced ? {} : cardVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <QuestionCard
                  q={q}
                  index={index}
                  total={questions.length}
                  dbIds={dbIds}
                  onChange={updateQuestion}
                  onDelete={deleteQuestion}
                  onMove={moveQuestion}
                  onRegenerate={handleRegenerate}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Add question */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateNew}
            disabled={generatingNew || anyRegenerating || saving}
            className="w-full py-3 px-4 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {generatingNew ? (
              <>
                <motion.svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </motion.svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Question with AI
              </>
            )}
          </button>
          <button
            type="button"
            onClick={addQuestion}
            className="text-xs text-white/30 hover:text-white/55 transition-colors"
          >
            + Add blank question
          </button>
        </div>

        {/* Past sessions */}
        {sessions.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">
              Past Sessions
            </h2>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl divide-y divide-white/6 overflow-hidden">
              {sessions.map((session) => (
                <a
                  key={session.id}
                  href={`/results/${session.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors group"
                >
                  <span className="font-mono text-base font-bold tracking-widest text-white/70 group-hover:text-white transition-colors">
                    {session.code}
                  </span>
                  <span className="text-xs text-white/30">
                    {new Date(session.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span
                    className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      session.status === "active"
                        ? "bg-green-500/15 text-green-400 border border-green-500/20"
                        : "bg-white/6 text-white/35 border border-white/10"
                    }`}
                  >
                    {session.status === "active" ? "Live" : "Closed"}
                  </span>
                  <svg
                    className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Published room panel */}
        <AnimatePresence>
          {publishedRoom && (
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            >
              <Confetti active={showConfetti} />
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 flex items-center gap-2">
                <motion.svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-white"
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                  />
                </motion.svg>
                <p className="text-sm font-semibold text-white">Quiz published — share the join code!</p>
              </div>
              <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                {/* Code */}
                <div className="text-center">
                  <p className="text-xs font-medium text-white/35 mb-2 uppercase tracking-widest">Join Code</p>
                  <div className="font-display text-5xl font-bold tracking-[0.2em] text-white font-mono">
                    {publishedRoom.code}
                  </div>
                  <p className="mt-2 text-xs text-white/35">
                    Students go to{" "}
                    <span className="font-medium text-white/55">
                      {typeof window !== "undefined" ? window.location.host : ""}/join
                    </span>
                  </p>
                </div>

                {/* QR code */}
                {qrDataUrl && (
                  <div className="flex flex-col items-center gap-2">
                    <motion.img
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      src={qrDataUrl}
                      alt={`QR code for join code ${publishedRoom.code}`}
                      className="w-36 h-36 rounded-xl bg-white p-1.5"
                    />
                    <a
                      href={`/join?code=${publishedRoom.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Open join link ↗
                    </a>
                  </div>
                )}

                {/* Links */}
                <div className="flex flex-col gap-2 sm:ml-auto">
                  <a
                    href={`/results/${publishedRoom.roomId}`}
                    className="px-4 py-2 text-sm font-semibold bg-white text-slate-900 rounded-lg hover:bg-white/90 transition-colors text-center"
                  >
                    View Results →
                  </a>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white/60 border border-white/12 rounded-lg hover:bg-white/8 disabled:opacity-40 transition-all"
                  >
                    New code
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
