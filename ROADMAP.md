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

## Phase 0 — Foundation & access ✅
All four are set in Vercel and confirmed live:
- ✅ `ANTHROPIC_API_KEY` — Baba's brain
- ✅ `BABA_MODEL` = `claude-haiku-4-5`
- ✅ `DATABASE_URL` — Railway Postgres (public URL), 8 properties seeded
- ✅ `ADMIN_PASSWORD` — operator console login works

**Confirmed:** `/admin` login works · `/admin/properties` shows 8 properties · DB persistent.

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

## Phase 3 — Developer SaaS (multi-tenant) ✅ (core)
- ✅ Developer signup / login (`/developer`)
- ✅ Each developer sees only THEIR leads / properties / visits
- ✅ Lead routing — a visit on a developer's property routes the lead to them
- ✅ Developer dashboard (scoped stats)
- ⬜ Lead detail + reply (developer contacts the buyer)
- ⬜ Edit / unpublish properties

## Phase 4 — Money 🔧
- ✅ ₹999 token booking (block a unit) — flow + Booking record + console visibility
- ✅ Quick KYC capture (name / phone / PAN)
- 🔧 Payment — demo now; **real Razorpay = drop-in once keys are added** (next sub-step)
- ⬜ Aadhaar / PAN verification (real KYC)
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
1. ✅ **Phase 0** — env vars set, DB live, 8 properties seeded
2. 🔧 Confirm the full loop: chat → cards → book visit → see it in `/admin`
3. ⬜ **Phase 3 — Developer login** (turn it into real SaaS)
