import Anthropic from "@anthropic-ai/sdk";
import { CACHED_SYSTEM_PROMPT } from "@/lib/prompt";

/**
 * Default: flagship Opus — `claude-opus-4-7` (highest quality for HTML generation).
 * Override with `ANTHROPIC_MODEL=claude-sonnet-4-6` for lower cost.
 */
const DEFAULT_MODEL = "claude-opus-4-7";

function getModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

export function createAnthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey: key });
}

/** One landing-page generation using cached system prompt + user message. */
export async function generateLandingHtml(userPrompt: string): Promise<string> {
  const client = createAnthropic();
  const message = await client.messages.create({
    model: getModel(),
    max_tokens: 10000,
    system: [
      {
        type: "text",
        text: CACHED_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  let text = "";
  for (const block of message.content) {
    if (block.type === "text") text += block.text;
  }
  if (!text.trim()) throw new Error("Empty response from Claude");
  if (message.stop_reason === "max_tokens") {
    throw new Error("Claude output was truncated (max_tokens reached). Please retry.");
  }
  if (!text.includes("</html>")) {
    throw new Error("Claude returned incomplete HTML (missing </html>). Please retry.");
  }
  return text;
}
