import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase() ?? "";

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  }

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("id, status, host_name")
    .eq("code", code)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  if (room.status !== "active") {
    return NextResponse.json({ error: "This room is closed." }, { status: 403 });
  }

  return NextResponse.json({ hostName: room.host_name ?? null });
}
