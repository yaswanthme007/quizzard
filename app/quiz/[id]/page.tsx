import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import QuizEditor from "./QuizEditor";

interface Props {
  params: { id: string };
}

export default async function QuizPage({ params }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: quiz } = await supabase
    .from("quizzes")
    .select(
      "id, title, status, source_text, questions(id, question_text, options, correct_answer, explanation, order_index)"
    )
    .eq("id", params.id)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!quiz) redirect("/dashboard");

  // Load existing active room if quiz is already published
  const { data: room } = await supabase
    .from("rooms")
    .select("id, code")
    .eq("quiz_id", params.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const displayName: string =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "Teacher";

  const sortedQuestions = [...((quiz.questions as QuestionRow[]) ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <QuizEditor
      quiz={{
        id: quiz.id,
        title: quiz.title,
        status: quiz.status,
        source_text: quiz.source_text ?? "",
        questions: sortedQuestions.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options as [string, string, string, string],
          correct_answer: q.correct_answer,
          explanation: q.explanation ?? "",
          order_index: q.order_index,
        })),
      }}
      existingRoom={room ?? null}
      userName={displayName}
    />
  );
}

interface QuestionRow {
  id: string;
  question_text: string;
  options: unknown;
  correct_answer: string;
  explanation: string | null;
  order_index: number;
}
