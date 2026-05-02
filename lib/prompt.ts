import type { FormData } from "@/types";

export const VIBES = ["Rustic","Cosy","Lively","Romantic","Minimal","Bold","Classic","Modern","Intimate","Playful"];
export const GOALS = ["Book a table","Order online","Find us","Call us"];
export const PRICE_POINTS = ["Affordable","Mid-range","Special occasion"];
export const CUSTOMERS = ["Date nights","Friend groups","Families","Lunch crowd","Mixed crowd"];

export const PALETTES = [
  { id: "dark",    name: "Dark & Moody",   hint: "Deep blacks, warm golds",  swatches: ["#0F0E0A","#C1271B","#F2EDE0"] },
  { id: "bright",  name: "Bright & Fresh", hint: "Whites, greens, naturals", swatches: ["#F8FAF5","#2D6A4F","#FF6B35"] },
  { id: "rustic",  name: "Rustic Warm",    hint: "Terracotta, cream, amber", swatches: ["#FAF3E8","#8B4513","#E8A030"] },
  { id: "minimal", name: "Minimal Clean",  hint: "White, black, one accent", swatches: ["#FFFFFF","#1A1A1A","#C8A96E"] },
] as const;

// Distinct vibe overrides injected per variant for Triple-tier generation.
// Each variant gets a fully different visual direction, not just swapped colours.
export const TRIPLE_VARIANTS = [
  {
    label: "Dark & Moody",
    colourDirection: "Dark & Moody — deep blacks, charcoal backgrounds, warm amber and ember-red accents, candlelight atmosphere",
    fontDirection: "Dramatic serif headings (Cormorant Garamond), refined body text, wide letter-spacing on labels",
    moodDirection: "brooding, intimate, theatre-like — shadows and warmth",
  },
  {
    label: "Bright & Airy",
    colourDirection: "Bright & Airy — off-white or pale sage background, forest green and terracotta accents, clean open space",
    fontDirection: "Light geometric sans headings (DM Sans or Plus Jakarta Sans), generous line height, airy spacing",
    moodDirection: "daytime energy, fresh produce, neighbourhood café feel",
  },
  {
    label: "Rustic & Warm",
    colourDirection: "Rustic Warm — warm cream or parchment background, deep brown and amber, aged brass accents",
    fontDirection: "Warm slab-serif or humanist serif headings (Playfair Display), readable body, vintage editorial feel",
    moodDirection: "hearth, craftsmanship, grandmother's kitchen brought up to date",
  },
] as const;

/** Cached on every Claude request — identical across Signature and Triple calls (cost savings). */
export const CACHED_SYSTEM_PROMPT = `You are an expert restaurant web designer and copywriter. Build a stunning, production-ready HTML landing page.

DESIGN RULES:
- Single HTML file, all CSS and JS inline — no external files
- Import Google Fonts in <head> using the typography direction in the user message
- Use CSS custom properties (variables) for all colours
- Mobile-first, fully responsive
- Sections in order: sticky nav, hero with CTA, 3 benefits/features, menu highlight (3 dishes), find us section (hours + address), final CTA, footer
- CSS-generated atmospheric visuals — gradients, patterns, glows — no <img> tags needed
- Smooth scroll reveal via IntersectionObserver
- Hover animations on all interactive elements
- CTA button appears in hero AND final section

COPY RULES:
- Write ALL copy freshly — headlines, subheadlines, benefits, dish descriptions, CTAs
- Hero headline: punchy, emotional, max 8 words, NEVER start with the restaurant name
- Dish descriptions: one irresistible sentence each, rich sensory language
- CTA copy: warm invitation, never pushy
- British English throughout (flavour, colour, centre)
- NEVER use: delicious, amazing, mouth-watering, stunning, passionate, bespoke

SEO:
- <title> max 60 chars: [cuisine] + [location]
- <meta name="description"> max 155 chars with soft CTA
- Restaurant JSON-LD schema in <head>: name, servesCuisine, priceRange, address, telephone, openingHours
- One H1 only (hero). Sections use H2. Sub-items use H3.

OUTPUT RULES:
Return ONLY the complete HTML. Start with <!DOCTYPE html> and end with </html>.
Zero other text before or after. No markdown fences. Just raw HTML.`;

/** User message paired with CACHED_SYSTEM_PROMPT (restaurant data + per-variant visual direction). */
export function buildUserPrompt(f: FormData, variantOverride?: typeof TRIPLE_VARIANTS[number]): string {
  const paletteEntry = PALETTES.find(p => p.id === f.palette);

  const colourDirection = variantOverride
    ? variantOverride.colourDirection
    : paletteEntry
      ? `${paletteEntry.name} — ${paletteEntry.hint}`
      : "Choose a colour palette that perfectly matches the vibe — be bold and specific";

  const fontDirection = variantOverride
    ? variantOverride.fontDirection
    : "Choose fonts that match the vibe perfectly";

  const moodLine = variantOverride
    ? `Overall mood: ${variantOverride.moodDirection}`
    : "";

  return `VISUAL & TYPOGRAPHY DIRECTION:
- Colour direction: ${colourDirection}
- Typography for <head> (Google Fonts): ${fontDirection}
${moodLine ? `- ${moodLine}` : ""}

RESTAURANT DATA:
Name: ${f.restaurantName}
Location: ${f.location}, London
Cuisine: ${f.cuisine}
Goal: ${f.goal}
Vibe words: ${f.vibeWords.join(", ")}
Price point: ${f.pricePoint}
Target customers: ${f.targetCustomer}
Signature dishes: ${[f.dish1, f.dish2, f.dish3].filter(Boolean).join(", ")}
What makes them different: ${f.differentFrom || "quality and authenticity"}
Opening hours: ${f.hours || "Mon–Sun, 12pm–11pm"}
Phone: ${f.phone || "Book by phone"}
Address: ${f.address}
Special requests: ${f.specialRequests || "None"}`;
}

/** Single-string prompt for debugging; production uses CACHED_SYSTEM_PROMPT + buildUserPrompt. */
export function buildPrompt(f: FormData, variantOverride?: typeof TRIPLE_VARIANTS[number]): string {
  return `${CACHED_SYSTEM_PROMPT}\n\n---\n\n${buildUserPrompt(f, variantOverride)}`;
}

export function extractHTML(raw: string): string {
  const start = raw.indexOf("<!DOCTYPE html>");
  const end   = raw.lastIndexOf("</html>") + 7;
  return start !== -1 ? raw.slice(start, end) : raw;
}
