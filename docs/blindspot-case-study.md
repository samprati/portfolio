# The Blind Spot — Interactive Case Study
### Working document (copy + interaction spec). No code until this is approved.

**Concept name:** *Think Alongside Me*
**Premise:** The reader doesn't watch me be clever in hindsight. They're dropped into the remote owner's chair, handed the exact decisions I faced, allowed to *play* them, shown the versions I threw away, told the honest case *against* my own choices, and finally allowed to *operate* the system I built.

**Why this is different from every other case study:** the genre is a retrospective narrated scroll where every decision looks inevitable. This one changes the *format* (you operate it) and the *vantage* (you're the owner and my critique partner, not an audience). It turns my two real edges — systems/unit-economics thinking and an already-interactive portfolio — into the whole argument.

---

## The honesty spine (kept, and strengthened)
This is what stops it becoming "the same as everyone who fakes polish":
- **Concept, not shipped product** — grounded in secondary desk research + market analysis of Indian PropTech.
- Three layers stay visibly separate everywhere: **my design reasoning** (mine), **market facts** (cited as secondary), **assumptions** (flagged + how I'd test each).
- **The decision-engine numbers are labeled illustrative** — "my assumptions, drag to see the *logic*, not audited figures." Playable ≠ fabricated.
- **A/B versions** are chosen on *stated design criteria*, never "users preferred B" — because I didn't run that test.
- **"How I worked with people"** is solved without inventing stakeholders: in Beat 5 *the reader* becomes my critique partner, live. The collaboration is real, not claimed.

---

## The service model (no IoT — system chooses the gap-filler by unit state)
| Unit state | Gap-filler | Rationale |
|---|---|---|
| Any unit | **Tiered cadence** (base subscription) — owner tunes frequency vs cost | Honest pricing for chosen coverage |
| **Vacant** (core anxiety case) | **On-demand paid visit** — one tap | No occupant to signal; a triggerable visit is the only honest cover, and it's revenue-positive |
| **Tenanted** | **Tenant check-in** — 2-tap photo/status | Free signal from someone already there; scheduled, consented, privacy-scoped |

The owner is never shown three toggles — the system surfaces the one that fits the unit. **Restraint is the design.**

---

# THE BEATS (copy + interaction)

## Beat 1 — You are the owner  *(vantage: reader-is-the-owner)*
*No hero image, no title card. Second person, cold open.*

> **Your flat. Pune. You live 6,000 km away.**
> The last update you have is a WhatsApp message: *"all ok 👍"* — 87 days ago.
> Right now, is there a leak behind the wall? Has the society raised the dues? Is anyone even living there?
>
> **You have no idea. And that's not a payment problem.**

**Interaction:** the "87 days ago" counter ticks up as you sit there; a faint blurred photo you *can't* quite make out. The reader feels the blind spot before I name it.
**Honesty note:** none needed — this is framing, not a claim.

---

## Beat 2 — What everyone sells you instead  *(vantage: argue-against-the-field)*
Reframe delivered by *discovery*, not by me asserting it.

> So you look for help. Here's what the market hands you:
> - **A rent-collection app** → solves a problem you didn't have.
> - **A marketplace to re-let** → assumes the flat is the asset. The *trust* is the asset.
> - **A payment gateway** → a better funnel for a wound that isn't financial.
>
> Every one of them is built on the same unexamined assumption: **the job is the transaction.** For a remote owner, the transaction is the easy part. **The job is verifying the health of something you can't see.**

**Interaction:** three real-category cards (labeled by *type*, not defamatory brand claims); each flips to reveal "what it actually answers vs. what you asked."
**Honesty note:** categories described from desk research; framed as market patterns, not audited brand critiques.

---

## Beat 3 — The decision engine  *(vantage: playable — the centerpiece)*
The reader makes the call I made, with their own hands.

> I nearly designed the obvious thing: **send someone every couple of days.** Maximum reassurance. Try it:

**Interaction:**
- **Frequency slider:** Every 2 days → Weekly → Fortnightly → Monthly → Quarterly.
- Live readout: *Agent cost / month*, *Subscription price*, *Margin* — bar goes **red → green**.
- **Unit-state toggle:** Vacant / Tenanted → shows which gap-filler the system surfaces.

*Illustrative figures (replace with real desk-research numbers):*
- Agent cost per visit: **₹450**
- Alternate-day (~15/mo): cost **₹6,750** vs. a believable subscription **₹1,499** → **margin −350% 🔴**
- Monthly (1/mo): cost **₹450** vs **₹1,499** → **margin +70% 🟢**, plus on-demand extras at **₹499** each.

> You just watched my favorite idea die. **So did I.** A service that can't afford to keep its promise isn't kind — it's a countdown. The pivot wasn't a feature; it was accepting the math.

**Honesty note:** hard label on the widget — *"Illustrative model — my assumptions. Drag it to see the reasoning, not audited figures."*

---

## Beat 4 — The restraint decision  *(vantage: self-critique #1 — NEW, your systems edge)*
> With the economics fixed, the temptation was to pile on every safety net — sensors, check-ins, on-demand, scheduled — and call it "powerful." That's not power. That's decision fatigue and cost.
>
> So I bound each safety net to **unit state**, and let the system choose:
> - Vacant flat → **on-demand visit** (there's no one to ask).
> - Tenanted flat → **tenant check-in** (someone's already there).
> - Both → the **scheduled cadence** you set.
>
> The owner sees **one** clear action, never a menu. **Restraint was the design.**

**Interaction:** the same status card shown twice — vacant vs. tenanted — surfacing a *different* single primary action. Same component, different truth.
**Honesty note:** pure design reasoning (mine).

---

## Beat 5 — Wireframe → the fork  *(vantage: playable + process)*
Show the thinking, then the real design moment.

> Here's the low-fi I started with, and the question that actually mattered: **how do you show an anxious owner that their asset is fine?** I built two hi-fi directions and had to choose.

**Interaction:** an **A / B toggle** on the owner dashboard:
- **Version A — image-first chronological timeline** (photos as proof, timeline as a heartbeat).
- **Version B — dense data grid** (complete, precise, scannable).

> My criteria weren't "which is prettier" — they were **reassurance, cognitive load, and glanceability for a stressed non-expert.** On those, A wins for the individual owner.

**Honesty note:** the choice is made on *stated criteria*, explicitly not on user testing I didn't run.

---

## Beat 6 — The honest case against my own choice  *(vantage: argue-against-myself #2)*
Immediately turn on the winner.

> Now let me argue against myself. **Version B, the grid I rejected, is genuinely better** — for a landlord holding 50 units who needs triage, not comfort. Rejecting it outright would've been a mistake.
>
> So I didn't kill it. **I moved it to the B2B view.** Same data model, different surface, chosen by *who's looking*. Watch me defend that seam →

**Interaction:** a **B2C ↔ B2B** switch: the same underlying data renders as the reassuring timeline (owner) or the R/A/G triage grid (institutional). The rejected version earns its place.
**Honesty note:** design reasoning; the "50-unit" persona is a described scenario, not a real client.

---

## Beat 7 — Operate the system  *(vantage: the doc IS the system)*
The design system, proven by use.

> A product this multi-sided is a **design-system** achievement, not a styling one. One "Property Status Card," three roles. Flip between them:

**Interaction:** a **role switch** on one live component:
- **Owner** → yield ₹18,400 · 🟢 healthy · next inspection in 6 days
- **Tenant** → repair: in progress · *(no financials — ever)*
- **Agent** → inspect due · photos 0/6 · offline-cache indicator

> The logic lives in the component, not in three forked front-ends. That's how three surfaces stay consistent by structure, not by discipline. B2C surfaces target **WCAG 2.2** — some absentee owners are elderly and acting under stress.

**Honesty note:** real design work / system reasoning.

---

## Beat 8 — Beyond the happy path + Validation & Reflection  *(existing strong material, tightened)*
- **Offline agent:** basements and unoccupied towers → capture caches and syncs, never depends on signal.
- **Disputed repair:** the geotagged photo trail is the neutral record; the product takes no side.
- **Tenant privacy:** inspections of occupied homes are scheduled, consented, scoped — condition, not surveillance.
- **Three hypotheses that carry the architecture:**
  1. **Unit economics** — can an agent complete a standard inspection in **≤ ~15 min** (the profitability threshold)?
  2. **Visual reassurance** — do owners report a measurable anxiety drop from the image feed vs. an emailed PDF?
  3. **B2B scalability** — can the dashboard surface one neglected unit inside a 50+ portfolio without overwhelm?

> The most useful thing I did was refuse the obvious solution and be willing to kill my own favorite idea when the economics didn't hold. The honest limit is equally clear: without primary research this is a well-reasoned hypothesis, not a validated product. Knowing which is which is the job.
>
> *I built this to be scrutinised. Ask me why I rejected an option, or push on a trade-off I accepted — those are the conversations this is designed to start.*

---

# Assets we'll need to build (turns the 3 empty figure placeholders into real, interactive proof)
1. **Decision engine** — frequency slider + unit-state toggle + live cost/margin (Beat 3).
2. **Status card component** — role switch (owner/tenant/agent) + state variants (Beats 4, 7).
3. **A/B dashboard toggle** — timeline vs grid (Beat 5).
4. **B2C ↔ B2B switch** — same data, two surfaces (Beat 6).
5. **Light wireframe sketches** — the low-fi before the fork (Beat 5).
6. **Competitor-category cards** — three flippable cards (Beat 2).

---

# Open items for Samprati
1. **Real numbers** to replace the illustrative model (Beat 3): agent cost per visit, subscription tier prices, on-demand price. (Placeholders are in and clearly labeled until you provide these.)
2. **Anything in the beat order** you'd reorder.
3. Confirm the honesty labels read the way you want them to.
