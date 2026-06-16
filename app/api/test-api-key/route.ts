import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { groqChat, GroqError } from "@/lib/groq";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let key: string;
  try {
    ({ key } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!key || typeof key !== "string" || !key.trim()) {
    return NextResponse.json({ error: "'key' is required." }, { status: 400 });
  }

  try {
    await groqChat(
      [{ role: "user", content: "Say hi" }],
      { max_tokens: 1, apiKey: key.trim() }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof GroqError) {
      return NextResponse.json(
        { error: `API returned ${err.status}. Check your key and try again.` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Key test failed." }, { status: 400 });
  }
}
