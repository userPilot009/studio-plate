import Anthropic from "@anthropic-ai/sdk";
import { CACHED_SYSTEM_PROMPT } from "@/lib/prompt";

/**
 * Default: latest Sonnet — `claude-sonnet-4-6` (best balance of quality and cost for HTML generation).
 * Override with `ANTHROPIC_MODEL=claude-opus-4-7` for flagship quality.
 */
const DEFAULT_MODEL = "claude-sonnet-4-6";

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
    max_tokens: 16384,
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
  return text;
}
