import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Orbitron } from "next/font/google";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import LobbyRoom from "./LobbyRoom";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["700", "800", "900"],
  display: "swap",
});

interface Props {
  params: { roomCode: string };
}

export interface LobbyPlayer {
  id: string;
  nickname: string;
  avatar: string;
}

export default async function LobbyPage({ params }: Props) {
  const code = params.roomCode.toUpperCase();

  const { data: room } = await supabaseAdmin
    .from("rooms")
    .select("id, quiz_id, status, host_name")
    .eq("code", code)
    .maybeSingle();

  if (!room) redirect("/join?error=invalid_room");
  if (room.status === "finished") redirect("/join?error=room_closed");

  const { data: quiz } = await supabaseAdmin
    .from("quizzes")
    .select("title")
    .eq("id", room.quiz_id)
    .maybeSingle();

  const { data: rawPlayers } = await supabaseAdmin
    .from("players")
    .select("id, nickname, avatar")
    .eq("room_id", room.id)
    .order("created_at" as string);

  const initialPlayers: LobbyPlayer[] = (rawPlayers ?? []).map((p) => ({
    id: p.id,
    nickname: p.nickname,
    avatar: (p as { avatar?: string }).avatar ?? "zeke",
  }));

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isTeacher = false;
  if (user) {
    const { data: owned } = await supabaseAdmin
      .from("quizzes")
      .select("id")
      .eq("id", room.quiz_id)
      .eq("teacher_id", user.id)
      .maybeSingle();
    isTeacher = !!owned;
  }

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const joinUrl = `${proto}://${host}/join?code=${code}`;
  const qrDataUrl = isTeacher
    ? await QRCode.toDataURL(joinUrl, { width: 220, margin: 2, color: { dark: "#000", light: "#fff" } })
    : "";

  return (
    <div className={orbitron.variable}>
      <LobbyRoom
        roomCode={code}
        roomId={room.id}
        quizTitle={quiz?.title ?? "Quiz"}
        hostName={room.host_name ?? "Teacher"}
        initialPlayers={initialPlayers}
        isTeacher={isTeacher}
        qrDataUrl={qrDataUrl}
        initialStatus={room.status}
      />
    </div>
  );
}
