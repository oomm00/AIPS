# AIPS — Adaptive Income Protection System

> Built for Zepto and Blinkit delivery partners | Guidewire DEVTrails 2026

---

## What we are building and why

So here is the problem we kept coming back to. Delivery workers in India lose a chunk of their monthly income every time it rains hard, or a heatwave hits, or the government shuts down the internet in their district. None of that is their fault. And none of it is covered by any insurance product that exists right now.

The platform insurance from Zomato or Blinkit? It pays out after accidents. After hospitalizations. It is genuinely useful for those situations but it completely ignores the most common income loss event these workers face — losing ₹700 because their zone flooded for five hours during a storm. There is no hospital visit for that. No police report. The money is just gone and there is nothing they can do about it.

That is what AIPS is trying to solve.

Parametric insurance means the payout is based on an external measurable index — rainfall crossing a certain level, AQI crossing a certain level — rather than on the worker filing a loss claim. The worker does not report anything. The system watches the data feeds, detects when something bad happened, checks that the worker was actually there and working, and sends money to their UPI. That whole process takes under 2 hours. No forms. No call center. No waiting.

---

## The two ideas that actually make this different

We want to be upfront about this because most weather insurance for gig workers is honestly not that differentiated. The two things that we think are genuinely new here are the incentive delta and the score recovery supplement. Both came from reading the actual research on how Q-commerce workers earn. Neither exists in any product we could find.

**The incentive cliff.** A Zepto worker needs to hit 20 orders in a day to unlock a ₹150 bonus. If a storm forces them to stop at 19, they do not lose one order's worth of pay. They lose the entire ₹150. One disruption, half an hour before they would have finished, wipes the whole day's incentive. Standard hourly income replacement completely misses this. So we built the Incentive Delta — any payout for a trigger event that falls in the 7pm to 11pm window gets an extra ₹150 added to account for the milestone they could not reach.

**The algorithmic aftereffect.** This one took us a while to notice. When a disruption forces a worker offline, their acceptance rate falls. Their completion rate looks worse. The platform algorithm notices and starts assigning them fewer orders for the next 3 to 5 days — even after the weather clears. So the income loss from one storm actually stretches across most of a week. AIPS tracks acceptance rate and assignment frequency in the 5 days after a confirmed trigger event. If there is a measurable drop, the payout includes a Score Recovery Supplement. We have not seen any other insurance product model this.

---

## Why Zepto and Blinkit specifically

Honestly, everyone is going to build this for Zomato and Swiggy. We did not want to do that.

Q-commerce workers are in a worse position than food delivery workers for three reasons that are easy to miss. First, they work within a 2km radius of a dark store. They cannot reroute around a flooded street. When the zone goes down, they go down. Second, Zepto and Blinkit do not offer rain surge payments. Zomato does. So Q-commerce workers absorb the full cost of weather disruptions with no compensation at all. Third, the incentive cliff structure we described above is more severe in Q-commerce than in food delivery because of the higher order frequency and tighter time windows.

---

## The worker we are designing for

We are calling him Rajan. 28, Zepto partner, based out of the HSR Layout dark store in Bengaluru.

10 hours a day, 26 days a month. Gross earnings around ₹27,000 per month. After fuel and bike maintenance — we estimated this at 30 percent of gross, which is actually slightly conservative compared to the 32 percent figure from the IDInsight two-wheeler delivery study from 2024 — he takes home about ₹21,000. Roughly ₹810 a day, ₹100 an hour.

His current insurance covers accidents. That is it.

When a cloudburst shuts his zone for 5 hours including the evening peak, Rajan loses ₹500 in hourly pay and ₹200 in voided milestone bonuses. Seven hundred rupees gone. AIPS would pay him ₹636 within 2 hours. Not perfect compensation but close, and he gets it without doing anything.

---

## The demo we are building toward

We want to be specific about what the actual demo looks like because vague demos are a waste of everyone's time.

We simulate a rainstorm in Bengaluru. The OpenWeather feed shows rainfall in the HSR Layout zone crossing 6mm per hour. The trigger engine picks this up. It checks that Rajan was logged in for at least 2 hours that day and that his GPS puts him in the zone. Fraud checks run. The event overlaps the 7pm to 11pm window. Payout calculated: 60 percent of his daily earning plus the ₹150 Incentive Delta, coming to ₹636. Razorpay sandbox fires the transfer.

No manual steps anywhere in that chain. That is what we are demoing.

---

## Architecture: B2B2C Embedded Insurance

AIPS is not a standalone consumer app. It is a B2B2C insurance infrastructure layer.

- **Worker** — buys coverage and receives payout
- **Platform** — Zepto / Blinkit, provides data and deduction rails
- **AIPS** — pricing engine, trigger engine, claims engine, audit engine
- **Licensed insurer** — actual risk carrier in the regulated backend

The worker opts in inside the Zepto or Blinkit partner app. The platform deducts the weekly premium from the worker's payout. AIPS monitors triggers, computes payouts, and sends money back through the platform's payout rails.

This architecture is necessary because without platform data — order logs, GPS, earnings history, zone assignment — pricing and attribution are guesswork. With platform data, the system becomes actuarial.

