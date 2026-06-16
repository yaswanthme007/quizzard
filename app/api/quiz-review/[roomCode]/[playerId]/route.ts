import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface Params {
  params: { roomCode: string; playerId: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { roomCode, playerId } = params;

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("id, quiz_id")
    .eq("code", roomCode.toUpperCase())
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  // Verify player belongs to this room
  const { data: player } = await supabaseAdmin
    .from("players")
    .select("id, nickname, score")
    .eq("id", playerId)
    .eq("room_id", room.id)
    .maybeSingle();

  if (!player) {
    return NextResponse.json({ error: "Player not found." }, { status: 404 });
  }

  // Questions WITH correct_answer and explanation for review
  const { data: questions } = await supabaseAdmin
    .from("questions")
    .select("id, question_text, options, correct_answer, explanation, order_index")
    .eq("quiz_id", room.quiz_id)
    .order("order_index");

  const { data: answers } = await supabaseAdmin
    .from("answers")
    .select("question_id, selected_answer, is_correct")
    .eq("player_id", playerId);

  const answerMap = new Map((answers ?? []).map((a) => [a.question_id, a]));

  const review = (questions ?? []).map((q) => {
    const ans = answerMap.get(q.id);
    return {
      question_text: q.question_text,
      options: q.options as string[],
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? "",
      selected_answer: ans?.selected_answer ?? null,
      is_correct: ans?.is_correct ?? false,
    };
  });

  return NextResponse.json({
    player: { nickname: player.nickname, score: player.score },
    total: questions?.length ?? 0,
    review,
  });
}
