import { NextRequest, NextResponse } from "next/server";
import { generateLandingHtml } from "@/lib/anthropic";
import { buildUserPrompt, extractHTML, TRIPLE_VARIANTS } from "@/lib/prompt";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { FormData, Tier } from "@/types";

export const maxDuration = 90;

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

export async function POST(req: NextRequest) {
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
    const htmlPages: string[] =
      tier === "signature"
        ? [extractHTML(await generateLandingHtml(buildUserPrompt(formData)))]
        : await Promise.all(
            TRIPLE_VARIANTS.map(async v =>
              extractHTML(await generateLandingHtml(buildUserPrompt(formData, v)))
            )
          );

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

    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error("[generate]", e);
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
