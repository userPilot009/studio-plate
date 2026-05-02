"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { C } from "@/lib/tokens";

interface SuccessContentProps {
  generationId: string;
  initialReady: boolean;
  downloadToken: string | null;
  baseUrl: string;
  variantCount: number;
}

export default function SuccessContent({
  generationId,
  initialReady,
  downloadToken: initialToken,
  baseUrl,
  variantCount,
}: SuccessContentProps) {
  const [ready, setReady] = useState(initialReady);
  const [token, setToken] = useState<string | null>(initialToken);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (initialReady) return;
    let cancelled = false;

    (async () => {
      for (let i = 0; i < 45 && !cancelled; i++) {
        try {
          const res = await fetch(
            `/api/purchase-status?generationId=${encodeURIComponent(generationId)}`
          );
          const data = await res.json();
          if (data.ready && data.downloadToken) {
            setReady(true);
            setToken(data.downloadToken);
            return;
          }
        } catch {
          /* ignore */
        }
        await new Promise(r => setTimeout(r, 2000));
      }
      if (!cancelled) setTimedOut(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [generationId, initialReady]);

  const downloads =
    token && variantCount > 0
      ? Array.from({ length: variantCount }, (_, i) => ({
          label: variantCount > 1 ? `Design direction ${i + 1}` : "Your landing page",
          href: `${baseUrl}/api/download/${token}?i=${i}`,
        }))
      : [];

  return (
    <div
      style={{
        backgroundColor: C.bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.text,
        fontFamily: "'Crimson Pro', Georgia, serif",
        padding: "2rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "480px", textAlign: "center" }}>
        <p
          className="cp"
          style={{
            fontSize: "12px",
            opacity: 0.55,
            marginBottom: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Payment confirmed
        </p>
        <h1
          className="cg"
          style={{ fontSize: "32px", fontStyle: "italic", marginBottom: "12px", lineHeight: 1.25 }}
        >
          Thank you — your purchase is complete
        </h1>
        <p className="cp" style={{ color: C.muted, fontSize: "17px", lineHeight: 1.6, marginBottom: "1.75rem" }}>
          {!ready && !timedOut && "Preparing your files… this usually takes a few seconds."}
          {ready &&
            "Your watermark-free HTML is ready to download. Keep these links safe — they stay valid for 30 days or up to five downloads each."}
          {timedOut &&
            !ready &&
            "Your payment was received. If downloads don&apos;t appear here, use the link we&apos;ll send by email."}
        </p>

        {ready && downloads.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "1.75rem",
              textAlign: "left",
            }}
          >
            {downloads.map(d => (
              <a
                key={d.href}
                href={d.href}
                className="hvr"
                style={{
                  display: "block",
                  padding: "12px 16px",
                  borderRadius: "4px",
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.surface,
                  color: C.accent,
                  textDecoration: "none",
                  fontSize: "16px",
                }}
              >
                Download — {d.label}
              </a>
            ))}
          </div>
        )}

        {timedOut && !ready && (
          <p className="cp" style={{ color: "#C84040", fontSize: "15px", marginBottom: "1.25rem" }}>
            Your payment went through, but we couldn&apos;t confirm your files yet. Check your email shortly, or
            contact support with your receipt.
          </p>
        )}

        <Link
          href="/"
          className="cp"
          style={{ color: C.muted, fontSize: "15px", textDecoration: "underline", textUnderlineOffset: "4px" }}
        >
          Back to Plate Studio
        </Link>
      </div>
    </div>
  );
}