---

## Premium Engine

Every worker's premium is personalized. Not every worker in the same city pays the same amount.

### Baseline Weekly Earning

```
BWE = median of (last 8 weeks of net earnings)
Net earnings = gross platform payout × (1 - cost ratio)

Petrol bike cost ratio:  0.30
EV or cycle cost ratio:  0.15
```

We use median rather than average because one unusually good or bad week can pull the average significantly. Eight weeks rather than four because four weeks can be skewed by a single disruption event.

### Premium Formula

```
Premium = Base × ZoneMultiplier × WorkIntensity × TimeExposure × RiskAdjustment
```

| Factor | What it captures |
|---|---|
| Base | Percentage of BWE, set per tier |
| ZoneMultiplier | Zone Risk Index — flood and shutdown history for that specific dark store zone |
| WorkIntensity | Average hours and orders per day |
| TimeExposure | Share of earnings that fall in the worker's highest-value time blocks |
| RiskAdjustment | Recent claims and anomaly signals |

### Coverage Tiers

| Tier | Weekly premium | Max payout per week | Suited for |
|---|---|---|---|
| Basic | ₹70–₹90 | 40% of BWE | Under 5 hours a day |
| Standard | ₹100–₹130 | 60% of BWE | 6 to 9 hours a day |
| Premium | ₹145–₹180 | 80% of BWE + incentive bonus | 10+ hours a day |

Maximum weekly payout ceiling regardless of tier: `min(plan cap, 0.80 × BWE)`

The tier is system-recommended based on history. The worker can choose. The premium is locked at the start of each weekly cycle and cannot change after a trigger fires.

---

## Trigger Engine

The trigger engine answers one question: **did a qualifying disruption happen, and was this worker genuinely exposed to it?**

It does not decide payout amounts. It does not run fraud detection. It produces a Trigger Confidence Score (TCS) from 0.0 to 1.0 based on weighted evidence from multiple sources.

### The three MVP triggers

**Heavy rain** — IoT sensor at dark store (primary) cross-referenced with OpenWeather (secondary). City-specific thresholds:

| City | Trigger threshold |
|---|---|
| Delhi | 5mm/hr |
| Bengaluru | 6mm/hr |
| Hyderabad | 7mm/hr |
| Mumbai | 10mm/hr |

**Internet shutdown** — SFLC.in RSS feed cross-referenced with app heartbeat signal. A canary group of workers in a different city distinguishes real shutdowns from AIPS server outages.

**Curfew / zone closure** — Platform zone status API (primary) cross-referenced with CAQM and state DM scrapers.

AQI and heat are not standalone triggers in the MVP. They are chronic conditions in some cities, not discrete events. Standalone payouts for them would become salary supplements. They may become payout modifiers in Phase 2.

### Confidence-based decision model

Rather than hard boolean conditions (all must pass or trigger denied), the engine uses weighted signal scoring:

```
TCS = Σ (Wi × Si × Ri) / Σ (Wi × Ri)

Where Wi = signal weight, Si = normalized value, Ri = reliability
```

Missing data redistributes weight to remaining sources. Conflicting signals route to zone cluster review — a single human reviewer confirms the zone event and resolves all workers in that zone simultaneously.

| TCS | Decision |
|---|---|
| > 0.75, low uncertainty | Auto-approve |
| > 0.65, moderate uncertainty | Auto-approve at reduced confidence |
| 0.50–0.75 | Zone cluster review |
| < 0.50 | Reject |

---

## Fraud Detection Engine

Fraud detection in AIPS is not about catching every bad actor. It is about making fraud unprofitable, detectable, and expensive to sustain.

**MVP rule: no auto-deny.** All HIGH and CRITICAL fraud scores route to fast-track human review. Auto-deny is a Phase 3 feature once threshold accuracy is validated against real data.

### Eight fraud signals

1. **Location integrity** — GPS cross-referenced with accelerometer. Fake GPS apps produce unnaturally smooth movement patterns that real bike riding does not.
2. **Activity Quality Score** — normalized time worked + order count + order value. Harder to fake than raw order count alone.
3. **Enrollment timing** — flags workers who enrolled close to a forecast disruption event.
4. **Claim frequency** — compared against zone cohort, adjusted for season.
5. **Earnings baseline manipulation** — detects artificial inflation before enrollment.
6. **Cross-platform double claiming** — Aadhaar-linked identity deduplication across platforms.
7. **Zone-level coordinated fraud** — synchronized behavior across workers with no confirmed trigger.
8. **Historical anomaly** — catch-all for patterns not captured by other signals.

### Work Probability Curve

For every worker, the system computes P(worker actually works at time T) from their 8-week history. This is used to set the payout multiplier:

```
payout_multiplier = 0.15 + 0.85 × work_probability(T)
```

A morning rain event pays approximately 18% to a worker who never works mornings. The same event pays close to 100% to a worker who always works mornings. The floor of 0.15 ensures no confirmed disruption event ever pays zero.

### Final payout formula

```
payout = claimed_loss
       × (1 - 0.70 × fraud_score)
       × payout_multiplier
```

