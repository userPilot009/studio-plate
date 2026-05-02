import { NextRequest, NextResponse } from "next/server";
import { getPublicBaseUrl, getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Tier } from "@/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  let body: { generationId?: string; tier?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const generationId = body.generationId?.trim();
  const purchaseTier = body.tier === "triple" ? "triple" : "signature";
  const email = typeof body.email === "string" ? body.email.trim() : undefined;

  if (!generationId || !UUID_RE.test(generationId)) {
    return NextResponse.json({ error: "Invalid generation" }, { status: 400 });
  }

  const priceSignature = process.env.STRIPE_PRICE_ID_SIGNATURE;
  const priceTriple = process.env.STRIPE_PRICE_ID_TRIPLE;
  if (!priceSignature || !priceTriple) {
    console.error("[checkout] Missing STRIPE_PRICE_ID_SIGNATURE or STRIPE_PRICE_ID_TRIPLE");
    return NextResponse.json({ error: "Payments not configured" }, { status: 500 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: row, error: fetchError } = await supabase
      .from("generations")
      .select("id, paid, tier, html")
      .eq("id", generationId)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    if (row.paid) {
      return NextResponse.json({ error: "This preview has already been purchased" }, { status: 400 });
    }

    const html = row.html as string[];
    if (!html?.length) {
      return NextResponse.json({ error: "Nothing to purchase yet" }, { status: 400 });
    }

    const generatedTier = row.tier as Tier;
    if (purchaseTier === "triple") {
      if (generatedTier !== "triple" || html.length < 3) {
        return NextResponse.json(
          {
            error:
              "Triple tier is only available when your preview was generated with three design directions. Generate again or choose Signature.",
          },
          { status: 400 }
        );
      }
    }

    const priceId = purchaseTier === "triple" ? priceTriple : priceSignature;

    const stripe = getStripe();
    const baseUrl = getPublicBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/preview/${generationId}`,
      metadata: {
        generation_id: generationId,
        purchase_tier: purchaseTier,
      },
      ...(email && email.includes("@") ? { customer_email: email } : {}),
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout]", e);
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
