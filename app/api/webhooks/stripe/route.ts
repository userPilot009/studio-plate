import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sendPurchaseConfirmationEmail } from "@/lib/resend";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { FormData, Tier } from "@/types";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

const TOKEN_MS = 30 * 24 * 60 * 60 * 1000;

function formatReceiptAmount(session: Stripe.Checkout.Session): string {
  const total = session.amount_total;
  const currency = (session.currency ?? "gbp").toUpperCase();
  if (total == null) return "—";
  const major = currency === "JPY" || currency === "KRW" ? total : total / 100;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(major);
  } catch {
    return `${(total / 100).toFixed(2)} ${currency}`;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const generationId = session.metadata?.generation_id;
  if (!generationId) {
    console.error("[stripe webhook] Missing generation_id metadata", session.id);
    return NextResponse.json({ received: true });
  }

  const purchaseTier: Tier =
    session.metadata?.purchase_tier === "triple" ? "triple" : "signature";

  try {
    const supabase = createServiceRoleClient();

    const { data: existing, error: fetchError } = await supabase
      .from("generations")
      .select(
        "id, paid, stripe_session_id, html, tier, form_data, email, download_token, confirmation_email_sent_at"
      )
      .eq("id", generationId)
      .maybeSingle();

    if (fetchError) {
      console.error("[stripe webhook] Fetch failed", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!existing) {
      console.error("[stripe webhook] Unknown generation", generationId);
      return NextResponse.json({ received: true });
    }

    const customerEmail =
      session.customer_details?.email ||
      session.customer_email ||
      existing.email ||
      null;

    const formData = existing.form_data as FormData;
    const restaurantName = formData?.restaurantName?.trim() || "Restaurant";
    const htmlArr = (existing.html as string[]) ?? [];

    const fullyProcessed =
      existing.paid &&
      existing.stripe_session_id === session.id &&
      existing.confirmation_email_sent_at;

    if (fullyProcessed) {
      return NextResponse.json({ received: true });
    }

    const sendMail = async (token: string) => {
      if (!customerEmail || !customerEmail.includes("@")) {
        console.warn("[stripe webhook] No customer email — skipping Resend", generationId);
        await supabase
          .from("generations")
          .update({ confirmation_email_sent_at: new Date().toISOString() })
          .eq("id", generationId);
        return true;
      }

      if (!htmlArr.length) {
        console.error("[stripe webhook] No HTML to attach", generationId);
        return false;
      }

      if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY?.trim()) {
        console.warn(
          "[stripe webhook] RESEND_API_KEY not set — skipping email in development"
        );
        await supabase
          .from("generations")
          .update({ confirmation_email_sent_at: new Date().toISOString() })
          .eq("id", generationId);
        return true;
      }

      const result = await sendPurchaseConfirmationEmail({
        to: customerEmail,
        restaurantName,
        purchaseTier,
        formattedAmount: formatReceiptAmount(session),
        htmlFiles: htmlArr,
        downloadToken: token,
      });

      if (!result.ok) {
        console.error("[stripe webhook] Resend failed", result.error);
        return false;
      }

      const { error: sentErr } = await supabase
        .from("generations")
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq("id", generationId);

      if (sentErr) {
        console.error("[stripe webhook] confirmation_email_sent_at update failed", sentErr);
        return false;
      }

      return true;
    };

    // Stripe retry after DB succeeded but email failed — send without duplicating payment row updates
    if (
      existing.paid &&
      existing.stripe_session_id === session.id &&
      !existing.confirmation_email_sent_at
    ) {
      const token = existing.download_token;
      if (!token) {
        console.error("[stripe webhook] Recovery: missing download_token", generationId);
        return NextResponse.json({ error: "Invalid generation state" }, { status: 500 });
      }
      const ok = await sendMail(token);
      if (!ok) {
        return NextResponse.json({ error: "Email delivery failed" }, { status: 500 });
      }
      return NextResponse.json({ received: true });
    }

    if (existing.paid) {
      console.warn(
        "[stripe webhook] Generation already paid with different session",
        generationId
      );
      return NextResponse.json({ received: true });
    }

    const downloadToken = randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_MS).toISOString();

    const { error } = await supabase
      .from("generations")
      .update({
        paid: true,
        email: customerEmail,
        stripe_session_id: session.id,
        download_token: downloadToken,
        download_token_expires_at: expiresAt,
      })
      .eq("id", generationId);

    if (error) {
      console.error("[stripe webhook] Supabase update failed", error);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    const ok = await sendMail(downloadToken);
    if (!ok) {
      return NextResponse.json({ error: "Email delivery failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe webhook]", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
