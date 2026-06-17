import { NextRequest, NextResponse } from "next/server";
import { aiChat, AIError, type AIProvider } from "@/lib/ai";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const TEXT_LIMIT = 25_000;
const SYSTEM_MESSAGE =
  "You are a quiz generator. You output only valid JSON. No markdown, no commentary, no code fences.";

function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
}

type NewQuestion = {
  question_text: string;
  options: [string, string, string, string];
  correct_answer: string;
  explanation: string;
};

function parseOne(raw: string): NewQuestion {
  const parsed = JSON.parse(stripFences(raw));
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a single JSON object.");
  }
  return parsed as NewQuestion;
}

async function callAI(
  prompt: string,
  apiKey: string,
  provider: AIProvider,
  allow429Retry = true
): Promise<string> {
  const messages = [
    { role: "system" as const, content: SYSTEM_MESSAGE },
    { role: "user" as const, content: prompt },
  ];
  try {
    return await aiChat(messages, { provider, apiKey, max_tokens: 1024, temperature: 0.5 });
  } catch (err) {
    if (allow429Retry && err instanceof AIError && err.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      return aiChat(messages, { provider, apiKey, max_tokens: 1024, temperature: 0.5 });
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("groq_api_key, ai_provider")
    .eq("id", user.id)
    .maybeSingle();

  const apiKey = profile?.groq_api_key || process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "No AI API key configured. Add your key in Dashboard → AI Provider." },
      { status: 400 }
    );
  }

  const provider: AIProvider =
    (profile?.ai_provider as AIProvider | null) ?? "groq";

  let questionId: string;
  try {
    ({ questionId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!questionId) {
    return NextResponse.json({ error: "'questionId' is required." }, { status: 400 });
  }

  const { data: question } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_answer, explanation, order_index, quiz_id")
    .eq("id", questionId)
    .maybeSingle();

  if (!question) {
    return NextResponse.json(
      { error: "Question not found. Save the quiz before regenerating." },
      { status: 404 }
    );
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("teacher_id, source_text")
    .eq("id", question.quiz_id)
    .maybeSingle();

  if (!quiz || quiz.teacher_id !== user.id) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const { data: others } = await supabase
    .from("questions")
    .select("question_text")
    .eq("quiz_id", question.quiz_id)
    .neq("id", questionId);

  const otherTexts = (others ?? [])
    .map((q, i) => `${i + 1}. ${q.question_text}`)
    .join("\n");

  const sourceText = (quiz.source_text ?? "").slice(0, TEXT_LIMIT);

  const prompt =
    `Based ONLY on the study material below, create ONE new multiple-choice question. ` +
    `It must be DIFFERENT from the question being replaced and must NOT duplicate any existing question listed. ` +
    `Return ONLY a single JSON object: { "question_text": "string", "options": ["string","string","string","string"], ` +
    `"correct_answer": "the exact text of the correct option", ` +
    `"explanation": "one sentence explaining why, based on the material" }.\n\n` +
    `QUESTION BEING REPLACED:\n"""${question.question_text}"""\n\n` +
    `EXISTING QUESTIONS TO AVOID:\n${otherTexts}\n\n` +
    `STUDY MATERIAL:\n"""${sourceText}"""`;

  let raw: string;
  try {
    raw = await callAI(prompt, apiKey, provider);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let newQuestion: NewQuestion;
  try {
    newQuestion = parseOne(raw);
  } catch {
    try {
      raw = await callAI(prompt, apiKey, provider, false);
      newQuestion = parseOne(raw);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse question JSON.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("questions")
    .update({
      question_text: newQuestion.question_text,
      options: newQuestion.options,
      correct_answer: newQuestion.correct_answer,
      explanation: newQuestion.explanation,
    })
    .eq("id", questionId)
    .select("id, question_text, options, correct_answer, explanation, order_index")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? "Failed to save regenerated question." },
      { status: 500 }
    );
  }

  return NextResponse.json({ question: updated });
}
