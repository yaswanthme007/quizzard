// Inline SVG alien avatars — no image files needed
// DB migration required: ALTER TABLE players ADD COLUMN avatar text NOT NULL DEFAULT 'zeke';

export type AvatarId = "zeke" | "bloop" | "nova" | "orby" | "sparx" | "otto" | "glitch" | "shado";

export interface AvatarMeta {
  id: AvatarId;
  name: string;
  color: string;
  glow: string;
}

export const AVATARS: AvatarMeta[] = [
  { id: "zeke",   name: "Zeke",   color: "#22c55e", glow: "rgba(34,197,94,0.5)"  },
  { id: "bloop",  name: "Bloop",  color: "#3b82f6", glow: "rgba(59,130,246,0.5)" },
  { id: "nova",   name: "Nova",   color: "#ec4899", glow: "rgba(236,72,153,0.5)" },
  { id: "orby",   name: "Orby",   color: "#a855f7", glow: "rgba(168,85,247,0.5)" },
  { id: "sparx",  name: "Sparx",  color: "#eab308", glow: "rgba(234,179,8,0.5)"  },
  { id: "otto",   name: "Otto",   color: "#f97316", glow: "rgba(249,115,22,0.5)" },
  { id: "glitch", name: "Glitch", color: "#14b8a6", glow: "rgba(20,184,166,0.5)" },
  { id: "shado",  name: "Shado",  color: "#ef4444", glow: "rgba(239,68,68,0.5)"  },
];

// ─── Zeke — Green Cyclops ────────────────────────────────────────────────────
function Zeke() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="30" y1="26" x2="20" y2="9" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="19" cy="7" r="5.5" fill="#86efac"/>
      <circle cx="19" cy="7" r="2.5" fill="#22c55e"/>
      <line x1="50" y1="26" x2="60" y2="9" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="61" cy="7" r="5.5" fill="#86efac"/>
      <circle cx="61" cy="7" r="2.5" fill="#22c55e"/>
      <circle cx="40" cy="47" r="27" fill="#22c55e"/>
      <ellipse cx="29" cy="36" rx="11" ry="7" fill="white" opacity="0.22" transform="rotate(-20 29 36)"/>
      <circle cx="40" cy="45" r="18" fill="#052e16"/>
      <circle cx="40" cy="45" r="14" fill="white"/>
      <circle cx="40" cy="45" r="9" fill="#22c55e"/>
      <circle cx="40" cy="45" r="5.5" fill="#052e16"/>
      <circle cx="44" cy="41" r="2.5" fill="white"/>
      <path d="M29 66 Q40 74 51 66" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="22" cy="58" r="5" fill="#86efac" opacity="0.35"/>
      <circle cx="58" cy="58" r="5" fill="#86efac" opacity="0.35"/>
    </svg>
  );
}

// ─── Bloop — Blue Jellyfish ───────────────────────────────────────────────────
function Bloop() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 44 Q10 14 40 14 Q70 14 70 44 Z" fill="#3b82f6"/>
      <ellipse cx="28" cy="27" rx="11" ry="6.5" fill="white" opacity="0.22" transform="rotate(-30 28 27)"/>
      <circle cx="30" cy="34" r="8.5" fill="white"/>
      <circle cx="50" cy="34" r="8.5" fill="white"/>
      <circle cx="31" cy="34" r="5.5" fill="#1d4ed8"/>
      <circle cx="51" cy="34" r="5.5" fill="#1d4ed8"/>
      <circle cx="33" cy="32" r="2" fill="white"/>
      <circle cx="53" cy="32" r="2" fill="white"/>
      <path d="M31 47 Q40 54 49 47" stroke="#1d4ed8" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M21 44 C17 56 23 62 19 72" stroke="#60a5fa" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M32 46 C30 59 27 65 25 75" stroke="#93c5fd" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M48 46 C50 59 53 65 55 75" stroke="#93c5fd" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M59 44 C63 56 57 62 61 72" stroke="#60a5fa" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <circle cx="19" cy="61" r="3" fill="#bfdbfe" opacity="0.8"/>
      <circle cx="61" cy="61" r="3" fill="#bfdbfe" opacity="0.8"/>
      <circle cx="25" cy="70" r="2" fill="#dbeafe" opacity="0.7"/>
      <circle cx="55" cy="70" r="2" fill="#dbeafe" opacity="0.7"/>
    </svg>
  );
}

