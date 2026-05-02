import { NextRequest, NextResponse } from "next/server";
import { generateLandingHtml } from "@/lib/anthropic";
import { buildUserPrompt, extractHTML, TRIPLE_VARIANTS } from "@/lib/prompt";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { FormData, Tier } from "@/types";

export const maxDuration = 300;

function parseGeneratePayload(record: Record<string, unknown>): { ok: true; formData: FormData; tier: Tier } | { ok: false; error: string } {
  const tier: Tier = record.tier === "triple" ? "triple" : "signature";

  const src =
    record.formData !== undefined &&
    record.formData !== null &&
    typeof record.formData === "object" &&
    !Array.isArray(record.formData)
      ? (record.formData as Record<string, unknown>)
      : record;

  const restaurantName = typeof src.restaurantName === "string" ? src.restaurantName.trim() : "";
  const location = typeof src.location === "string" ? src.location.trim() : "";
  const cuisine = typeof src.cuisine === "string" ? src.cuisine.trim() : "";
  const goal = typeof src.goal === "string" ? src.goal.trim() : "";

  const vibeWords = Array.isArray(src.vibeWords)
    ? src.vibeWords.filter((x): x is string => typeof x === "string")
    : [];

  const pricePoint = typeof src.pricePoint === "string" ? src.pricePoint.trim() : "";
  const targetCustomer = typeof src.targetCustomer === "string" ? src.targetCustomer.trim() : "";

  const dish1 = typeof src.dish1 === "string" ? src.dish1.trim() : "";
  const dish2 = typeof src.dish2 === "string" ? src.dish2.trim() : "";
  const dish3 = typeof src.dish3 === "string" ? src.dish3.trim() : "";
  const differentFrom = typeof src.differentFrom === "string" ? src.differentFrom.trim() : "";
  const hours = typeof src.hours === "string" ? src.hours.trim() : "";
  const phone = typeof src.phone === "string" ? src.phone.trim() : "";
  const address = typeof src.address === "string" ? src.address.trim() : "";
  const palette = typeof src.palette === "string" ? src.palette.trim() : "";
  const specialRequests = typeof src.specialRequests === "string" ? src.specialRequests.trim() : "";

  if (!restaurantName || !location || !cuisine || !goal) {
    return { ok: false, error: "Missing required fields (restaurant, location, cuisine, goal)." };
  }
  if (vibeWords.length === 0 || !pricePoint || !targetCustomer) {
    return { ok: false, error: "Missing vibe, price point, or target customer." };
  }
  if (!dish1 || !address) {
    return { ok: false, error: "At least one signature dish and address are required." };
  }

  const formData: FormData = {
    restaurantName,
    location,
    cuisine,
    goal,
    vibeWords,
    pricePoint,
    targetCustomer,
    dish1,
    dish2,
    dish3,
    differentFrom,
    hours,
    phone,
    address,
    palette,
    specialRequests,
  };

  return { ok: true, formData, tier };
}

async function generateTripleHtmlPages(formData: FormData): Promise<string[]> {
  const tripleStart = Date.now();

  const attemptVariant = async (index: number): Promise<string> => {
    console.log(`[variant ${index}] start`);
    const t0 = Date.now();
    try {
      const raw = await generateLandingHtml(buildUserPrompt(formData, TRIPLE_VARIANTS[index]));
      const html = extractHTML(raw);
      console.log(`[variant ${index}] completed in ${Date.now() - t0}ms`);
      return html;
    } catch (e) {
      console.error(`[variant ${index}] failed after ${Date.now() - t0}ms`, e);
      throw e;
    }
  };

  const slots: (string | null)[] = [null, null, null];

  const applySettled = (
    settled: PromiseSettledResult<string>[],
    indices: number[]
  ) => {
    settled.forEach((result, j) => {
      const i = indices[j];
      if (result.status === "fulfilled" && result.value.length > 0) {
        slots[i] = result.value;
      }
    });
  };

  const round1 = await Promise.allSettled([
    attemptVariant(0),
    attemptVariant(1),
    attemptVariant(2),
  ]);
  applySettled(round1, [0, 1, 2]);

  const failedAfterRound1 = [0, 1, 2].filter(i => slots[i] === null);
  if (failedAfterRound1.length > 0) {
    console.log(
      `[triple] retrying variants: ${failedAfterRound1.join(", ")}`
    );
    const round2 = await Promise.allSettled(
      failedAfterRound1.map(i => attemptVariant(i))
    );
    applySettled(round2, failedAfterRound1);
  }

  const htmlPages = slots.map(h => h ?? "");
  const successCount = htmlPages.filter(h => h.length > 0).length;

  console.log(`[generate] triple wall-clock ${Date.now() - tripleStart}ms (successes: ${successCount}/3)`);

  if (successCount === 0) {
    throw new Error("All three design directions failed after retry.");
  }

  return htmlPages;
}

export async function POST(req: NextRequest) {
  const routeStart = Date.now();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = parseGeneratePayload(body as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { formData, tier } = parsed;

  try {
    let htmlPages: string[];
    if (tier === "signature") {
      console.log("[generate] signature start");
      const t0 = Date.now();
      htmlPages = [extractHTML(await generateLandingHtml(buildUserPrompt(formData)))];
      console.log(`[generate] signature completed in ${Date.now() - t0}ms`);
    } else {
      htmlPages = await generateTripleHtmlPages(formData);
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("generations")
      .insert({
        form_data: formData,
        html: htmlPages,
        tier,
        paid: false,
      })
      .select("id")
      .single();

    if (error) throw error;
    if (!data?.id) throw new Error("Insert succeeded but no id returned");

    console.log(`[generate] route total wall-clock ${Date.now() - routeStart}ms`);

    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error("[generate]", e);
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
