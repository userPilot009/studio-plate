import type { Tier } from "@/types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80) || "restaurant";
}

export function htmlAttachmentFilename(
  restaurantName: string,
  variantIndex: number,
  totalVariants: number
): string {
  const base = slugName(restaurantName);
  const suffix = totalVariants > 1 ? `-direction-${variantIndex + 1}` : "";
  return `${base}${suffix}.html`;
}

export type PurchaseConfirmationParams = {
  restaurantName: string;
  purchaseTier: Tier;
  formattedAmount: string;
  baseUrl: string;
  downloadToken: string;
  variantCount: number;
};

export function buildPurchaseConfirmationEmail(p: PurchaseConfirmationParams): {
  subject: string;
  html: string;
} {
  const tierLabel = p.purchaseTier === "triple" ? "Triple" : "Signature";

  const links = Array.from({ length: p.variantCount }, (_, i) => {
    const url = `${p.baseUrl}/api/download/${p.downloadToken}?i=${i}`;
    const label =
      p.variantCount > 1 ? `Design direction ${i + 1}` : "Download your landing page";
    return { url: escapeHtml(url), label: escapeHtml(label) };
  });

  const linksHtml = links
    .map(
      l =>
        `<p style="margin:12px 0;"><a href="${l.url}" style="color:#8B4513;text-decoration:underline;">${l.label}</a></p>`
    )
    .join("");

  const safeSubject =
    p.restaurantName.trim().length > 0
      ? `Your ${p.restaurantName.trim()} landing page is ready`
      : "Your Plate Studio landing page is ready";

  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f7f4ef;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4ef;padding:24px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e8e4dc;border-radius:4px;padding:28px 24px;">
<tr><td>
<p style="margin:0 0 16px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6560;">Thank you</p>
<h1 style="margin:0 0 16px;font-size:22px;font-weight:normal;font-style:italic;line-height:1.35;">Your purchase is complete</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#3d3d3d;">
We&apos;ve attached your watermark-free HTML file${p.variantCount > 1 ? "s" : ""} to this email. You can also download ${p.variantCount > 1 ? "them" : "it"} using the secure links below whenever you need.
</p>

<h2 style="margin:24px 0 8px;font-size:14px;font-weight:normal;letter-spacing:0.06em;text-transform:uppercase;color:#6b6560;">Receipt</h2>
<p style="margin:0 0 6px;font-size:16px;line-height:1.5;"><strong>${escapeHtml(tierLabel)}</strong> — ${escapeHtml(p.formattedAmount)}</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#5c5c5c;">Paid via Stripe. Keep this email for your records.</p>

<h2 style="margin:24px 0 8px;font-size:14px;font-weight:normal;letter-spacing:0.06em;text-transform:uppercase;color:#6b6560;">Download links</h2>
<p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#3d3d3d;">
These links stay valid for <strong>30 days</strong> or up to <strong>five downloads</strong> each (whichever comes first).
</p>
${linksHtml}

<h2 style="margin:28px 0 10px;font-size:14px;font-weight:normal;letter-spacing:0.06em;text-transform:uppercase;color:#6b6560;">What to do next</h2>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#3d3d3d;">
You don&apos;t need to be technical to use your files:
</p>
<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.65;color:#3d3d3d;">
<li style="margin-bottom:8px;"><strong>Go live quickly:</strong> drag the HTML file into <a href="https://app.netlify.com/drop" style="color:#8B4513;">Netlify Drop</a> (free) for a simple hosted page.</li>
<li style="margin-bottom:8px;"><strong>Already have help?</strong> forward this email and the attachment to your web designer or agency.</li>
<li style="margin-bottom:8px;"><strong>Stuck?</strong> reply to this email and we&apos;ll point you in the right direction.</li>
</ul>

<p style="margin:24px 0 0;font-size:14px;line-height:1.55;color:#7a726a;">
With thanks,<br/>
<strong>Plate Studio</strong>
</p>
</td></tr></table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#9a9288;text-align:center;">
You received this email because you completed a purchase at Plate Studio.
</p>
</td></tr></table>
</body>
</html>`;

  return { subject: safeSubject, html };
}
