# HouseX — Product Roadmap

> Single source of truth. We build **phase by phase**, preview each change, confirm it works, then move on.

---

## Vision
A chat-first, AI-powered real-estate platform for India. Buyers talk to **Baba** (AI) to find RERA-verified homes; developers get qualified leads. Revenue: developers pay for leads / subscription; buyers are free.

**The core loop:** Buyer → Baba → real listings → book visit / pay token → captured lead → developer.

---

## How we work (the loop) — IMPORTANT
1. **Pick ONE item** from the current phase.
2. **Build it** (code → push to GitHub).
3. **Preview it** — Vercel auto-deploys; review on the live URL on phone + laptop.
4. **Confirm** it works (test the actual flow).
5. **Tick it off** here, then take the next item.

No jumping ahead. One thing at a time, verified, shipped.

**Status:** ✅ done · 🔧 in progress · ⬜ not started · ⚠️ needs your action

---

## Phase 0 — Foundation & access (DO THIS FIRST)
The app can't be fully previewed until these 4 env vars are set in **Vercel → Settings → Environment Variables**, then **Redeploy**:

- ⚠️ `ANTHROPIC_API_KEY` — Baba's brain (from console.anthropic.com)
- ⚠️ `BABA_MODEL` = `claude-haiku-4-5` — keeps cost tiny
- ⚠️ `DATABASE_URL` — Railway Postgres (makes Baba see all inventory + saves leads/visits)
- ⚠️ `ADMIN_PASSWORD` — your operator console login

**Until `DATABASE_URL` is set, Baba only sees 3 fallback listings** (this is why "1 BHK in Vasai" failed). This phase unblocks everything.

---

## Phase 1 — Operator console (for you) ✅
- ✅ Password-gated `/admin`
- ✅ Leads list + full saved conversation
- ✅ Site-visits list
- ✅ Properties list + **Add property** form (feeds Baba's inventory)

## Phase 2 — Buyer experience ✅ (core)
- ✅ Clean AI chat (ChatGPT/Claude/Gemini style)
- ✅ Real Baba (Claude) grounded in live DB inventory
- ✅ Property cards inside chat
- ✅ Site-visit booking (saves to console)
- ⬜ Onboarding → pre-fills a lead before chat
- ⬜ Brochure / floor-plan delivery

## Phase 3 — Developer SaaS (multi-tenant) ⬜
- ⬜ Developer signup / login
- ⬜ Each developer sees only THEIR leads / properties / visits
- ⬜ Lead routing (Greenvalley lead → Square Homes)
- ⬜ Developer dashboard (KPIs)

## Phase 4 — Money ⬜
- ⬜ ₹999 token booking (block a unit)
- ⬜ KYC (PAN / Aadhaar)
- ⬜ Payment (Razorpay / UPI)
- ⬜ Developer subscription / billing

## Phase 5 — Growth & smoothness ⬜
- ⬜ WhatsApp channel (Baba on WhatsApp)
- ⬜ Notifications (buyer + developer)
- ⬜ Proactive Baba (price drop / new match alerts)
- ⬜ Saved homes / compare

## Phase 6 — Launch ⬜
- ⬜ Polish pass (design QA on every screen)
- ⬜ Point **houseX.ai** at the app
- ⬜ Legal: RERA display, DPDP consent, terms/privacy
- ⬜ Onboard first 2–3 pilot developers

---

## Right now → next 3 steps
1. ⚠️ **Phase 0** — set the 4 env vars in Vercel + redeploy (unblocks live preview)
2. ✅ Confirm the loop works: chat → cards → book visit → see it in `/admin`
3. ⬜ Then **Phase 3 — Developer login** (turn it into real SaaS)
