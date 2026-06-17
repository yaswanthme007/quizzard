export type AIProvider = "groq" | "openai" | "gemini";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIOptions {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export class AIError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "AIError";
  }
}

const OPENAI_COMPAT: Record<"groq" | "openai", { baseUrl: string; defaultModel: string }> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
};

async function openAICompatibleChat(messages: Message[], opts: AIOptions): Promise<string> {
  const config = OPENAI_COMPAT[opts.provider as "groq" | "openai"];
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model ?? config.defaultModel,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 1024,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new AIError(`${opts.provider} API error ${res.status}: ${body}`, res.status);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function geminiChat(messages: Message[], opts: AIOptions): Promise<string> {
  const system = messages.find((m) => m.role === "system");
  const turns = messages.filter((m) => m.role !== "system");

  const reqBody: Record<string, unknown> = {
    contents: turns.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.max_tokens ?? 1024,
    },
  };

  if (system) {
    reqBody.system_instruction = { parts: [{ text: system.content }] };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${opts.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new AIError(`Gemini API error ${res.status}: ${text}`, res.status);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text as string;
}

export async function aiChat(messages: Message[], opts: AIOptions): Promise<string> {
  if (opts.provider === "gemini") return geminiChat(messages, opts);
  return openAICompatibleChat(messages, opts);
}

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  groq: "Groq",
  openai: "OpenAI",
  gemini: "Google Gemini",
};
