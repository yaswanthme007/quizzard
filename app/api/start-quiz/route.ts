import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  let body: { roomId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { roomId } = body;
  if (!roomId) return NextResponse.json({ error: "roomId required." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("quiz_id, status")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (room.status !== "lobby") return NextResponse.json({ error: "Room is not in lobby state." }, { status: 409 });

  const { data: quiz } = await supabaseAdmin
    .from("quizzes")
    .select("id")
    .eq("id", room.quiz_id)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!quiz) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { error } = await supabaseAdmin
    .from("rooms")
    .update({ status: "active" })
    .eq("id", roomId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
