"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, scaleIn } from "@/lib/motion";

type ExtractionResult = { text: string; charCount: number };

const MAX_BYTES = 20 * 1024 * 1024;

function formatBytes(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

export default function PdfUploader({ hasApiKey }: { hasApiKey: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    setResult(null);
    setError(null);
    if (!chosen) return;
    if (chosen.size > MAX_BYTES) {
      setError("File exceeds 20 MB. Please choose a smaller PDF.");
      e.target.value = "";
      return;
    }
    setFile(chosen);
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    setError(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/extract-pdf", { method: "POST", body });
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Server error (${res.status}). Please try again.`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed.");
      setResult(data as ExtractionResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleGenerateQuiz() {
    if (!result || !file) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: result.text,
          title: file.name.replace(/\.pdf$/i, ""),
          count: 10,
          difficulty: "medium",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Quiz generation failed.");
      router.push(`/quiz/${data.quizId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setGenerating(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const busy = extracting || generating;

  return (
    <motion.section variants={fadeUp} initial="hidden" animate="show">
      <h3 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">
        Create New Quiz
      </h3>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
        {/* Drop zone */}
        <motion.button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          className="w-full border-2 border-dashed border-white/12 hover:border-indigo-500/50 rounded-xl p-8 text-center hover:bg-indigo-500/5 disabled:pointer-events-none transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">{file.name}</p>
              <p className="text-xs text-white/40">{formatBytes(file.size)}</p>
              {!busy && (
                <p className="text-xs text-indigo-400 mt-1">Click to choose a different file</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="mx-auto w-8 h-8 text-white/25"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="text-sm font-medium text-white/60">Click to upload a PDF</p>
              <p className="text-xs text-white/30">PDF only · Max 20 MB</p>
            </div>
          )}
        </motion.button>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5 overflow-hidden"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Extract button */}
        {file && !result && (
          <motion.button
            onClick={handleExtract}
            disabled={busy}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {extracting ? "Extracting text…" : "Extract Text"}
          </motion.button>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div variants={scaleIn} initial="hidden" animate="show" exit="exit" className="space-y-4">
              {/* Stat */}
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-green-300">Extraction successful</p>
                  <p className="text-xs text-green-400/70 mt-0.5">
                    {result.charCount.toLocaleString()} characters from{" "}
                    <span className="font-medium">{file?.name}</span>
                  </p>
                </div>
                {!busy && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors"
                  >
                    Change file
                  </button>
                )}
              </div>

              {/* Preview */}
              <div>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-1.5">
                  Preview · first 500 chars
                </p>
                <pre className="text-xs text-white/50 bg-white/4 border border-white/8 rounded-xl p-4 whitespace-pre-wrap break-words leading-relaxed max-h-40 overflow-y-auto font-mono">
                  {result.text.slice(0, 500)}
                  {result.charCount > 500 && (
                    <span className="text-white/25">
                      {" "}… ({result.charCount - 500} more)
                    </span>
                  )}
                </pre>
              </div>

              {/* Generate Quiz */}
              {hasApiKey ? (
                <motion.button
                  onClick={handleGenerateQuiz}
                  disabled={busy}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      Generating quiz…
                      <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-white rounded-full"
                          />
                        ))}
                      </span>
                    </span>
                  ) : (
                    "Generate Quiz"
                  )}
                </motion.button>
              ) : (
                <div className="flex items-start gap-2.5 px-3.5 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Add your Groq API key below to generate a quiz from this PDF.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
