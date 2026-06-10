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
- ✅ Buyer property detail page (`/property/[id]`) — real data, EMI, units, RERA
- ✅ Site-visit booking (saves to console)
- ✅ ₹999 token booking
- ⬜ Onboarding → pre-fills a lead before chat
- ⬜ Brochure / floor-plan delivery

## Design-coverage — built for real
- ✅ buyer-property → `/property/[id]`
- ✅ pricing → `/pricing`
- ✅ dev-lead-detail → `/developer/leads/[id]`
- ✅ admin-developer (tenant 360) → `/admin/developers/[id]`
- ✅ admin-analytics → `/admin/analytics`
- ✅ dev-speed-to-lead → `/developer/speed-to-lead`

## Design-coverage — remaining (build as REAL features, not demo screens)
- ⬜ dev-offers — developer sends a price offer to a lead (needs Offer model)
- ⬜ dev-offer-rules — auto-offer guardrails
- ⬜ dev-automations — proactive Baba re-engagement
- ⬜ admin-billing — plans/subscriptions (needs plan + billing)
- ⬜ admin-bdm — sales pipeline to sign developers
- ⬜ admin-onboarding — developer/RERA onboarding pipeline
- ⬜ admin-roles — RBAC

## Phase 3 — Developer SaaS (multi-tenant) ✅
- ✅ Developer signup / login (`/developer`)
- ✅ Each developer sees only THEIR leads / properties / visits / bookings
- ✅ Lead routing — interest in a developer's property routes the lead to them
- ✅ Developer dashboard + speed-to-lead
- ✅ Lead detail with **two-way buyer messaging** (replies land in Baba chat)
- ✅ **Rate offers** — send ₹ offer → buyer Accept/Counter/Decline in chat
- ✅ Add / edit / delete properties
- ✅ Team members + roles (owner / manager / agent)
- ⬜ Developer Offers list page (offers work; no dedicated list yet)

## Phase 4 — Money 🔧 (paused until launch)
- ✅ **Rate offers** (free negotiation — the launch money-path)
- ⏸️ ₹999 token — built, **removed from buyer flow for now** (re-enable post-launch)
- ⬜ Real Razorpay (wire keys later)
- ⬜ Real KYC (DigiLocker / PAN)
- ⬜ Developer subscription / billing

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

## Right now → path to launch
**Built & working:** the full loop — Buyer → Baba → property page → book visit → lead →
developer replies + sends rate offers → buyer accepts/counters/declines.

**Pending for a real pilot launch (in order):**
1. ⬜ **Polish + full QA pass** (every screen, every flow, on a real phone)
2. ⬜ **Notifications** — WhatsApp/email so buyers see replies & offers when not in the app
3. ⬜ **Onboarding → save a lead** (capture intent before chat)
4. ⬜ **Legal** — terms, privacy, DPDP consent
5. ⬜ **Point houseX.ai** at the app
6. ⬜ **Onboard 1–2 pilot developers**

**Later (post-launch):** Razorpay + ₹999 token · real KYC · proactive Baba · compare/shortlist ·
admin billing/BDM/onboarding/roles screens · buyer accounts.
