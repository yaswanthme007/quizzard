import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// DB migration: ALTER TABLE players ADD COLUMN avatar text NOT NULL DEFAULT 'zeke';
export async function POST(request: NextRequest) {
  let body: { code?: string; nickname?: string; avatar?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase() ?? "";
  const nickname = body.nickname?.trim() ?? "";
  const avatar = body.avatar ?? "zeke";

  if (!code || !nickname) {
    return NextResponse.json({ error: "Code and nickname are required." }, { status: 400 });
  }
  if (nickname.length > 20) {
    return NextResponse.json(
      { error: "Nickname must be 20 characters or less." },
      { status: 400 }
    );
  }

  // Find room
  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("id, quiz_id, status")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json(
      { error: "Room not found. Check your code and try again." },
      { status: 404 }
    );
  }
  if (room.status !== "active" && room.status !== "lobby") {
    return NextResponse.json({ error: "This room is closed." }, { status: 403 });
  }

  // Nickname uniqueness (case-insensitive within room)
  const { data: taken } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("room_id", room.id)
    .ilike("nickname", nickname)
    .maybeSingle();

  if (taken) {
    return NextResponse.json(
      { error: "That nickname is already taken. Choose another." },
      { status: 409 }
    );
  }

  // Insert player
  const { data: player, error: playerError } = await supabaseAdmin
    .from("players")
    .insert({ room_id: room.id, nickname, score: 0, avatar })
    .select("id")
    .single();

  if (playerError || !player) {
    return NextResponse.json({ error: "Failed to join room." }, { status: 500 });
  }

  // Fetch questions — no correct_answer, no explanation
  const { data: questions } = await supabaseAdmin
    .from("questions")
    .select("id, question_text, options, order_index")
    .eq("quiz_id", room.quiz_id)
    .order("order_index");

  return NextResponse.json({ playerId: player.id, questions: questions ?? [] });
}
