"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C } from "@/lib/tokens";
import { VIBES, GOALS, PRICE_POINTS, CUSTOMERS, PALETTES } from "@/lib/prompt";
import type { FormData, Tier } from "@/types";
import Btn from "@/components/ui/Btn";
import Input from "@/components/ui/Input";
import Chip from "@/components/ui/Chip";

const EMPTY_FORM: FormData = {
  restaurantName: "", location: "", cuisine: "", goal: "",
  vibeWords: [], pricePoint: "", targetCustomer: "",
  dish1: "", dish2: "", dish3: "",
  differentFrom: "", hours: "", phone: "", address: "",
  palette: "", specialRequests: "",
};

export default function BuildForm() {
  const router = useRouter();
  const [step,  setStep]  = useState(1);
  const [error, setError] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [form,  setForm]  = useState<FormData>(EMPTY_FORM);
  /** Drives /api/generate: one HTML vs three parallel variants (unlocks Triple at checkout). */
  const [previewTier, setPreviewTier] = useState<Tier>("signature");

  const upd = (k: keyof FormData, v: FormData[keyof FormData]) =>
    setForm(p => ({ ...p, [k]: v }));

  const toggleVibe = (w: string) =>
    setForm(p => ({
      ...p,
      vibeWords: p.vibeWords.includes(w)
        ? p.vibeWords.filter(x => x !== w)
        : p.vibeWords.length < 3 ? [...p.vibeWords, w] : p.vibeWords,
    }));

  const canNext = () => {
    if (step === 1) return form.restaurantName.trim() && form.location.trim() && form.cuisine.trim() && form.goal;
    if (step === 2) return form.vibeWords.length > 0 && form.pricePoint && form.targetCustomer;
    if (step === 3) return form.dish1.trim() && form.address.trim();
    return true;
  };

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const res  = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tier: previewTier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      router.push(`/preview/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed — please try again.");
      setBusy(false);
    }
  };

  // Generating spinner
  if (busy) return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "28px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      <div style={{ width: "56px", height: "56px", borderRadius: "50%", border: `2px solid ${C.border}`, borderTop: `2px solid ${C.accent}`, animation: "spin 1s linear infinite" }} />
      <div style={{ textAlign: "center" }}>
        <p className="cg" style={{ fontSize: "32px", color: C.text, fontStyle: "italic", marginBottom: "8px" }}>Crafting your page...</p>
        <p className="cp" style={{ color: C.muted, fontSize: "16px", lineHeight: 1.6 }}>
          Brand identity · copywriting · page design · SEO
          <br /><span style={{ animation: "pulse 2s ease infinite", display: "inline-block", marginTop: "4px" }}>
            {previewTier === "triple" ? "Triple preview takes about 60–90 seconds" : "This takes about 30–60 seconds"}
          </span>
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh", fontFamily: "'Crimson Pro', Georgia, serif" }}>

      {/* Sticky nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(10,9,8,0.97)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}`, padding: "0 1.5rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="hvr" onClick={() => step === 1 ? router.push("/") : setStep(s => Math.max(1, s - 1))}
          style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "15px", fontFamily: "'Crimson Pro', serif", display: "flex", alignItems: "center", gap: "6px" }}>
          ← {step === 1 ? "Back to home" : "Back"}
        </button>
        <Link href="/" className="cg hvr" style={{ fontSize: "20px", letterSpacing: "0.1em", color: C.accent, fontWeight: 600, textDecoration: "none" }}>
          PLATE STUDIO
        </Link>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ width: "32px", height: "3px", borderRadius: "2px", backgroundColor: n <= step ? C.accent : C.border, transition: "background-color 0.3s ease" }} />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "540px", margin: "0 auto", padding: "3.5rem 1.5rem 2rem" }} className="fade">

        {/* Step 1 */}
        {step === 1 && <>
          <p className="cp" style={{ color: C.muted, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>Step 1 of 4</p>
          <h2 className="cg" style={{ fontSize: "38px", fontStyle: "italic", marginBottom: "6px" }}>The basics</h2>
          <p className="cp" style={{ color: C.muted, marginBottom: "2rem", fontSize: "17px" }}>Tell us about your restaurant</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Input placeholder="Restaurant name" value={form.restaurantName} onChange={e => upd("restaurantName", e.target.value)} />
            <Input placeholder="Location (e.g. Shoreditch, Brixton, Mayfair)" value={form.location} onChange={e => upd("location", e.target.value)} />
            <Input placeholder="Cuisine type (e.g. Neapolitan pizza, Modern Japanese)" value={form.cuisine} onChange={e => upd("cuisine", e.target.value)} />
            <div>
              <p className="cp" style={{ marginBottom: "10px", color: C.muted, fontSize: "15px" }}>What do you most want visitors to do?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {GOALS.map(g => <Chip key={g} label={g} selected={form.goal === g} onClick={() => upd("goal", g)} />)}
              </div>
            </div>
          </div>
        </>}

        {/* Step 2 */}
        {step === 2 && <>
          <p className="cp" style={{ color: C.muted, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>Step 2 of 4</p>
          <h2 className="cg" style={{ fontSize: "38px", fontStyle: "italic", marginBottom: "6px" }}>Your vibe</h2>
          <p className="cp" style={{ color: C.muted, marginBottom: "2rem", fontSize: "17px" }}>Help us capture your atmosphere</p>

          <div style={{ marginBottom: "24px" }}>
            <p className="cp" style={{ marginBottom: "10px", color: C.muted, fontSize: "15px" }}>Pick up to 3 words that describe your place</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {VIBES.map(v => {
                const sel   = form.vibeWords.includes(v);
                const maxed = !sel && form.vibeWords.length >= 3;
                return <Chip key={v} label={v} selected={sel} disabled={maxed} onClick={() => !maxed && toggleVibe(v)} />;
              })}
            </div>
            {form.vibeWords.length === 3 && <p className="cp" style={{ color: C.accent, fontSize: "13px", marginTop: "8px" }}>3 selected — perfect</p>}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <p className="cp" style={{ marginBottom: "10px", color: C.muted, fontSize: "15px" }}>Price point</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {PRICE_POINTS.map(p => (
                <button key={p} type="button" className="chip" onClick={() => upd("pricePoint", p)} style={{
                  flex: 1, padding: "10px 8px", borderRadius: "4px", fontSize: "15px",
                  fontFamily: "'Crimson Pro', serif",
                  backgroundColor: form.pricePoint === p ? C.accent : C.surface,
                  color: form.pricePoint === p ? "#F4ECD8" : C.muted,
                  border: `1px solid ${form.pricePoint === p ? C.accent : C.border}`,
                  cursor: "pointer",
                }}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="cp" style={{ marginBottom: "10px", color: C.muted, fontSize: "15px" }}>Who comes in most?</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {CUSTOMERS.map(c => <Chip key={c} label={c} selected={form.targetCustomer === c} onClick={() => upd("targetCustomer", c)} />)}
            </div>
          </div>
        </>}

        {/* Step 3 */}
        {step === 3 && <>
          <p className="cp" style={{ color: C.muted, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>Step 3 of 4</p>
          <h2 className="cg" style={{ fontSize: "38px", fontStyle: "italic", marginBottom: "6px" }}>Your story</h2>
          <p className="cp" style={{ color: C.muted, marginBottom: "2rem", fontSize: "17px" }}>The details that make you, you</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <p className="cp" style={{ marginBottom: "8px", color: C.muted, fontSize: "15px" }}>Signature dishes (at least 1)</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Input placeholder="Dish 1 — e.g. Wood-fired Margherita" value={form.dish1} onChange={e => upd("dish1", e.target.value)} />
                <Input placeholder="Dish 2 (optional)" value={form.dish2} onChange={e => upd("dish2", e.target.value)} />
                <Input placeholder="Dish 3 (optional)" value={form.dish3} onChange={e => upd("dish3", e.target.value)} />
              </div>
            </div>
            <div>
              <p className="cp" style={{ marginBottom: "8px", color: C.muted, fontSize: "15px" }}>What makes you different?</p>
              <textarea className="inp cp" placeholder="e.g. wood-fired oven imported from Naples, 72-hour fermented dough, open until midnight..."
                value={form.differentFrom} onChange={e => upd("differentFrom", e.target.value)}
                style={{ width: "100%", backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "11px 14px", fontSize: "16px", fontFamily: "'Crimson Pro', serif", minHeight: "80px", resize: "vertical" }} />
            </div>
            <Input placeholder="Full address (e.g. 14 Brick Lane, London E1)" value={form.address} onChange={e => upd("address", e.target.value)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input placeholder="Opening hours" value={form.hours} onChange={e => upd("hours", e.target.value)} />
              <Input placeholder="Phone number" value={form.phone} onChange={e => upd("phone", e.target.value)} />
            </div>
          </div>
        </>}

        {/* Step 4 */}
        {step === 4 && <>
          <p className="cp" style={{ color: C.muted, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>Step 4 of 4</p>
          <h2 className="cg" style={{ fontSize: "38px", fontStyle: "italic", marginBottom: "6px" }}>Your look</h2>
          <p className="cp" style={{ color: C.muted, marginBottom: "2rem", fontSize: "17px" }}>Choose a colour direction — or let us decide</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            {PALETTES.map(p => (
              <button key={p.id} type="button" className="chip" onClick={() => upd("palette", p.id)} style={{
                padding: "14px", borderRadius: "6px", textAlign: "left",
                backgroundColor: C.surface,
                border: `1px solid ${form.palette === p.id ? C.accent : C.border}`,
                boxShadow: form.palette === p.id ? `0 0 0 1px ${C.accent}` : "none",
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
                  {p.swatches.map((s, i) => <div key={i} style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: s, border: "1px solid rgba(255,255,255,0.08)" }} />)}
                </div>
                <p className="cg" style={{ fontSize: "17px", color: form.palette === p.id ? C.accent : C.text, fontStyle: "italic", marginBottom: "2px" }}>{p.name}</p>
                <p className="cp" style={{ fontSize: "12px", color: C.muted }}>{p.hint}</p>
              </button>
            ))}
            <button type="button" className="chip" onClick={() => upd("palette", "")} style={{
              padding: "14px", borderRadius: "6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px",
              backgroundColor: C.surface,
              border: `1px solid ${form.palette === "" ? C.accent : C.border}`,
              boxShadow: form.palette === "" ? `0 0 0 1px ${C.accent}` : "none",
              cursor: "pointer",
            }}>
              <span style={{ fontSize: "22px", color: form.palette === "" ? C.accent : C.muted }}>…</span>
              <p className="cp" style={{ fontSize: "15px", color: form.palette === "" ? C.accent : C.muted }}>Choose for me</p>
            </button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <p className="cp" style={{ marginBottom: "10px", color: C.muted, fontSize: "15px" }}>Preview scope</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                className="chip"
                onClick={() => setPreviewTier("signature")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "6px",
                  textAlign: "left",
                  backgroundColor: C.surface,
                  border: `1px solid ${previewTier === "signature" ? C.accent : C.border}`,
                  cursor: "pointer",
                }}
              >
                <p className="cg" style={{ fontSize: "17px", color: previewTier === "signature" ? C.accent : C.text, fontStyle: "italic", marginBottom: "4px" }}>
                  Signature preview
                </p>
                <p className="cp" style={{ fontSize: "13px", color: C.muted }}>One design direction — fastest</p>
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setPreviewTier("triple")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "6px",
                  textAlign: "left",
                  backgroundColor: C.surface,
                  border: `1px solid ${previewTier === "triple" ? C.accent : C.border}`,
                  cursor: "pointer",
                }}
              >
                <p className="cg" style={{ fontSize: "17px", color: previewTier === "triple" ? C.accent : C.text, fontStyle: "italic", marginBottom: "4px" }}>
                  Triple preview
                </p>
                <p className="cp" style={{ fontSize: "13px", color: C.muted }}>Three distinct directions — needed to buy Triple (£999)</p>
              </button>
            </div>
          </div>

          <textarea className="inp cp"
            placeholder="Any special requests? (optional — e.g. 'no photos section', 'emphasise takeaway')"
            value={form.specialRequests} onChange={e => upd("specialRequests", e.target.value)}
            style={{ width: "100%", backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "11px 14px", fontSize: "16px", fontFamily: "'Crimson Pro', serif", minHeight: "80px", resize: "vertical" }} />
        </>}

        {/* Nav row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2.5rem", gap: "12px" }}>
          <Btn onClick={() => step > 1 ? setStep(s => s - 1) : router.push("/")}>← Back</Btn>
          {step < 4
            ? <Btn primary disabled={!canNext()} onClick={() => canNext() && setStep(s => s + 1)}>Continue →</Btn>
            : <button type="button" className="hvr cp" onClick={generate} style={{
                padding: "14px 36px", fontSize: "18px", fontWeight: 600, borderRadius: "4px",
                backgroundColor: C.accent, color: "#F4ECD8", border: "none", cursor: "pointer",
                fontFamily: "'Crimson Pro', Georgia, serif", letterSpacing: "0.03em",
              }}>Generate my page →</button>
          }
        </div>
        {error && <p className="cp" style={{ color: "#C84040", marginTop: "1rem", fontSize: "14px" }}>{error}</p>}
      </div>
    </div>
  );
}
