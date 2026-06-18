import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  const code = params.roomCode.toUpperCase();

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const { data: players } = await supabaseAdmin
    .from("players")
    .select("id, nickname, avatar")
    .eq("room_id", room.id)
    .order("created_at" as string);

  return NextResponse.json({ players: players ?? [] });
}
