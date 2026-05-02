import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

/**
 * Canonical site URL for Stripe redirects, emails, and download links.
 * Set NEXT_PUBLIC_BASE_URL in production (especially with a custom domain).
 * On Vercel, VERCEL_URL is used when unset so preview deployments work without extra env.
 */
export function getPublicBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}
