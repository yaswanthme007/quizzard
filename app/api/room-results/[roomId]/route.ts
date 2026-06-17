import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("quiz_id")
    .eq("id", params.roomId)
    .maybeSingle();
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const { data: quiz } = await supabaseAdmin
    .from("quizzes")
    .select("id")
    .eq("id", room.quiz_id)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!quiz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: players } = await supabaseAdmin
    .from("players")
    .select("id, nickname, score")
    .eq("room_id", params.roomId)
    .order("score", { ascending: false });

  const playerIds = (players ?? []).map((p: { id: string }) => p.id);
  let answers: unknown[] = [];
  if (playerIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("answers")
      .select("player_id, question_id, selected_answer, is_correct")
      .in("player_id", playerIds);
    answers = data ?? [];
  }

  return NextResponse.json({ players: players ?? [], answers });
}
