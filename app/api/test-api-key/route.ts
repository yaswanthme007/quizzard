import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { aiChat, AIError, type AIProvider } from "@/lib/ai";

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

  if (!key || typeof key !== "string" || !key.trim()) {
    return NextResponse.json({ error: "'key' is required." }, { status: 400 });
  }

  try {
    await aiChat(
      [{ role: "user", content: "Say hi" }],
      { provider, apiKey: key.trim(), max_tokens: 1 }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json(
        { error: `API returned ${err.status}. Check your key and try again.` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Key test failed." }, { status: 400 });
  }
}
