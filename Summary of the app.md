# 🍽️ PLATE STUDIO — Cursor AI Handoff Brief

> Paste this entire file into Cursor as your first message.
> It contains everything Cursor needs to continue building the app.

---

## 1. WHAT THIS PROJECT IS

**Plate Studio** — a self-serve AI-powered landing page generator for London restaurants.

**The flow:**
```
Restaurant owner visits site
   → fills in 4-screen prompt flow (no account needed)
   → Claude API generates a real landing page
   → user sees watermarked preview
   → pays via Stripe (£499 or £999)
   → receives HTML file by email + instant download
```

**Pricing:**
- **Signature** — £499 — 1 complete landing page
- **Triple** — £999 — 3 unique design directions (parallel generation)

**Tech stack:**
- Next.js 15 (App Router) + React 19 + TypeScript
- Anthropic SDK (Claude Sonnet 4.6) — server-side only
- Supabase (Postgres) for storing generations
- Stripe for payments
- Resend for email delivery
- Hosted on Vercel (Pro plan)

---

## 2. CURRENT STATE — WHAT'S DONE

### ✅ Step 1 complete — Project scaffolded

The Next.js project is set up at `studio plate/` with this structure:

```
plate-studio/
├── app/
│   ├── page.tsx                        # Home (marketing) — DONE
│   ├── layout.tsx                      # Google Fonts setup — DONE
│   ├── globals.css                     # Global styles — DONE
│   ├── build/page.tsx                  # 4-step form wrapper — DONE
│   ├── preview/[id]/page.tsx           # STUB — needs Supabase
│   ├── success/page.tsx                # STUB — needs Stripe
│   └── api/
│       ├── generate/route.ts           # STUB — needs Claude integration
│       ├── checkout/route.ts           # STUB — needs Stripe
│       └── webhooks/stripe/route.ts    # STUB — needs Stripe webhook
├── components/
│   ├── BuildForm.tsx                   # DONE — calls /api/generate
│   ├── PreviewFrame.tsx                # DONE — iframe + watermark + buy bar
│   └── ui/
│       ├── Btn.tsx                     # DONE
│       ├── Input.tsx                   # DONE
│       └── Chip.tsx                    # DONE
├── lib/
│   ├── tokens.ts                       # DONE — colour constants
│   └── prompt.ts                       # DONE — buildPrompt + TRIPLE_VARIANTS
├── types/index.ts                      # DONE — FormData, Tier, Generation
├── package.json                        # DONE — deps installed
├── .env.local.example                  # DONE — 11 vars documented
└── tsconfig.json
```

**Confirmed working:** `npm run dev` runs cleanly. Home page renders. Form renders. The `/api/generate` route returns 501 (stub).

---

## 3. ARCHITECTURE DECISIONS — ALREADY MADE

These decisions are locked in. Don't re-litigate them.

| Decision | Choice | Why |
|----------|--------|-----|
| Triple generation | Parallel `Promise.all` inside one `/api/generate` call | User already paid; latency stays ~60s instead of 3×60s |
| Triple variants | Vary vibe direction (dark/moody, bright/airy, rustic/warm) — not just colours | Justifies £999 price |
| HTML storage | Supabase `text[]` column | ~20KB per page; trivial to migrate later |
| User accounts | None — UUID-as-secret link | Friction kills conversion |
| Vercel function timeout | `maxDuration = 60` for signature, `90` for triple | Pro plan supports this |
| Streaming | Skip for now — keep code simple | Can add later if 60s isn't enough |
| Download links | Tokenised one-time tokens | Prevents asset leakage |
| Token expiry | 30 days OR 5 downloads, whichever first | 5 allows accidental clicks |
| Email | Include simple non-technical instructions | Users are restaurant owners, not devs |

---

## 4. SUPABASE SCHEMA

Single table:

```sql
create table generations (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  form_data         jsonb not null,
  html              text[],                     -- [1] for signature, [3] for triple
  tier              text,                       -- 'signature' | 'triple' | null (preview)
  email             text,
  paid              boolean default false,
  stripe_session_id text,
  download_token    uuid,                       -- generated on payment success
  download_count    int default 0,
  token_expires_at  timestamptz                 -- created_at + 30 days from payment
);

create index idx_download_token on generations(download_token);
create index idx_stripe_session on generations(stripe_session_id);
```

---

## 5. ENVIRONMENT VARIABLES (.env.local)

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID_SIGNATURE=
STRIPE_PRICE_ID_TRIPLE=
RESEND_API_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 6. WHAT NEEDS TO BE BUILT — REMAINING STEPS

### 🔧 Step 2 — Claude API route + Supabase connection

