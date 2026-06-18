"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AvatarSVG, AVATARS } from "@/lib/avatars";
import type { LobbyPlayer } from "./page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  roomCode: string;
  roomId: string;
  quizTitle: string;
  hostName: string;
  initialPlayers: LobbyPlayer[];
  isTeacher: boolean;
  qrDataUrl: string;
  initialStatus: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Deterministic star field — generated once, never random per render
const STARS = Array.from({ length: 180 }, (_, i) => ({
  x: ((i * 7.3 + (i * i * 0.17)) % 97) + 1.5,
  y: ((i * 11.1 + (i * i * 0.23)) % 96) + 1.5,
  size: (i % 3) + 1,
  opacity: 0.15 + (i % 7) * 0.065,
  duration: 2.2 + (i % 5) * 0.55,
  delay: (i % 11) * 0.27,
}));

const NEBULA_COLORS = [
  { x: "20%", y: "30%", color: "#4f46e5", size: "55vw" },
  { x: "75%", y: "65%", color: "#7c3aed", size: "45vw" },
  { x: "50%", y: "15%", color: "#0e7490", size: "38vw" },
];

// ─── Golden-angle sunflower layout ───────────────────────────────────────────

function getPos(index: number, scale: number): { x: number; y: number } {
  if (index === 0) return { x: 0, y: 0 };
  const goldenAngle = 2.3999632;
  const r = Math.sqrt(index) * 78;
  const angle = index * goldenAngle;
  return {
    x: Math.cos(angle) * Math.min(r, 290) * scale,
    y: Math.sin(angle) * Math.min(r, 150) * scale * 0.72,
  };
}

function getEntryOrigin(index: number): { x: number; y: number } {
  const side = index % 4;
  if (side === 0) return { x: 0, y: -420 };
  if (side === 1) return { x: 520, y: 0 };
  if (side === 2) return { x: 0, y: 420 };
  return { x: -520, y: 0 };
}

function getFloatParams(index: number) {
  const yAmp = 7 + (index % 4) * 2.5;
  const xAmp = 2.5 + (index % 3) * 1.5;
  const dur = 3.0 + (index % 6) * 0.38;
  return { yAmp, xAmp, dur };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SpaceBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Nebula glows */}
      {NEBULA_COLORS.map((n, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[120px]"
          style={{
            left: n.x, top: n.y,
            width: n.size, height: n.size,
            background: n.color,
            opacity: 0.06,
            transform: "translate(-50%, -50%)",
          }}
          animate={{ opacity: [0.05, 0.09, 0.05], scale: [1, 1.08, 1] }}
          transition={{ duration: 8 + i * 3, repeat: Infinity, ease: "easeInOut", delay: i * 2.5 }}
        />
      ))}

      {/* Star field */}
      {STARS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
          animate={{ opacity: [s.opacity, s.opacity * 2.8, s.opacity], scale: [1, 1.6, 1] }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
          }}
        />
      ))}

      {/* Subtle grid lines — feels like star map */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
    </div>
  );
}

