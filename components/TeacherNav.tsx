"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function TeacherNav({ name }: { name: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#080810]/80 backdrop-blur-xl border-b border-white/8"
    >
      <div className="px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="font-display text-lg font-bold text-white hover:text-indigo-400 transition-colors shrink-0"
        >
          Quizzard
        </Link>
        <span className="flex-1" />
        <span className="text-sm text-white/50 hidden sm:block truncate max-w-xs">
          {name}
        </span>
        <motion.button
          onClick={handleSignOut}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-lg bg-white/5 hover:bg-white/10 transition-all shrink-0"
        >
          Sign Out
        </motion.button>
      </div>
    </motion.nav>
  );
}