**Files to write:**
- `lib/anthropic.ts` — server-only Anthropic client
- `lib/supabase/client.ts` — browser client (anon key)
- `lib/supabase/server.ts` — server client (service role)
- `app/api/generate/route.ts` — full implementation
- `app/preview/[id]/page.tsx` — fetch by ID, render `<PreviewFrame />`

**Behaviour:**
- POST `/api/generate` accepts `{ formData, tier }` where tier is `'signature' | 'triple'`
- For signature: 1 Claude call using `buildPrompt(formData)` from `lib/prompt.ts`
- For triple: 3 parallel Claude calls using `TRIPLE_VARIANTS` from `lib/prompt.ts`
- Insert row into `generations` with `paid: false`
- Return `{ id }` so frontend navigates to `/preview/[id]`
- **CRITICAL**: Anthropic API key must NEVER reach the client

**Use prompt caching** on the system message — the master prompt is identical across calls and cuts input cost by 90%.

### 💳 Step 3 — Stripe integration

**Files to write:**
- `lib/stripe.ts` — Stripe client
- `app/api/checkout/route.ts` — create checkout session
- `app/api/webhooks/stripe/route.ts` — handle payment success
- `app/success/page.tsx` — confirmation + direct download

**Behaviour:**
- POST `/api/checkout` accepts `{ generationId, tier, email }`
- Creates Stripe Checkout Session with the matching price ID
- Stores `generationId` in session metadata
- Webhook on `checkout.session.completed`:
  - Verifies signature
  - Sets `paid: true`, generates `download_token` (UUID), sets `token_expires_at`
  - Sends Resend email with download link

### 📧 Step 4 — Email delivery + download endpoint

**Files to write:**
- `lib/resend.ts` — Resend client
- `lib/email-templates.tsx` — purchase confirmation email
- `app/api/download/[token]/route.ts` — secure download endpoint

**Email contents (CRITICAL — restaurant owners are not developers):**
- Thank you + receipt
- Download link (token-based, one-time use)
- Direct attachment of the HTML file(s)
- **Simple instructions section:**
  - "Drag the file into Netlify Drop (free)"
  - "Forward to your web person"
  - "Reply to this email and we'll point you in the right direction"

**Download endpoint:**
- Look up token, check `paid: true`, check `token_expires_at`, check `download_count < 5`
- Increment `download_count`
- Stream the HTML file as `attachment; filename="restaurant-name.html"`

### 🚀 Step 5 — Deploy to Vercel

- Connect GitHub repo to Vercel
- Add all env vars in Vercel dashboard
- Set `NEXT_PUBLIC_BASE_URL` to production URL
- Test full flow end-to-end with a real Stripe test card (`4242 4242 4242 4242`)
- Update Stripe webhook endpoint URL to production

---

## 7. THE MASTER PROMPT — ALREADY IN `lib/prompt.ts`

The `buildPrompt(formData)` function generates the Claude prompt. It includes:
- Design rules (single HTML, Google Fonts, mobile-first, sections in order)
- Restaurant data (name, location, cuisine, vibe, dishes, etc.)
- Copy rules (British English, banned words, max headline length)
- SEO requirements (title, meta, JSON-LD Restaurant schema)
- Output rules (raw HTML only, no markdown fences)

`TRIPLE_VARIANTS` is an array of 3 prompt modifiers — different colour direction, font family AND mood instruction per variant. Don't simplify these to just colour swaps.

---

## 8. HOW TO BEHAVE WHEN BUILDING

- **Show me each diff before applying** — I'll review and approve
- **One step at a time** — finish step 2 fully before starting step 3
- **Test as you go** — after each step, tell me how to verify it works
- **Don't over-engineer** — no auth, no admin dashboard, no analytics yet. MVP first.
- **British English in all UI copy** — flavour, colour, centre
- **Never expose the Anthropic API key client-side** — server routes only
- **No purple gradients, no Inter font, no Tailwind** — the design system is already set in `lib/tokens.ts` and `globals.css`

---

## 9. STARTING PROMPT FOR CURSOR

Once you've pasted this whole brief, send this as your follow-up:

> Read all the project files first to understand the current state. Then start with **Step 2: the Claude API route + Supabase connection**.
>
> Before writing any code, show me:
> 1. The exact files you'll create or modify
> 2. The Supabase SQL I need to run in the dashboard
> 3. Any new dependencies you need to install
>
> I'll review and approve before you start coding.

---

## 10. LEGAL HOUSEKEEPING (NOT URGENT, BUT BEFORE LAUNCH)

Before taking real money:
- [ ] Terms of service page
- [ ] Privacy policy
- [ ] Refund policy (suggest: 7-day refund if unhappy with all generated variations)
- [ ] Stripe must be in live mode, not test mode
- [ ] Cookie banner if using analytics

---

**End of handoff brief.**
*Built across multiple Claude sessions · May 2026*