import Link from "next/link";
import { C } from "@/lib/tokens";

export default function HomePage() {
  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh", fontFamily: "'Crimson Pro', Georgia, serif", color: C.text }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(10,9,8,0.97)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}`, padding: "0 2rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" className="cg hvr" style={{ fontSize: "22px", letterSpacing: "0.12em", color: C.accent, fontWeight: 600, textDecoration: "none" }}>
          PLATE STUDIO
        </Link>
        <Link href="/build" style={{ padding: "12px 24px", backgroundColor: C.accent, color: "#F4ECD8", borderRadius: "4px", fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 600, fontSize: "16px", letterSpacing: "0.03em", textDecoration: "none" }}>
          Try it free →
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "7rem 2rem 6rem", maxWidth: "860px", margin: "0 auto" }} className="fade">
        <p className="cp" style={{ color: C.accent, fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
          London Restaurant Landing Pages
        </p>
        <h1 className="cg" style={{ fontSize: "clamp(44px,8vw,88px)", lineHeight: 1.05, marginBottom: "1.5rem", fontStyle: "italic", fontWeight: 600, letterSpacing: "-0.01em" }}>
          See your restaurant<br />transformed in 2 minutes
        </h1>
        <p className="cp" style={{ fontSize: "20px", color: C.muted, maxWidth: "500px", margin: "0 auto 2.5rem", lineHeight: 1.65 }}>
          Answer a few questions about your restaurant. Get a beautiful, SEO-ready page — built by AI, designed to convert.
        </p>
        <Link href="/build" style={{ display: "inline-block", padding: "18px 42px", fontSize: "19px", fontWeight: 600, borderRadius: "4px", backgroundColor: C.accent, color: "#F4ECD8", textDecoration: "none", fontFamily: "'Crimson Pro', Georgia, serif", letterSpacing: "0.02em" }}>
          Build my page — free preview
        </Link>
        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", marginTop: "1.25rem", flexWrap: "wrap" }}>
          {["No account needed", "Preview before you pay", "Delivered in minutes"].map(t => (
            <p key={t} className="cp" style={{ color: C.mutedMid, fontSize: "14px", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ color: C.accent, fontSize: "12px" }}>✓</span>{t}
            </p>
          ))}
        </div>
      </section>

      <div style={{ height: "1px", backgroundColor: C.border, margin: "0 2rem" }} />

      {/* How it works */}
      <section style={{ padding: "5rem 2rem", backgroundColor: C.surface }}>
        <div style={{ maxWidth: "920px", margin: "0 auto" }}>
          <p className="cp" style={{ textAlign: "center", color: C.muted, fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3.5rem" }}>How it works</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "3rem" }}>
            {[
              { n: "01", t: "Answer 4 screens", d: "Your restaurant name, vibe, dishes, and style. No tech knowledge needed. Takes under 3 minutes." },
              { n: "02", t: "AI builds your page", d: "Brand identity, all copy, a responsive HTML page, and local SEO — generated in one pass." },
              { n: "03", t: "Preview before paying", d: "See your real page before spending a penny. Love it, buy it. Don't love it, walk away." },
            ].map(s => (
              <div key={s.n}>
                <p className="cg" style={{ fontSize: "48px", color: C.border, fontWeight: 700, marginBottom: "10px", lineHeight: 1 }}>{s.n}</p>
                <h3 className="cg" style={{ fontSize: "26px", marginBottom: "10px", fontStyle: "italic" }}>{s.t}</h3>
                <p className="cp" style={{ color: C.muted, lineHeight: 1.65, fontSize: "16px" }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section style={{ padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "920px", margin: "0 auto" }}>
          <p className="cp" style={{ textAlign: "center", color: C.muted, fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3.5rem" }}>Everything included</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1.25rem" }}>
            {[
              { icon: "✦", t: "Brand identity",       d: "Colours, typography, and personality matched to your cuisine and vibe" },
              { icon: "…", t: "Professional copywriting", d: "Every word written from scratch — headlines, dish descriptions, CTAs" },
              { icon: "⬡", t: "Full HTML page",        d: "One file. Upload to any host or domain in minutes" },
              { icon: "◎", t: "Local SEO built in",    d: "Google schema, meta tags, and local keywords — no extra setup" },
            ].map(f => (
              <div key={f.t} style={{ padding: "1.5rem", backgroundColor: C.surface, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: "22px", color: C.accent, marginBottom: "12px" }}>{f.icon}</p>
                <h3 className="cg" style={{ fontSize: "21px", marginBottom: "8px", fontStyle: "italic" }}>{f.t}</h3>
                <p className="cp" style={{ color: C.muted, fontSize: "15px", lineHeight: 1.6 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo callout */}
      <section style={{ margin: "0 2rem", borderRadius: "8px", backgroundColor: C.surface2, border: `1px solid ${C.border}`, padding: "3rem 2.5rem", maxWidth: "920px", marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ maxWidth: "480px" }}>
            <p className="cp" style={{ color: C.accent, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>Example output</p>
            <h3 className="cg" style={{ fontSize: "32px", fontStyle: "italic", marginBottom: "12px" }}>Forno Nero, Shoreditch</h3>
            <p className="cp" style={{ color: C.muted, lineHeight: 1.65, fontSize: "16px", marginBottom: "16px" }}>
              Neapolitan pizza restaurant. Dark fire aesthetic, Cormorant Garamond typography,
              animated fire glow, dish copy that earned the headline{" "}
              <em style={{ color: C.text }}>"Where the oven never lies."</em>
              {" "}— generated in a single pass from a brief like yours.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["Brand identity", "Page copy", "SEO layer", "Fully responsive"].map(t => (
                <span key={t} className="cp" style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "13px", backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "200px" }}>
            {[
              { label: "Colour palette", content: <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>{["#0F0E0A","#C1271B","#F2EDE0","#E8A030"].map(c => <div key={c} style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: c, border: "1px solid rgba(255,255,255,0.1)" }} />)}<p className="cp" style={{ fontSize: "12px", color: C.muted, marginLeft: "4px" }}>Ember Red / Naples Night</p></div> },
              { label: "Typography",     content: <p className="cg" style={{ fontSize: "16px", fontStyle: "italic" }}>Cormorant Garamond</p> },
              { label: "Hero headline",  content: <p className="cg" style={{ fontSize: "16px", fontStyle: "italic", color: C.text }}>"Where the oven never lies."</p> },
            ].map(row => (
              <div key={row.label} style={{ padding: "14px 18px", backgroundColor: C.surface, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                <p className="cp" style={{ color: C.muted, fontSize: "12px", marginBottom: "4px" }}>{row.label}</p>
                {row.content}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "5rem 2rem", backgroundColor: C.surface, marginTop: "5rem" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <p className="cp" style={{ textAlign: "center", color: C.muted, fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3.5rem" }}>Pricing</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            {[
              { name: "Signature", price: "£499", desc: "One complete, polished landing page.", items: ["Brand identity + typography", "All copywriting from scratch", "Fully responsive HTML file", "Local SEO built in", "Download instantly on purchase"], featured: false },
              { name: "Triple",    price: "£999", desc: "Three distinct design directions. You choose the one you love.", items: ["Everything in Signature", "3 unique design variations", "Different vibes — same restaurant", "Pick your favourite", "All 3 files included"], featured: true },
            ].map(p => (
              <div key={p.name} style={{ padding: "2rem", borderRadius: "8px", backgroundColor: p.featured ? "#171210" : C.bg, border: `1px solid ${p.featured ? C.accent : C.border}`, position: "relative" }}>
                {p.featured && <span className="cp" style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: C.accent, color: "#F4ECD8", fontSize: "11px", letterSpacing: "0.1em", padding: "4px 14px", borderRadius: "20px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Best value</span>}
                <h3 className="cg" style={{ fontSize: "34px", fontStyle: "italic", marginBottom: "4px" }}>{p.name}</h3>
                <p className="cp" style={{ color: C.muted, fontSize: "15px", marginBottom: "16px" }}>{p.desc}</p>
                <p className="cg" style={{ fontSize: "48px", fontWeight: 600, color: p.featured ? C.accent : C.text, marginBottom: "1.5rem", lineHeight: 1 }}>{p.price}</p>
                <ul style={{ listStyle: "none", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "9px" }}>
                  {p.items.map(i => (
                    <li key={i} className="cp" style={{ color: C.muted, fontSize: "15px", display: "flex", gap: "8px", alignItems: "flex-start", lineHeight: 1.4 }}>
                      <span style={{ color: C.accent, marginTop: "1px", flexShrink: 0 }}>✓</span>{i}
                    </li>
                  ))}
                </ul>
                <Link href="/build" style={{ display: "block", width: "100%", padding: "13px", fontSize: "16px", fontWeight: 600, borderRadius: "4px", textAlign: "center", backgroundColor: p.featured ? C.accent : "transparent", color: p.featured ? "#F4ECD8" : C.text, border: p.featured ? "none" : `1px solid ${C.border}`, textDecoration: "none", fontFamily: "'Crimson Pro', Georgia, serif" }}>
                  Preview free →
                </Link>
              </div>
            ))}
          </div>
          <p className="cp" style={{ textAlign: "center", color: C.mutedMid, fontSize: "14px" }}>
            London agencies charge £3,000–8,000 for the same work. You preview for free before spending anything.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "1.5rem 2rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <span className="cg" style={{ color: C.accent, letterSpacing: "0.1em", fontSize: "17px", fontWeight: 600 }}>PLATE STUDIO</span>
        <p className="cp" style={{ color: C.mutedMid, fontSize: "14px" }}>Beautiful landing pages for London restaurants · Built by AI, designed to convert</p>
      </footer>

    </div>
  );
}
