"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const COLORS = ["#6366f1","#8b5cf6","#f59e0b","#10b981","#ec4899","#3b82f6"];

interface Particle { id: number; x: number; y: number; color: string; rotate: number; }

export default function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    setParticles(
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 300,
        y: -(Math.random() * 200 + 80),
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 720 - 360,
      }))
    );
    const t = setTimeout(() => setParticles([]), 1800);
    return () => clearTimeout(t);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4, rotate: p.rotate }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ backgroundColor: p.color }}
          className="absolute left-1/2 top-1/2 w-2.5 h-2.5 rounded-sm"
        />
      ))}
    </div>
  );
}
