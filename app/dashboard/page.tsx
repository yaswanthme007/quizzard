import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import TeacherNav from "@/components/TeacherNav";
import PdfUploader from "./PdfUploader";
import ApiKeySettings from "./ApiKeySettings";
import QuizHistory from "./QuizHistory";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email }, { onConflict: "id" });

  const [profileResult, quizzesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("groq_api_key, ai_provider")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("quizzes")
      .select("id, title, status, created_at, questions(id)")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const profile = profileResult.data;
  const quizzes = quizzesResult.data ?? [];
  const hasApiKey = !!(profile?.groq_api_key) || !!process.env.GROQ_API_KEY;
  const savedProvider = (profile?.ai_provider as string) || "groq";

  const displayName: string =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "Teacher";

  const avatarInitial = displayName[0].toUpperCase();

  return (
    <div className="min-h-screen bg-[#080810]">
      <TeacherNav name={displayName} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column: Welcome card + Quiz history */}
          <div className="lg:col-span-2 space-y-5">
            {/* Welcome card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-xl font-bold text-white font-display shrink-0">
                  {avatarInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <p className="text-xs text-white/35 mt-0.5">
                    {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"} created
                  </p>
                </div>
              </div>
            </div>

            {/* Quiz history */}
            <QuizHistory quizzes={quizzes as Array<{
              id: string;
              title: string;
              status: string;
              created_at: string;
              questions: { id: string }[];
            }>} />
          </div>

          {/* Right column: PDF uploader + API key settings */}
          <div className="lg:col-span-3 space-y-5">
            <PdfUploader hasApiKey={hasApiKey} />
            <ApiKeySettings hasApiKey={!!(profile?.groq_api_key)} savedProvider={savedProvider} />
          </div>
        </div>
      </main>
    </div>
  );
}
