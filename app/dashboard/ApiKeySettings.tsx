"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface Props {
  hasApiKey: boolean;
}

export default function ApiKeySettings({ hasApiKey }: Props) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  function clearResults() {
    setTestResult(null);
    setSaveResult(null);
  }

  async function handleTest() {
    if (!key.trim()) return;
    setTesting(true);
    clearResults();
    try {
      const res = await fetch("/api/test-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();
      setTestResult({
        ok: res.ok,
        message: res.ok ? "Key works!" : (data.error ?? "Key test failed."),
      });
    } catch {
      setTestResult({ ok: false, message: "Network error." });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!key.trim()) return;
    setSaving(true);
    clearResults();
    try {
      const res = await fetch("/api/save-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveResult({ ok: true, message: "API key saved successfully." });
        setKey("");
        router.refresh();
      } else {
        setSaveResult({ ok: false, message: data.error ?? "Save failed." });
      }
    } catch {
      setSaveResult({ ok: false, message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    clearResults();
    try {
      const res = await fetch("/api/save-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "" }),
      });
      if (res.ok) {
        setSaveResult({ ok: true, message: "API key removed." });
        router.refresh();
      } else {
        setSaveResult({ ok: false, message: "Remove failed." });
      }
    } catch {
      setSaveResult({ ok: false, message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  const busy = testing || saving;

  return (
    <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
      <h3 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">
        Groq API Key
      </h3>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
        {/* Status indicator */}
        <div className="flex items-start gap-3">
          <span
            className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
              hasApiKey ? "bg-green-400" : "bg-amber-400"
            }`}
          />
          <p className="text-sm text-white/50">
            {hasApiKey
              ? "A Groq API key is saved. Enter a new key below to replace it."
              : "No API key saved. Add your Groq API key to enable quiz generation."}
          </p>
        </div>

        {/* Key input */}
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              clearResults();
            }}
            placeholder="gsk_…"
            disabled={busy}
            className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 disabled:opacity-50 font-mono transition-all"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {showKey ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Feedback messages */}
        <AnimatePresence>
          {testResult && (
            <motion.p
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`text-xs px-3.5 py-2.5 rounded-xl border overflow-hidden ${
                testResult.ok
                  ? "bg-green-500/10 text-green-300 border-green-500/20"
                  : "bg-red-500/10 text-red-300 border-red-500/20"
              }`}
            >
              {testResult.message}
            </motion.p>
          )}
          {saveResult && (
            <motion.p
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`text-xs px-3.5 py-2.5 rounded-xl border overflow-hidden ${
                saveResult.ok
                  ? "bg-green-500/10 text-green-300 border-green-500/20"
                  : "bg-red-500/10 text-red-300 border-red-500/20"
              }`}
            >
              {saveResult.message}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={handleTest}
            disabled={busy || !key.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2 text-sm font-medium border border-white/12 text-white/60 hover:text-white rounded-xl hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {testing ? "Testing…" : "Test Key"}
          </motion.button>
          <motion.button
            type="button"
            onClick={handleSave}
            disabled={busy || !key.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? "Saving…" : "Save Key"}
          </motion.button>
        </div>

        {hasApiKey && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="w-full py-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            Remove saved key
          </button>
        )}

        <p className="text-xs text-white/25">
          Get a free key at{" "}
          <span className="font-medium text-white/40">console.groq.com</span>.
          {" "}Your key is stored securely and never exposed to students.
        </p>
      </div>
    </motion.section>
  );
}
