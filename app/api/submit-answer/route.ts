import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  let body: { playerId?: string; questionId?: string; selectedAnswer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { playerId, questionId, selectedAnswer } = body;

  if (!playerId || !questionId || selectedAnswer === undefined || selectedAnswer === null) {
    return NextResponse.json(
      { error: "playerId, questionId, and selectedAnswer are required." },
      { status: 400 }
    );
  }

  // Load player
  const { data: player } = await supabaseAdmin
    .from("players")
    .select("id, room_id, score")
    .eq("id", playerId)
    .maybeSingle();

  if (!player) {
    return NextResponse.json({ error: "Player not found." }, { status: 404 });
  }

  // Load room — must be active
  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("quiz_id, status")
    .eq("id", player.room_id)
    .maybeSingle();

  if (!room || room.status !== "active") {
    return NextResponse.json({ error: "Room is not active." }, { status: 403 });
  }

  // Load question — scoped to this quiz for ownership verification
  const { data: question } = await supabaseAdmin
    .from("questions")
    .select("correct_answer, explanation")
    .eq("id", questionId)
    .eq("quiz_id", room.quiz_id)
    .maybeSingle();

  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  // Idempotency — return existing result if already answered
  const { data: existing } = await supabaseAdmin
    .from("answers")
    .select("is_correct, selected_answer")
    .eq("player_id", playerId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      isCorrect: existing.is_correct,
      correctAnswer: question.correct_answer,
      explanation: question.explanation ?? "",
    });
  }

  const isCorrect = question.correct_answer === selectedAnswer;

  await supabaseAdmin.from("answers").insert({
    player_id: playerId,
    question_id: questionId,
    selected_answer: selectedAnswer,
    is_correct: isCorrect,
  });

  if (isCorrect) {
    await supabaseAdmin
      .from("players")
      .update({ score: player.score + 1 })
      .eq("id", playerId);
  }

  return NextResponse.json({
    isCorrect,
    correctAnswer: question.correct_answer,
    explanation: question.explanation ?? "",
  });
}