function AvatarBubble({
  player,
  index,
  isMe,
  isNew,
  scale,
}: {
  player: LobbyPlayer;
  index: number;
  isMe: boolean;
  isNew: boolean;
  scale: number;
}) {
  const pos = getPos(index, scale);
  const entry = getEntryOrigin(index);
  const { yAmp, xAmp, dur } = getFloatParams(index);
  const avatarMeta = AVATARS.find((a) => a.id === player.avatar) ?? AVATARS[0];
  const avatarSize = scale < 0.75 ? 52 : 64;

  return (
    <motion.div
      key={player.id}
      className="absolute flex flex-col items-center"
      style={{ x: pos.x, y: pos.y, translateX: "-50%", translateY: "-50%" }}
      initial={{ x: entry.x + pos.x, y: entry.y + pos.y, scale: 0.4, opacity: 0 }}
      animate={{ x: pos.x, y: pos.y, scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 22, duration: 1.2 }}
    >
      {/* Continuous float */}
      <motion.div
        className="flex flex-col items-center"
        animate={{ y: [0, -yAmp, 0], x: [0, xAmp, 0, -xAmp, 0] }}
        transition={{
          y: { duration: dur, repeat: Infinity, ease: "easeInOut", delay: index * 0.18 },
          x: { duration: dur * 1.7, repeat: Infinity, ease: "easeInOut", delay: index * 0.13 },
        }}
      >
        {/* Ripple for new arrivals */}
        <AnimatePresence>
          {isNew && (
            <motion.div
              className="absolute rounded-full border border-white/50 pointer-events-none"
              style={{ width: avatarSize + 8, height: avatarSize + 8, top: -4, left: -4 }}
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 3.5, opacity: 0 }}
              exit={{}}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* "My" indicator */}
        {isMe && (
          <motion.div
            className="absolute inset-[-5px] rounded-full border-2 border-white/40 pointer-events-none"
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.04, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Avatar glow */}
        <div
          className="rounded-full"
          style={{
            filter: `drop-shadow(0 0 ${isMe ? "14px" : "8px"} ${avatarMeta.glow})`,
          }}
        >
          <AvatarSVG id={player.avatar} size={avatarSize} />
        </div>

        {/* Nickname */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white/90 whitespace-nowrap max-w-[100px] truncate"
          style={{
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${avatarMeta.color}40`,
          }}
        >
          {isMe ? `${player.nickname} (you)` : player.nickname}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LobbyRoom({
  roomCode,
  roomId,
  quizTitle,
  hostName,
  initialPlayers,
  isTeacher,
  qrDataUrl,
  initialStatus,
}: Props) {
  const router = useRouter();
  const [players, setPlayers] = useState<LobbyPlayer[]>(initialPlayers);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [scale, setScale] = useState(0.82);
  const [copied, setCopied] = useState(false);
  const playerIdsRef = useRef(new Set(initialPlayers.map((p) => p.id)));

  // Responsive scale
  useEffect(() => {
    const update = () =>
      setScale(window.innerWidth < 480 ? 0.52 : window.innerWidth < 768 ? 0.68 : window.innerWidth < 1100 ? 0.82 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Determine student identity from sessionStorage
  useEffect(() => {
    if (isTeacher) return;
    try {
      const raw = sessionStorage.getItem(`quizzard_${roomCode}`);
      if (!raw) { router.replace("/join?error=session_expired"); return; }
      const s = JSON.parse(raw) as { playerId: string };
      setMyPlayerId(s.playerId);
    } catch {
      router.replace("/join?error=session_expired");
    }
  }, [isTeacher, roomCode, router]);

  // Mark newcomer for sparkle, then clear after 1.4s
  const markNew = useCallback((id: string) => {
    setNewIds((prev) => new Set(Array.from(prev).concat(id)));
    setTimeout(() => setNewIds((prev) => { const n = new Set(prev); n.delete(id); return n; }), 1400);
  }, []);

  // Poll /api/lobby-players every 2.5 s — uses supabaseAdmin server-side so
  // it bypasses RLS and works for anonymous students too (not just the teacher).
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/lobby-players/${roomCode}`);
        if (!res.ok || cancelled) return;
        const { players: fetched } = (await res.json()) as { players: LobbyPlayer[] };
        if (cancelled) return;
        // Fire "new arrival" animation only for players not previously seen
        fetched.forEach((p) => {
          if (!playerIdsRef.current.has(p.id)) {
            playerIdsRef.current.add(p.id);
            markNew(p.id);
          }
        });
        setPlayers(fetched);
      } catch {}
    }

    poll(); // immediate first fetch
    const id = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [roomCode, markNew]);

  // Realtime — bonus fast-path for players joining + room status changes.
  // May silently fail for anonymous students due to RLS; polling above is the
  // reliable path. Realtime still handles the room status → redirect for all.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`lobby:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const p = payload.new as { id: string; nickname: string; avatar?: string };
          if (playerIdsRef.current.has(p.id)) return;
          playerIdsRef.current.add(p.id);
          const lp: LobbyPlayer = { id: p.id, nickname: p.nickname, avatar: p.avatar ?? "zeke" };
          setPlayers((prev) => [...prev, lp]);
          markNew(p.id);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new.status === "active") {
            if (isTeacher) {
              router.push(`/results/${roomId}`);
            } else {
              router.push(`/play/${roomCode}`);
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, roomCode, isTeacher, router, markNew]);

  // If room was already active when page loaded (teacher navigated back)
  useEffect(() => {
    if (initialStatus === "active") {
      if (isTeacher) router.push(`/results/${roomId}`);
      else router.push(`/play/${roomCode}`);
    }
  }, [initialStatus, isTeacher, roomId, roomCode, router]);

  async function handleLaunch() {
    setLaunching(true);
    setLaunchError(null);
    try {
      const res = await fetch("/api/start-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start.");
      // Realtime will fire the redirect; also do it directly for the teacher
      router.push(`/results/${roomId}`);
    } catch (err: unknown) {
      setLaunchError(err instanceof Error ? err.message : "Failed to start.");
      setLaunching(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const clusterH = scale < 0.6 ? "38vh" : scale < 0.8 ? "44vh" : "52vh";

  return (
    <div className="relative min-h-screen bg-[#080810] flex flex-col overflow-hidden">
      <SpaceBackground />

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-white/6 bg-[#080810]/70 backdrop-blur-xl">
        <span className="font-display text-lg font-bold text-white tracking-tight shrink-0">Quizzard</span>
        <span className="text-white/20 text-sm">·</span>
        <span className="text-sm text-white/45 truncate flex-1 min-w-0">{quizTitle}</span>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 shrink-0"
        >
          {/* Live dot */}
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <motion.span
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            <span className="hidden sm:inline">Live</span>
          </span>

          {/* Explorer count badge */}
          <motion.div
            key={players.length}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-3 py-1 rounded-full text-xs font-bold border border-white/12 bg-white/6 text-white"
          >
            {players.length} {players.length === 1 ? "explorer" : "explorers"}
          </motion.div>
        </motion.div>
      </header>

      {/* ── Teacher info strip (QR + big code + host) ────────────────────── */}
      {isTeacher && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-6 px-4 sm:px-8 pt-5 pb-4"
        >
          {/* Room code */}
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.25em] mb-1">
              Join at quizzard.app/join
            </p>
            <button
              onClick={copyCode}
              className="group relative flex items-center gap-3"
              title="Click to copy"
            >
              <span
                className="text-5xl sm:text-6xl font-black tracking-[0.18em] text-white"
                style={{ fontFamily: "var(--font-orbitron), monospace" }}
              >
                {roomCode}
              </span>
              <span className="text-xs text-white/30 group-hover:text-white/70 transition-colors">
                {copied ? "✓ Copied!" : "copy"}
              </span>
            </button>
            <p className="mt-1 text-xs text-white/30">
              Hosted by <span className="text-white/60">{hostName}</span>
            </p>
          </div>

          {/* QR */}
          {qrDataUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex-shrink-0"
            >
              <div className="rounded-xl overflow-hidden bg-white p-1.5 shadow-2xl ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt={`QR for ${roomCode}`} className="w-24 h-24 sm:w-28 sm:h-28 block" />
              </div>
              <p className="text-[10px] text-white/30 text-center mt-1.5">Scan to join</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── Student waiting header ────────────────────────────────────────── */}
      {!isTeacher && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center pt-5 pb-2 px-4"
        >
          <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.2em]">
            Room · {roomCode}
          </p>
          <p className="mt-1.5 text-sm text-white/50">
            {hostName} is preparing the quiz…
          </p>
        </motion.div>
      )}

      {/* ── Avatar cluster ────────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center overflow-hidden"
        style={{ minHeight: clusterH }}
      >
        {players.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl mb-4 select-none"
            >
              🛸
            </motion.div>
            <p className="text-white/25 text-sm">Waiting for explorers to board…</p>
          </motion.div>
        ) : (
          <div className="relative" style={{ width: 0, height: 0 }}>
            <AnimatePresence>
              {players.map((player, i) => (
                <AvatarBubble
                  key={player.id}
                  player={player}
                  index={i}
                  isMe={player.id === myPlayerId}
                  isNew={newIds.has(player.id)}
                  scale={scale}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Bottom controls ───────────────────────────────────────────────── */}
      <div className="relative z-20 border-t border-white/6 bg-[#080810]/70 backdrop-blur-xl px-4 sm:px-8 py-4">
        {isTeacher ? (
          <div className="max-w-sm mx-auto space-y-2">
            <AnimatePresence>
              {launchError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-400 text-center pb-1"
                >
                  {launchError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleLaunch}
              disabled={launching || players.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden transition-all"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #4f46e5 100%)",
                backgroundSize: "200% 200%",
                boxShadow: "0 0 32px rgba(124,58,237,0.4)",
              }}
            >
              {/* Shimmer overlay */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              />
              <span className="relative">
                {launching ? "Launching…" : players.length === 0 ? "Waiting for explorers…" : `🚀 Launch Quiz · ${players.length} ready`}
              </span>
            </motion.button>

            <p className="text-center text-xs text-white/25">
              Students see this lobby on their phones in real time
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Pulsing orbit */}
            <div className="flex items-center gap-3">
              <motion.div
                className="w-2 h-2 rounded-full bg-indigo-400"
                animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-sm text-white/50 font-medium">
                Waiting for captain to launch…
              </p>
              <motion.div
                className="w-2 h-2 rounded-full bg-indigo-400"
                animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </div>

            {/* Student's own avatar highlight */}
            {myPlayerId && (() => {
              const me = players.find((p) => p.id === myPlayerId);
              if (!me) return null;
              const meta = AVATARS.find((a) => a.id === me.avatar) ?? AVATARS[0];
              return (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8">
                  <AvatarSVG id={me.avatar} size={24} />
                  <span className="text-xs text-white/60">
                    You&apos;re <span className="font-semibold" style={{ color: meta.color }}>{meta.name}</span>
                  </span>
                </div>
              );
            })()}
          </motion.div>
        )}
      </div>
    </div>
  );
}