// ─── Nova — Pink Star ─────────────────────────────────────────────────────────
function Nova() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="40,6 47.6,29.5 70.4,30.1 52.4,44 58.8,65.9 40,53 21.2,65.9 27.6,44 9.6,30.1 32.4,29.5"
        fill="#ec4899"
      />
      <polygon
        points="40,6 47.6,29.5 70.4,30.1 52.4,44 58.8,65.9 40,53 21.2,65.9 27.6,44 9.6,30.1 32.4,29.5"
        fill="none" stroke="#f9a8d4" strokeWidth="1.5" opacity="0.5"
      />
      <ellipse cx="32" cy="26" rx="8" ry="5" fill="white" opacity="0.22" transform="rotate(-15 32 26)"/>
      <circle cx="34" cy="39" r="5.5" fill="white"/>
      <circle cx="46" cy="39" r="5.5" fill="white"/>
      <circle cx="34.5" cy="39" r="3.5" fill="#9d174d"/>
      <circle cx="46.5" cy="39" r="3.5" fill="#9d174d"/>
      <circle cx="36" cy="38" r="1.5" fill="white"/>
      <circle cx="48" cy="38" r="1.5" fill="white"/>
      <path d="M33 46 Q40 52 47 46" stroke="#9d174d" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="11" cy="44" r="2.5" fill="#f9a8d4" opacity="0.7"/>
      <circle cx="69" cy="44" r="2.5" fill="#f9a8d4" opacity="0.7"/>
      <circle cx="40" cy="70" r="2.5" fill="#f9a8d4" opacity="0.7"/>
    </svg>
  );
}

// ─── Orby — Purple Saturn ─────────────────────────────────────────────────────
function Orby() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 45 Q22 38 40 45" stroke="#c084fc" strokeWidth="3" fill="none" opacity="0.4" strokeLinecap="round"/>
      <circle cx="40" cy="45" r="23" fill="#a855f7"/>
      <ellipse cx="30" cy="35" rx="10" ry="6.5" fill="white" opacity="0.2" transform="rotate(-20 30 35)"/>
      <circle cx="53" cy="55" r="4" fill="#9333ea" opacity="0.45"/>
      <circle cx="33" cy="53" r="3" fill="#9333ea" opacity="0.35"/>
      <circle cx="34" cy="43" r="6.5" fill="white"/>
      <circle cx="46" cy="43" r="6.5" fill="white"/>
      <circle cx="34.5" cy="43" r="4.5" fill="#581c87"/>
      <circle cx="46.5" cy="43" r="4.5" fill="#581c87"/>
      <circle cx="36" cy="41.5" r="1.8" fill="white"/>
      <circle cx="48" cy="41.5" r="1.8" fill="white"/>
      <path d="M4 45 Q22 52 40 45 Q58 38 76 45" stroke="#c084fc" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <circle cx="4" cy="45" r="3" fill="#e9d5ff" opacity="0.6"/>
      <circle cx="76" cy="45" r="3" fill="#e9d5ff" opacity="0.6"/>
    </svg>
  );
}

// ─── Sparx — Yellow Electric ──────────────────────────────────────────────────
function Sparx() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="68,42 56.6,48.9 59.8,61.8 46.9,58.6 40,70 33.1,58.6 20.2,61.8 23.4,48.9 12,42 23.4,35.1 20.2,22.2 33.1,25.4 40,14 46.9,25.4 59.8,22.2 56.6,35.1"
        fill="#eab308"
      />
      <circle cx="40" cy="42" r="19" fill="#fde047"/>
      <ellipse cx="31" cy="32" rx="9" ry="6" fill="white" opacity="0.25" transform="rotate(-20 31 32)"/>
      <ellipse cx="33" cy="42" rx="7.5" ry="5.5" fill="white"/>
      <ellipse cx="47" cy="42" rx="7.5" ry="5.5" fill="white"/>
      <ellipse cx="33" cy="42" rx="5" ry="3.5" fill="#713f12"/>
      <ellipse cx="47" cy="42" rx="5" ry="3.5" fill="#713f12"/>
      <circle cx="35" cy="41" r="1.8" fill="white"/>
      <circle cx="49" cy="41" r="1.8" fill="white"/>
      <path d="M31 52 L34 49 L37 52 L40 49 L43 52 L46 49 L49 52"
        stroke="#713f12" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 36 L9 33 L12 38 L10 34" stroke="#fef08a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M74 36 L71 33 L68 38 L70 34" stroke="#fef08a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M40 7 L42 11 L40 9 L38 13" stroke="#fef08a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Otto — Orange Octopus ────────────────────────────────────────────────────
function Otto() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 57 C22 67 20 72 18 76" stroke="#fb923c" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M34 59 C31 69 30 73 29 78" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M40 60 C40 70 39 74 39 78" stroke="#fb923c" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M46 59 C49 69 50 73 51 78" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M52 57 C58 67 60 72 62 76" stroke="#fb923c" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M22 48 C13 57 12 64 14 70" stroke="#fdba74" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <circle cx="40" cy="36" r="24" fill="#f97316"/>
      <ellipse cx="30" cy="25" rx="10" ry="6.5" fill="white" opacity="0.22" transform="rotate(-25 30 25)"/>
      <circle cx="48" cy="44" r="4.5" fill="#ea580c" opacity="0.45"/>
      <circle cx="33" cy="46" r="3.5" fill="#ea580c" opacity="0.35"/>
      <circle cx="44" cy="27" r="3" fill="#fed7aa" opacity="0.55"/>
      <circle cx="31" cy="30" r="9.5" fill="white"/>
      <circle cx="49" cy="30" r="9.5" fill="white"/>
      <circle cx="32" cy="30" r="6.5" fill="#7c2d12"/>
      <circle cx="50" cy="30" r="6.5" fill="#7c2d12"/>
      <circle cx="33.5" cy="28" r="2.5" fill="white"/>
      <circle cx="51.5" cy="28" r="2.5" fill="white"/>
      <path d="M28 48 Q40 58 52 48" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Glitch — Teal Robot ──────────────────────────────────────────────────────
