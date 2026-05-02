import { Resend } from "resend";
import {
  buildPurchaseConfirmationEmail,
  htmlAttachmentFilename,
} from "@/lib/email-templates";
import { getPublicBaseUrl } from "@/lib/stripe";
import type { Tier } from "@/types";

let client: Resend | null = null;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export type PurchaseConfirmationPayload = {
  to: string;
  restaurantName: string;
  purchaseTier: Tier;
  formattedAmount: string;
  htmlFiles: string[];
  downloadToken: string;
};

export async function sendPurchaseConfirmationEmail(
  payload: PurchaseConfirmationPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const baseUrl = getPublicBaseUrl();
  const variantCount = Math.max(1, payload.htmlFiles.length);

  const { subject, html } = buildPurchaseConfirmationEmail({
    restaurantName: payload.restaurantName,
    purchaseTier: payload.purchaseTier,
    formattedAmount: payload.formattedAmount,
    baseUrl,
    downloadToken: payload.downloadToken,
    variantCount,
  });

  const attachments = payload.htmlFiles.map((content, i) => ({
    filename: htmlAttachmentFilename(payload.restaurantName, i, payload.htmlFiles.length),
    content: Buffer.from(content, "utf-8").toString("base64"),
  }));

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "Plate Studio <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: payload.to,
    subject,
    html,
    attachments,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