---

## Attribution Logic

The Attribution Engine answers a different question from the Trigger Engine: **was the income loss caused by the disruption, or by something else?**

It uses three-layer proof:

1. **Personal baseline deviation** — compare the worker to their own 8-week history for that time window
2. **Zone cohort validation** — compare them to other workers in the same zone during the event
3. **Trigger overlap** — the disruption must overlap the worker's active earning window

A claim is only attributed to the disruption when all three layers align. A single worker dropping income while the zone stays normal is not a covered loss.

---

## Blockchain — the honest version

We are using blockchain for a specific reason, not because it sounds impressive.

Insurance companies have financial incentives to deny or delay claims. For a worker earning ₹800 a day, a disputed ₹500 payout is not worth fighting in court. They have no leverage.

Blockchain fixes one specific part of this: it makes the policy terms and the trigger records impossible to alter after the fact. When a worker activates coverage, the exact thresholds are written to a smart contract on Polygon. When a trigger fires, the Chainlink oracle writes the event on-chain. That record is permanent and public. The insurer cannot later claim the threshold was not crossed.

We chose Polygon over Ethereum mainnet because Polygon settles in about 2 seconds at under ₹1 per transaction. We rejected Hyperledger Fabric because a private chain controlled by the insurer defeats the entire transparency argument.

**Scope note:** In the MVP, the blockchain layer is simulated for the demo. Full Chainlink oracle integration and live smart contract execution are Phase 3 work.

---

## Data Sources

| Need | Source | Cost |
|---|---|---|
| Hourly rainfall | OpenWeather One Call API | Free |
| Temperature and humidity | OpenWeather One Call API | Free |
| AQI | OpenAQ | Free, open source |
| GRAP alerts | CPCB and CAQM scraper | Simulated in MVP |
| Shutdown records | SFLC.in RSS | Free, public |
| Zone closure | Platform API | Simulated mock |
| Payouts | Razorpay Test Mode | Free sandbox |

---

## Tech Stack

```
Frontend
React with Tailwind CSS — Progressive Web App
PWA chosen over native because many Zepto partners run entry-level phones
with limited storage. Works partially offline during connectivity shutdowns.

Backend
Node.js with Express
Team's primary language. For a 6-week build, using what the team knows
well beats learning a new stack mid-project.

ML Layer
Python with FastAPI
Standard for data processing. Connects to Node backend via REST.
ML is rule-based in MVP. XGBoost pricing model planned for Phase 3.

Blockchain
Polygon with Solidity — simulated in MVP
Full Chainlink oracle integration in Phase 3.

Database
PostgreSQL — profiles, policies, payout records
Redis — real-time trigger state and zone status cache
TimescaleDB — earnings history and trigger logs
(TimescaleDB added because standard PostgreSQL degrades on time-series
queries at scale and our trigger logs grow fast)

External APIs
OpenWeather One Call API
OpenAQ
SFLC.in RSS
Razorpay Test Mode
Simulated platform API (mock Zepto/Blinkit order logs and zone status)
```

---

## MVP vs Phase 3

| Feature | MVP (hackathon) | Phase 3 |
|---|---|---|
| Trigger engine | Rule-based TCS, 3 triggers, MQTT + polling | ML-adaptive thresholds per zone |
| Premium calculation | Weighted formula | XGBoost on real claims data |
| Fraud detection | Rule-based 8 signals, no auto-deny | LSTM motion model + Isolation Forest |
| IoT sensors | Dark store rain gauges | Tamper-evident, on-chain logging |
| Blockchain | Simulated for demo | Live Chainlink oracle, Polygon mainnet |
| Platform data | Simulated mock API | Real partnership API |
| Payouts | Razorpay sandbox | Live UPI |
| Cities | Delhi, Mumbai, Bengaluru, Hyderabad | Pan-India |
| Auto-deny | No — all high-risk routes to review | Yes, after threshold validation |

---

## Build Plan

**Weeks 1–2 (now):** Research, persona work, trigger design, premium model, architecture, README, onboarding wireframe.

**Weeks 3–4:** Worker registration with simulated ID verification. Policy engine with live BWE calculation. Trigger engine connected to OpenWeather and SFLC.in. Claims engine with Razorpay sandbox. Worker dashboard.

**Weeks 5–6:** Work Probability Curve and Activity Quality Score in fraud engine. Zone cluster review flow. Insurer admin dashboard. Blockchain simulation on Polygon testnet. Full end-to-end demo of the Bengaluru rainstorm scenario.

---

## What AIPS Does Not Cover

Health or medical expenses. Life insurance or accidental death. Vehicle repair. Personal illness or voluntary time off. Platform deactivation. Long-term disability.

Income lost because of something the worker could not predict or control, verified by external data. That is it.

---

## Development Setup

This project is built with [Next.js](https://nextjs.org).

### Running locally

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

The main entry point is `app/page.tsx`. The page auto-updates as you edit the file.

### Fonts

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-building/optimizing/fonts) to load [Geist](https://vercel.com/font).

### Deployment

Deploy via the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme). See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-building/deploying) for details.
