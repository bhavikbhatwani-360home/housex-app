# HouseX — System & Funnel Map

How the whole product connects, end to end. Read this to understand what's built, what each piece does, and how a professional team works on it.

---

## 1. THE FUNNEL — start to end

Three actors. Follow the money: **Buyer → HouseX AI → Developer → ₹.**

### 🟦 Buyer funnel (the demand side)
```
1. Land            /            → redirects to /chat
2. (Intent)        /onboarding  → quick taps capture what they want      [⚠️ not saved as lead yet]
3. Chat with HouseX AI  /chat        → real AI (Claude) answers from live DB  [✅]
4. See matches     in chat      → property cards from the database       [✅]
5. Open a home     /property/id → photos, video tour, floor×view price,
                                   units, nearby, EMI, brochure, share   [✅]
6. Book a visit    sheet → /api/visits   → Visit + Lead saved            [✅]
7. Block ₹999      sheet → /api/token    → Booking + Lead saved          [✅ demo pay]
   └─ lead is auto-routed to the developer who owns the property
```

### 🟥 Developer funnel (the supply + money side)
```
1. Discover        /pricing            → 3 plans                         [✅]
2. Sign up         /developer/signup   → creates Company + Owner login   [✅]
3. Log in          /developer/login                                     [✅]
4. Add inventory   /developer/properties/new → Property + floor units    [✅]
   └─ the moment it's published, HouseX AI recommends it to matching buyers
5. Buyers engage   → leads / visits / tokens land in THEIR CRM           [✅]
6. Work the leads  /developer/leads, /visits, /bookings, /speed-to-lead  [✅ view]
   └─ reply to the buyer / send a price offer                           [❌ NOT built]
7. Team            /developer/team → invite members, set roles           [✅]
```

### 🟪 Platform funnel (you, the operator)
```
/admin → leads · visits · bookings · properties · developers · analytics  [✅]
missing: billing/subscriptions, onboarding pipeline, RBAC console         [❌]
```

---

## 2. HOW IT CONNECTS (architecture)

```
   BROWSER (React pages, Tailwind)
        │  fetch()
        ▼
   NEXT.JS API ROUTES  (the backend)
        │
        ├──────────────► CLAUDE API (Anthropic)   = HouseX AI's brain      /api/baba
        ├──────────────► PRISMA ──► POSTGRES (Railway) = all the data
        └──(later)──────► Razorpay · WhatsApp · KYC · Maps

   GitHub ──► Vercel (build + host)   ·   Railway (database)
```

**The golden rule:** pages never touch the database directly. **Page → API route → Prisma → Postgres.** External tools (Claude, payments) are only ever called from API routes (server-side), never the browser — keys stay secret.

---

## 3. THE MAP — page ↔ API ↔ data ↔ tool

| User action | Page | API route | DB tables | External tool |
|---|---|---|---|---|
| Chat with HouseX AI | `/chat` | `/api/baba` | Property, Unit, Conversation, Message, Lead | **Claude API** |
| Open a home | `/property/[id]` | — | Property, Unit | YouTube embed |
| Book visit | `/chat` sheet | `/api/visits` | Visit, Lead | (later: WhatsApp/SMS) |
| Pay ₹999 | `/chat` sheet | `/api/token` | Booking, Lead | (later: **Razorpay**) |
| Developer signup/login | `/developer/*` | `/api/developer/*` | Developer, TeamMember | — |
| Add/edit property | `/developer/properties` | `/api/developer/properties` | Property, Unit | — |
| Team & roles | `/developer/team` | `/api/developer/team` | TeamMember | — |
| Operator console | `/admin/*` | — | all tables | — |

---

## 4. THE STACK (tools)

| Layer | Tool | Status |
|---|---|---|
| Code | GitHub | ✅ |
| Hosting / deploy | Vercel | ✅ |
| Database | PostgreSQL on Railway | ✅ |
| ORM (DB access) | Prisma | ✅ |
| AI (HouseX AI) | Claude API (Anthropic) | ✅ |
| Tours | YouTube embed | ✅ |
| Payments | Razorpay | ❌ to add |
| Messaging | WhatsApp (Gupshup/Meta) | ❌ to add |
| KYC | DigiLocker / PAN verify | ❌ to add |
| Maps | Google Maps | ❌ to add |
| Domain | houseX.ai | ⬜ at launch |

---

## 5. HOW WE WORK (professional designer + developer style)

**Design system first.** All colors/shadows/radii/fonts live in `app/globals.css` as tokens (`hx-red`, `hx-ink`…). Every screen reuses them → consistent look without re-deciding.

**The build loop (one thing at a time):**
```
Pick ONE item → build → push → Vercel preview → test on phone+laptop
→ confirm it works → tick the roadmap → next item
```
No half-features, no fake/demo screens. Data-backed or not at all.

**Conventions:**
- Pages = thin UI. Logic + data live in API routes + `lib/`.
- Reuse components; match the surrounding code's style.
- Every new data field → add to schema → form → page, in that order.
- Secrets only in env vars (Vercel), never in code or chat.

**Environments:**
- `main` branch → production (`housex-app.vercel.app`)
- (pro upgrade) feature branches → Vercel preview URLs → review before merge

**Source of truth:** `ROADMAP.md` (what to build) + this `SYSTEM.md` (how it connects).

---

## 6. WHAT TO BUILD NEXT (priority)

1. **Developer ↔ buyer messaging** — developer replies land in the buyer's chat *(closes the core loop)*
2. **Rate offers** — developer sends a ₹ offer → buyer Accept/Counter/Decline
3. **Onboarding → saves a lead** (capture intent up front)
4. **Real Razorpay** (live ₹999)
5. **WhatsApp channel** (the India channel)
6. Polish: dashboard KPIs, lead context panel, notifications
