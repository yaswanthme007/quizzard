const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  apiKey?: string;
}

export class GroqError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "GroqError";
  }
}

export async function groqChat(
  messages: Message[],
  options: ChatOptions = {}
): Promise<string> {
  const key = options.apiKey ?? process.env.GROQ_API_KEY;
  if (!key) throw new GroqError("No Groq API key configured.", 401);

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new GroqError(`Groq API error ${response.status}: ${body}`, response.status);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}
