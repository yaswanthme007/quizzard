"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AVATARS, AvatarSVG, type AvatarId } from "@/lib/avatars";

type Step = "code" | "avatar";

export default function JoinForm() {
  const [boxes, setBoxes] = useState<string[]>(Array(6).fill(""));
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("zeke");
  const [step, setStep] = useState<Step>("code");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [hostName, setHostName] = useState<string | null>(null);
  const [roomLookupDone, setRoomLookupDone] = useState(false);
  const [codeFromUrl, setCodeFromUrl] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));
  const nicknameRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionExpired = searchParams.get("error") === "session_expired";
  const code = boxes.join("");

  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (!urlCode) return;
    const clean = urlCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (clean.length !== 6) return;
    setBoxes(clean.split(""));
    setCodeFromUrl(true);
    setTimeout(() => nicknameRef.current?.focus(), 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (code.length !== 6) {
      setHostName(null);
      setRoomLookupDone(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/room-info?code=${code}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setHostName(data.hostName ?? null);
        setRoomLookupDone(true);
      })
      .catch(() => {
        if (!cancelled) setRoomLookupDone(true);
      });
    return () => { cancelled = true; };
  }, [code]);

  function handleBoxChange(i: number, val: string) {
    const char = val.slice(-1).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const next = [...boxes];
    next[i] = char;
    setBoxes(next);
    if (char && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !boxes[i] && i > 0) {
      const next = [...boxes];
      next[i - 1] = "";
      setBoxes(next);
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    const next = Array(6).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setBoxes(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6 || nickname.trim().length === 0) return;
    setStep("avatar");
  }

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, nickname: nickname.trim(), avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join.");

      sessionStorage.setItem(
        `quizzard_${code}`,
        JSON.stringify({
          playerId: data.playerId,
          nickname: nickname.trim(),
          avatar,
          questions: data.questions,
        })
      );
      router.push(`/lobby/${code}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setLoading(false);
    }
  }

  if (step === "avatar") {
    return (
      <motion.div
        key="avatar-step"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Pick your alien</h1>
          <p className="mt-1.5 text-white/45 text-sm">Choose who you&apos;ll be in the lobby</p>
        </div>

        <motion.div
          animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-5"
        >
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300 overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview of chosen avatar */}
          <div className="flex justify-center">
            <motion.div
              key={avatar}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="relative"
            >
              <div
                className="rounded-full p-1"
                style={{
                  boxShadow: `0 0 30px ${AVATARS.find((a) => a.id === avatar)?.glow ?? "transparent"}`,
                }}
              >
                <AvatarSVG id={avatar} size={88} />
              </div>
              <p className="text-center text-sm font-semibold text-white mt-2">
                {AVATARS.find((a) => a.id === avatar)?.name}
              </p>
            </motion.div>
          </div>

          {/* Avatar grid */}
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((a) => (
              <motion.button
                key={a.id}
                type="button"
                onClick={() => setAvatar(a.id)}
                whileTap={{ scale: 0.92 }}
                className={`relative rounded-xl p-1.5 transition-all ${
                  avatar === a.id
                    ? "ring-2 ring-white/60 bg-white/10"
                    : "bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20"
                }`}
                style={avatar === a.id ? { boxShadow: `0 0 16px ${a.glow}` } : undefined}
              >
                <AvatarSVG id={a.id} size={52} />
                <p className="text-center text-[10px] text-white/50 mt-0.5 leading-tight">{a.name}</p>
              </motion.button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("code")}
              className="px-4 py-3 text-sm font-medium text-white/50 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            >
              Back
            </button>
            <motion.button
              type="button"
              disabled={loading}
              onClick={handleJoin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Entering lobby…" : "Enter Lobby →"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="code-step"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl font-bold text-white tracking-tight">Quizzard</h1>
        <p className="mt-2 text-white/45 text-sm">
          {codeFromUrl ? "Enter your name to join" : "Enter your room code to join"}
        </p>
      </div>

      <motion.div
        animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5"
      >
        {sessionExpired && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-300">
            Your session expired. Please join again.
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300 overflow-hidden"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleContinue} className="space-y-5">
          {codeFromUrl ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-center"
            >
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1.5">Room Code</p>
              <p className="font-mono text-3xl font-bold tracking-[0.22em] text-white">{code}</p>
              <AnimatePresence>
                {roomLookupDone && hostName && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 text-xs text-white/40"
                  >
                    Hosted by <span className="text-indigo-400 font-medium">{hostName}</span>
                  </motion.p>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={() => { setCodeFromUrl(false); setBoxes(Array(6).fill("")); setHostName(null); setRoomLookupDone(false); }}
                className="mt-2 text-xs text-white/30 hover:text-white/60 underline underline-offset-2 transition-colors"
              >
                Use a different code
              </button>
            </motion.div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-white/55 mb-3 text-center tracking-wide">
                Room Code
              </label>
              <div className="flex gap-2 justify-center">
                {boxes.map((char, i) => (
                  <motion.input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    type="text"
                    inputMode="text"
                    maxLength={2}
                    value={char}
                    onChange={(e) => handleBoxChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="w-11 h-14 text-center text-xl font-bold font-mono text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 uppercase caret-indigo-400 transition-all"
                  />
                ))}
              </div>
              <AnimatePresence>
                {roomLookupDone && hostName && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 text-center text-xs text-white/40"
                  >
                    Hosted by <span className="text-indigo-400 font-medium">{hostName}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-white/55 mb-1.5">
              Your Nickname
            </label>
            <input
              ref={nicknameRef}
              id="nickname"
              type="text"
              required
              maxLength={20}
              autoComplete="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. CoolStudent42"
              className="w-full px-4 py-3 text-base bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
            <p className="mt-1 text-xs text-white/25 text-right">{nickname.length}/20</p>
          </div>

          <motion.button
            type="submit"
            disabled={code.length !== 6 || nickname.trim().length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Pick Your Alien →
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
