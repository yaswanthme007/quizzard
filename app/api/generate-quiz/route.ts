import { NextRequest, NextResponse } from "next/server";
import { aiChat, AIError, type AIProvider } from "@/lib/ai";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const TEXT_LIMIT = 25_000;

type QuizQuestion = {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

type RequestBody = {
  text?: string;
  title?: string;
  count?: number;
  difficulty?: string;
};

function buildMessages(text: string, count: number, difficulty: string) {
  return [
    {
      role: "system" as const,
      content:
        "You are a quiz generator. You output only valid JSON. No markdown, no commentary, no code fences.",
    },
    {
      role: "user" as const,
      content:
        `Based ONLY on the study material below, create ${count} multiple-choice questions at ${difficulty} difficulty. ` +
        `Return ONLY a JSON array. Each item must have exactly this shape: ` +
        `{ "question_text": "string", "options": ["string","string","string","string"], ` +
        `"correct_answer": "the exact text of the correct option", ` +
        `"explanation": "one sentence explaining why, based on the material" }. ` +
        `Rules: exactly 4 options, correct_answer must match one option word for word, ` +
        `questions must be answerable from the material only, keep questions clear and unambiguous.\n\n` +
        `STUDY MATERIAL:\n"""${text}"""`,
    },
  ];
}

function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
}

function parseQuestions(raw: string): QuizQuestion[] {
  const parsed = JSON.parse(stripFences(raw));
  if (!Array.isArray(parsed)) throw new Error("AI response is not a JSON array.");
  return parsed as QuizQuestion[];
}

async function callAI(
  messages: ReturnType<typeof buildMessages>,
  apiKey: string,
  provider: AIProvider,
  allow429Retry = true
): Promise<string> {
  try {
    return await aiChat(messages, { provider, apiKey, max_tokens: 4096, temperature: 0.4 });
  } catch (err) {
    if (allow429Retry && err instanceof AIError && err.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      return aiChat(messages, { provider, apiKey, max_tokens: 4096, temperature: 0.4 });
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { text, title = "Untitled Quiz", count = 10, difficulty = "medium" } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "'text' is required." }, { status: 400 });
  }

  const truncatedText = text.slice(0, TEXT_LIMIT);
  const messages = buildMessages(truncatedText, count, difficulty);

  let raw: string;
  try {
    raw = await callAI(messages, apiKey, provider);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let questions: QuizQuestion[];
  try {
    questions = parseQuestions(raw);
  } catch {
    try {
      raw = await callAI(messages, apiKey, provider, false);
      questions = parseQuestions(raw);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse quiz JSON.";
      return NextResponse.json(
        { error: `Quiz generation failed: ${message}` },
        { status: 502 }
      );
    }
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      teacher_id: user.id,
      title,
      source_text: truncatedText,
      status: "draft",
    })
    .select("id")
    .single();

  if (quizError || !quiz) {
    return NextResponse.json(
      { error: quizError?.message ?? "Failed to create quiz." },
      { status: 500 }
    );
  }

  const questionRows = questions.map((q, index) => ({
    quiz_id: quiz.id,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    order_index: index,
  }));

  const { error: questionsError } = await supabase
    .from("questions")
    .insert(questionRows);

  if (questionsError) {
    await supabase.from("quizzes").delete().eq("id", quiz.id);
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  return NextResponse.json({ quizId: quiz.id });
}
