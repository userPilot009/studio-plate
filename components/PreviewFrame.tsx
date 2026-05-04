"use client";

import { useState } from "react";
import Link from "next/link";
import { C } from "@/lib/tokens";
import { TRIPLE_VARIANTS } from "@/lib/prompt";
import type { Tier } from "@/types";
import Btn from "@/components/ui/Btn";

const WM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="120"><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia,serif" font-size="18" font-weight="700" fill="rgba(0,0,0,0.18)" transform="rotate(-28,140,60)" letter-spacing="5">PREVIEW ONLY</text></svg>`;

interface PreviewFrameProps {
  htmlPages: string[];
  restaurantName: string;
  generationId: string;
  tier: Tier;
}

export default function PreviewFrame({ htmlPages, restaurantName, generationId, tier }: PreviewFrameProps) {
  const [variant, setVariant] = useState(0);
  const [checkoutError, setCheckoutError] = useState("");

  const safeIndex = Math.min(variant, Math.max(0, htmlPages.length - 1));
  const html = htmlPages[safeIndex] ?? "";
  const showVariantTabs = tier === "triple" && htmlPages.length > 1;

  const tripleAvailable = tier === "triple" && htmlPages.length >= 3;

  const startCheckout = async (checkoutTier: "signature" | "triple") => {
    setCheckoutError("");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, tier: checkoutTier }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCheckoutError(typeof data.error === "string" ? data.error : "Checkout could not start.");
      return;
    }
    if (data.url) window.location.href = data.url;
  };

  const gridRows = showVariantTabs
    ? "60px auto minmax(240px, 1fr) auto"
    : "60px minmax(240px, 1fr) auto";

  return (
    <div
      style={{
        backgroundColor: C.bg,
        height: "100dvh",
        maxHeight: "100dvh",
        display: "grid",
        gridTemplateRows: gridRows,
        overflow: "hidden",
      }}
    >

      {/* Top bar */}
      <div style={{ backgroundColor: "rgba(10,9,8,0.97)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}`, padding: "0 1.5rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" className="cg hvr" style={{ fontSize: "20px", letterSpacing: "0.1em", color: C.accent, fontWeight: 600, textDecoration: "none" }}>
          PLATE STUDIO
        </Link>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <p className="cp" style={{ color: C.muted, fontSize: "13px" }}>
            Source files unlock after purchase
          </p>
        </div>
      </div>

      {showVariantTabs && (
        <div
          role="tablist"
          aria-label="Design directions"
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            padding: "10px 1.5rem",
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: "rgba(10,9,8,0.98)",
          }}
        >
          {TRIPLE_VARIANTS.slice(0, htmlPages.length).map((v, i) => {
            const label = v.label;
            const active = safeIndex === i;
            return (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setVariant(i)}
                className="cp"
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: `1px solid ${active ? C.accent : C.border}`,
                  backgroundColor: active ? "rgba(193, 39, 27, 0.15)" : C.surface,
                  color: active ? C.accent : C.muted,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontFamily: "'Crimson Pro', Georgia, serif",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* iframe + watermark — grid row minmax(240px,1fr) guarantees non-zero height; iframe fills via absolute inset */}
      <div
        style={{
          position: "relative",
          minHeight: 0,
          overflow: "hidden",
          backgroundColor: "#111",
        }}
      >
        <iframe
          srcDoc={html}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", display: "block" }}
          title="Generated page preview"
          sandbox="allow-scripts allow-same-origin"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(WM_SVG)}")`,
            backgroundRepeat: "repeat",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Purchase bar */}
      <div style={{ backgroundColor: "rgba(10,9,8,0.98)", borderTop: `1px solid ${C.border}`, padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", minHeight: "90px" }}>
        <div>
          <p className="cg" style={{ fontSize: "22px", color: C.text, fontStyle: "italic", marginBottom: "2px" }}>Love what you see?</p>
          <p className="cp" style={{ color: C.muted, fontSize: "14px" }}>Purchase to remove the watermark and receive your files by email</p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <Btn onClick={() => startCheckout("signature")} style={{ padding: "10px 22px", fontSize: "15px" }}>
              Signature — £499
            </Btn>
            <p className="cp" style={{ color: C.mutedMid, fontSize: "12px", marginTop: "4px" }}>1 design direction</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <Btn
              primary
              disabled={!tripleAvailable}
              onClick={() => startCheckout("triple")}
              style={{ padding: "10px 26px", fontSize: "15px", position: "relative" }}
            >
              Triple — £999
              <span style={{ marginLeft: "8px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "10px", padding: "2px 8px", fontSize: "11px", letterSpacing: "0.05em" }}>BEST VALUE</span>
            </Btn>
            <p className="cp" style={{ color: C.mutedMid, fontSize: "12px", marginTop: "4px" }}>
              {tripleAvailable ? "3 design directions" : "Generate with Triple on the build form to unlock"}
            </p>
          </div>
        </div>
        {checkoutError && (
          <p className="cp" style={{ color: "#C84040", fontSize: "14px", marginTop: "12px", width: "100%", textAlign: "center" }}>
            {checkoutError}
          </p>
        )}
      </div>
    </div>
  );
}
