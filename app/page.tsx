import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import LandingHero from "./LandingHero";
import LandingUserNav from "./LandingUserNav";

export default async function LandingPage() {
  let displayName: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      displayName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        null;
    }
  } catch {
    // not signed in
  }

  return (
    <div className="relative min-h-screen bg-[#080810] flex flex-col overflow-hidden">
      {/* Subtle single top-center glow — no purple wash */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[560px] rounded-full bg-indigo-600/8 blur-[140px]" />

      {/* Nav */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-white/5">
        <span className="font-display text-xl font-bold text-white tracking-tight">Quizzard</span>
        {displayName ? (
          <LandingUserNav name={displayName} />
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-white/50 hover:text-white transition-colors duration-200"
          >
            Teacher Login →
          </Link>
        )}
      </header>

      {/* Animated hero — client island */}
      <LandingHero />

      <footer className="relative z-10 text-center py-6 text-xs text-white/20">
        Built with Next.js · AI-powered
      </footer>
    </div>
  );
}