function Glitch() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="40" y1="16" x2="40" y2="6" stroke="#0d9488" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="40" cy="4" r="4.5" fill="#5eead4"/>
      <circle cx="9" cy="37" r="6" fill="#0d9488"/>
      <circle cx="9" cy="37" r="3" fill="#5eead4" opacity="0.6"/>
      <circle cx="71" cy="37" r="6" fill="#0d9488"/>
      <circle cx="71" cy="37" r="3" fill="#5eead4" opacity="0.6"/>
      <rect x="14" y="16" width="52" height="44" rx="9" ry="9" fill="#14b8a6"/>
      <rect x="16" y="18" width="48" height="9" rx="7" fill="white" opacity="0.14"/>
      <line x1="16" y1="24" x2="64" y2="24" stroke="#0d9488" strokeWidth="1.5" opacity="0.4"/>
      <rect x="20" y="27" width="40" height="22" rx="4" fill="#0d9488"/>
      <rect x="23" y="30" width="15" height="15" rx="2.5" fill="#99f6e4"/>
      <rect x="26" y="33" width="4" height="9" rx="1.5" fill="#0f766e"/>
      <rect x="31" y="33" width="4" height="9" rx="1.5" fill="#0f766e"/>
      <rect x="42" y="30" width="15" height="15" rx="2.5" fill="#99f6e4"/>
      <rect x="45" y="33" width="4" height="9" rx="1.5" fill="#0f766e"/>
      <rect x="50" y="33" width="4" height="9" rx="1.5" fill="#0f766e"/>
      <rect x="22" y="52" width="36" height="5" rx="2.5" fill="#0d9488"/>
      <rect x="24" y="53" width="4" height="3" rx="1" fill="#5eead4"/>
      <rect x="30" y="53" width="4" height="3" rx="1" fill="#5eead4"/>
      <rect x="36" y="53" width="4" height="3" rx="1" fill="#5eead4"/>
      <rect x="42" y="53" width="4" height="3" rx="1" fill="#5eead4"/>
      <rect x="48" y="53" width="4" height="3" rx="1" fill="#5eead4"/>
    </svg>
  );
}

// ─── Shado — Red Ghost ────────────────────────────────────────────────────────
function Shado() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 40 Q16 14 40 14 Q64 14 64 40 L64 58 Q57 67 50 60 Q44 53 40 60 Q36 67 30 60 Q23 53 16 58 Z"
        fill="#ef4444"
      />
      <path
        d="M16 40 Q16 14 40 14 Q64 14 64 40 L64 58 Q57 67 50 60 Q44 53 40 60 Q36 67 30 60 Q23 53 16 58 Z"
        fill="none" stroke="#fca5a5" strokeWidth="2.5" opacity="0.4"
      />
      <ellipse cx="28" cy="26" rx="9" ry="5.5" fill="white" opacity="0.2" transform="rotate(-20 28 26)"/>
      <ellipse cx="31" cy="40" rx="9.5" ry="8.5" fill="white"/>
      <ellipse cx="49" cy="40" rx="9.5" ry="8.5" fill="white"/>
      <ellipse cx="31" cy="41" rx="6" ry="6" fill="#7f1d1d"/>
      <ellipse cx="49" cy="41" rx="6" ry="6" fill="#7f1d1d"/>
      <ellipse cx="31" cy="41" rx="2.5" ry="2.5" fill="#fca5a5"/>
      <ellipse cx="49" cy="41" rx="2.5" ry="2.5" fill="#fca5a5"/>
      <circle cx="28.5" cy="38.5" r="2" fill="white" opacity="0.7"/>
      <circle cx="46.5" cy="38.5" r="2" fill="white" opacity="0.7"/>
    </svg>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
export function AvatarSVG({ id, size = 80 }: { id: string; size?: number }) {
  const el = (() => {
    switch (id) {
      case "zeke":   return <Zeke />;
      case "bloop":  return <Bloop />;
      case "nova":   return <Nova />;
      case "orby":   return <Orby />;
      case "sparx":  return <Sparx />;
      case "otto":   return <Otto />;
      case "glitch": return <Glitch />;
      case "shado":  return <Shado />;
      default:       return <Zeke />;
    }
  })();
  return <div style={{ width: size, height: size, flexShrink: 0 }}>{el}</div>;
}
