import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { AIProvider } from "@/lib/ai";

const VALID_PROVIDERS: AIProvider[] = ["groq", "openai", "gemini"];

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let key: string;
  let provider: AIProvider;
  try {
    const body = await request.json();
    key = body.key;
    provider = VALID_PROVIDERS.includes(body.provider) ? body.provider : "groq";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof key !== "string") {
    return NextResponse.json({ error: "'key' must be a string." }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ groq_api_key: key.trim() || null, ai_provider: provider })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
