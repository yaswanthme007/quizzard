"use server";

import QRCode from "qrcode";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type QuestionData = {
  id: string;
  question_text: string;
  options: [string, string, string, string];
  correct_answer: string;
  explanation: string;
  order_index: number;
};

type QuestionInput = Omit<QuestionData, "id" | "order_index">;

async function verifyOwnership(quizId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized.");

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("id", quizId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!quiz) throw new Error("Quiz not found or access denied.");

  return { supabase, user };
}

export async function saveQuiz(
  quizId: string,
  title: string,
  questions: QuestionInput[]
): Promise<{ questions: QuestionData[] }> {
  const { supabase } = await verifyOwnership(quizId);

  await supabase.from("quizzes").update({ title }).eq("id", quizId);

  // Delete-and-reinsert is the simplest correct approach for full-array edits
  await supabase.from("questions").delete().eq("quiz_id", quizId);

  const { data, error } = await supabase
    .from("questions")
    .insert(
      questions.map((q, index) => ({
        quiz_id: quizId,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        order_index: index,
      }))
    )
    .select("id, question_text, options, correct_answer, explanation, order_index");

  if (error) throw new Error(error.message);

  return {
    questions: (data ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map((q) => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options as [string, string, string, string],
        correct_answer: q.correct_answer,
        explanation: q.explanation ?? "",
        order_index: q.order_index,
      })),
  };
}

function randomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function publishQuiz(
  quizId: string
): Promise<{ roomId: string; code: string; qrDataUrl: string }> {
  const { supabase } = await verifyOwnership(quizId);

  const code = randomCode();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({ quiz_id: quizId, code, status: "active" })
    .select("id")
    .single();

  if (roomError || !room) {
    throw new Error(roomError?.message ?? "Failed to create room.");
  }

  await supabase
    .from("quizzes")
    .update({ status: "published" })
    .eq("id", quizId);

  // Build join URL from request headers (avoids window.location which doesn't exist server-side)
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const joinUrl = `${proto}://${host}/join?code=${code}`;
  const qrDataUrl = await QRCode.toDataURL(joinUrl, { width: 200, margin: 2 });

  return { roomId: room.id, code, qrDataUrl };
}
