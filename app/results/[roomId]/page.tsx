import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ResultsDashboard from "./ResultsDashboard";

interface Props {
  params: { roomId: string };
}

export default async function ResultsPage({ params }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, status, quiz_id")
    .eq("id", params.roomId)
    .maybeSingle();
  if (!room) redirect("/dashboard");

  // Ownership check through quiz
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title")
    .eq("id", room.quiz_id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!quiz) redirect("/dashboard");

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, order_index")
    .eq("quiz_id", room.quiz_id)
    .order("order_index");

  const { data: players } = await supabase
    .from("players")
    .select("id, nickname, score")
    .eq("room_id", params.roomId)
    .order("score", { ascending: false });

  const playerIds = (players ?? []).map((p) => p.id);
  let answers: AnswerRow[] = [];
  if (playerIds.length > 0) {
    const { data } = await supabase
      .from("answers")
      .select("player_id, question_id, selected_answer, is_correct")
      .in("player_id", playerIds);
    answers = (data ?? []) as AnswerRow[];
  }

  const displayName: string =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "Teacher";

  return (
    <ResultsDashboard
      roomId={params.roomId}
      roomCode={room.code}
      roomStatus={room.status}
      quizTitle={quiz.title}
      questions={(questions ?? []) as QuestionRow[]}
      initialPlayers={(players ?? []) as PlayerRow[]}
      initialAnswers={answers}
      name={displayName}
    />
  );
}

// Local types — only used to communicate to the client component
interface QuestionRow {
  id: string;
  question_text: string;
  order_index: number;
}
interface PlayerRow {
  id: string;
  nickname: string;
  score: number;
}
interface AnswerRow {
  player_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
}
