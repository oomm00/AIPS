# AIPS — Premium Engine
## Price Deciding Module Specification

> Part of the AIPS (Adaptive Income Protection System) architecture
> B2B2C Embedded Insurance for Q-Commerce Delivery Partners

---

## What This Module Does

The Premium Engine decides how much a delivery partner pays weekly to stay covered under AIPS.

It does not assign everyone the same price.
It does not use a fixed national rate.
It does not guess.

Every worker gets a personalized weekly premium calculated from their own earnings history, their zone's risk profile, how hard they work, and when during the day they earn most of their money.

The output is a number: the worker's premium for that week.
That number is deducted automatically from their platform payout by Zepto or Blinkit.

---

## Prerequisites: What the Engine Needs Before It Can Run

The Premium Engine cannot calculate anything without platform data.
This is why AIPS must be B2B2C.

From the platform integration, the engine requires:

**Earnings history**
- Gross weekly payout for the last 8 weeks minimum
- Net weekly payout (after platform deductions)
- Incentive and bonus amounts per week
- Peak-hour earnings breakdown where available

**Work history**
- Login timestamps per day
- Order completion timestamps
- Active hours per day
- Orders completed per day
- Active days per week

**Worker profile**
- Vehicle type (petrol bike / EV / cycle)
- Vehicle age band (newer or older/high-maintenance)
- Dark store zone assignment
- Platform partner account ID (identity anchor)

**Risk signals**
- Number of claims filed in the last 4 weeks
- Any recent suspicious session behavior flagged by the platform
- Zone reassignment history

Without all of the above, the premium is a guess.
With all of the above, it is actuarial.

---

## Eligibility Gate

The Premium Engine does not run on a worker until they pass the eligibility gate.

A worker is eligible only if:
- They have at least **8 weeks of verified work history** on the platform
- They meet a **minimum threshold income** in at least 6 of those 8 weeks
- They have been active for an average of at least 20 hours per week
- They have a valid, active partner account on Zepto or Blinkit

**Why 8 weeks is a hard floor and will not be lowered:**
- Stops day-one gaming (someone joining right before a forecast storm)
- Provides enough data to build a real earnings baseline
- Ensures the premium is calculated from a stable pattern, not a fluke week
- Is consistent with how real insurance works — no credible history, no coverage

A new worker who has not crossed this threshold is not eligible.
There is no probationary tier with reduced coverage.
The gate exists precisely because adverse selection destroys insurance products.

---

## Step 1 — Baseline Weekly Earning (BWE)

The BWE is the foundation. Everything is calculated from it.

```
BWE = median of the last 8 weeks of net earnings
```

**Why median, not average:**
One extremely good or extremely bad week distorts an average significantly.
The median stays stable even when one outlier week exists.

**Why 8 weeks:**
8 weeks covers two full monsoon-cycle months.
It is long enough to smooth volatility and short enough to stay current.

**Net earnings are approximated using a cost ratio:**

| Vehicle Type | Cost Ratio |
|---|---|
| Petrol two-wheeler | 0.30 (30% of gross goes to fuel + maintenance) |
| EV or cycle | 0.15 |
| Older / high-maintenance petrol bike | Higher band, assigned per profile |

```
BWE = median(last 8 weeks gross payout) × (1 - cost ratio)
```

This is not charity arithmetic.
This is a realistic approximation of the worker's actual disposable income — the money they actually lose when a disruption hits.

---

## Step 2 — Zone Risk Index (ZRI)

Every dark store zone gets a Zone Risk Index.

The ZRI is not the city name.
A zone in North Bengaluru and a zone in South Bengaluru can have very different risk profiles.

**ZRI inputs:**
- Historical rain disruption frequency for that zone (rolling 2 years)
- Internet shutdown incidents at the district level
- Curfew and zone closure events
- Seasonal pattern (monsoon months weight higher)
- Local flood propensity based on drainage infrastructure

**ZRI formula (rule-based in MVP):**

```
ZRI = (rain_freq × w1) + (shutdown_freq × w2) + (closure_freq × w3) + seasonal_adjustment
```

Weights (w1, w2, w3) are set per city based on historical disruption data.
In Phase 3, these weights are learned by an ML model trained on real claims.

**Zone multiplier applied to premium:**

```
k_zone = ZRI_worker_zone / ZRI_baseline

where ZRI_baseline = median ZRI across all active zones
```

A worker in a high-flood zone pays a higher premium than a worker in a stable zone, even if both are in the same city and same tier.

---

## Step 3 — Work Intensity Factor

A worker who works 10 hours a day and completes 25 orders has more income at risk than a worker doing 3 hours and 8 orders.

The premium should reflect this.

**Inputs:**
- Average active hours per day (last 8 weeks)
- Average orders completed per day
- Average active days per week

**Work Intensity Score (WI):**

```
WI = (avg_hours_per_day / benchmark_hours) × (avg_orders_per_day / benchmark_orders)
```

Where benchmark values are the city-level median for that zone.

A WI above 1.0 means the worker is more exposed than average.
A WI below 1.0 means they are less exposed.

The premium scales proportionally with WI.

---

## Step 4 — Time-of-Day Exposure Factor

This is the most distinctive part of the pricing model.

**The key insight:**
A disruption is more expensive to insure if it happens during the worker's most valuable earning hours.

We do not use a global peak window like "everyone earns most between 7 PM and 11 PM."

We use the **worker's own history**.

**How it works:**

From the last 8 weeks of earnings data, the engine computes how much of the worker's total weekly income falls in each time block.

Example for a hypothetical worker:

| Time Block | Share of Weekly Earnings |
|---|---|
| 6 AM – 10 AM | 15% |
| 10 AM – 2 PM | 20% |
| 2 PM – 6 PM | 15% |
| 6 PM – 10 PM | 40% |
| 10 PM – 12 AM | 10% |

This is the worker's **personal earnings heatmap**.

**Time Exposure Factor (TE):**

```
TE = share of earnings in the worker's top-earning blocks / 0.5
```

A worker who earns 50% or more of income in a single high-value block gets a TE above 1.0.
This reflects higher exposure — one well-timed disruption can wipe out a large share of their week.

A worker with evenly spread earnings across the day has lower concentration risk.

The TE factor adjusts premium accordingly.

---

## Step 5 — Risk Adjustment Factor

A worker who has recently claimed is statistically more likely to claim again.
A worker with no claims history is lower risk.

**Inputs:**
- Number of approved claims in the last 4 weeks
- Number of claims sent to manual review in last 8 weeks
- Any anomaly signals from fraud detection

**Risk Adjustment (RA):**

```
RA = 1.0                     (no recent claims, clean history)
RA = 1.10 to 1.25            (1 claim in last 4 weeks)
RA = 1.30 to 1.50            (2 or more claims in last 4 weeks)
RA = flagged for review       (anomaly signals present)
```

RA is multiplicative and stacks with other factors.
It prevents repeat claimants from gaming subsidized pricing.

---

## Final Premium Formula

```
Premium = Base × k_zone × WI × TE × RA
```

Where:

| Variable | Meaning |
|---|---|
| Base | Derived from BWE — a percentage of the worker's weekly disposable income |
| k_zone | Zone Risk Multiplier (above or below 1.0 depending on zone) |
| WI | Work Intensity Factor |
| TE | Time-of-Day Exposure Factor |
| RA | Risk Adjustment for claims history |

**Base derivation:**

The Base premium is a percentage of BWE set per tier.
In the MVP this is rule-based.

Example bands:
- Low-exposure workers: Base ≈ 1.2% to 1.5% of BWE per week
- Medium-exposure workers: Base ≈ 1.5% to 2.0% of BWE per week
- High-exposure workers: Base ≈ 2.0% to 2.5% of BWE per week

These percentages are calibrated against expected payout frequency per zone.
They must be validated against real loss data before production.

---

## Tier Recommendation

After the formula runs, the engine recommends a coverage tier.

The tier determines:
- The weekly payout cap
- The maximum hours covered per event
- The maximum rupee payout per week

| Tier | Suited For | Weekly Payout Cap |
|---|---|---|
| Basic | Under 5 hours/day, low zone risk | 40% of BWE |
| Standard | 6–9 hours/day, moderate zone risk | 60% of BWE |
| Premium | 10+ hours/day, high exposure / high zone risk | 80% of BWE |

**The recommendation is system-generated.**
The worker can choose any tier.
Downgrading below the system recommendation is allowed but logged.
The system cannot force a tier.

**Maximum payout ceiling regardless of tier:**

```
Max Weekly Payout = min(Plan Cap, 0.80 × BWE)
```

This is a hard ceiling.
No combination of triggers, events, or claims can exceed 80% of BWE in one week.
This prevents full salary replacement, which would destroy the loss ratio.

---

## What the Premium Does NOT Do

- It does not penalize a worker for being in a high-risk city if their specific zone is stable
- It does not reward a worker for filing fewer claims than the average (that is fraud prevention's job, not pricing's job)
- It does not fluctuate daily — the premium is set for the week at the start of the billing cycle and cannot change mid-week
- It does not price in AQI or heat as standalone risk factors in the MVP

---

## Weekly Recalculation

The premium recalculates every week.

**What changes week to week:**
- New week of earnings data enters the 8-week window
- Zone Risk Index is refreshed based on new disruption events
- Risk Adjustment updates based on new claims

**What does NOT change mid-week:**
- The premium for the current week is locked at the start of the cycle
- It cannot be repriced after a trigger fires

This is a hard rule. Repricing after a trigger creates an obvious gaming vector.

---

## Capital Reserve and Reinsurance

The premium model must survive bad weeks.

**Reserve:**
- 20% to 30% of weekly premium inflow is set aside as reserve
- Reserve absorbs normal volatility (a moderate rain week with more claims than usual)

**Reinsurance:**
- For catastrophe weeks (large monsoon event affecting many workers simultaneously), AIPS transfers excess risk to a reinsurer via a stop-loss structure
- Example: AIPS absorbs up to ₹4,00,000 in total weekly payouts; anything above that is covered by the reinsurer

This is not optional architecture.
Without reserve and reinsurance, a bad monsoon week destroys the product.

---

## MVP Implementation Notes

In the MVP, the following are rule-based (no ML required):

- ZRI weights per city
- Base premium percentage per tier band
- WI benchmark values per zone
- TE calculation from earnings timestamps
- RA multipliers per claim count

ML is planned for Phase 3, not Phase 1.

The reason: rule-based logic is auditable, explainable, and reliable in a demo.
ML requires training data that does not exist until the product has real users.

---

## Worker-Facing Transparency

The worker dashboard must show, in plain language:

- Their current BWE
- Their zone risk level (low / medium / high)
- Their personal earning heatmap
- Why the system recommended their tier
- Their current weekly premium and what it covers
- After any payout: the breakdown of how the payout was calculated

Transparency is not a feature.
It is the primary trust mechanism.

Workers talk to each other.
If two workers in the same zone receive different payouts for the same rain event, they will notice.
The dashboard must explain why before they ask.

---

## Summary

| Input | Source |
|---|---|
| 8-week median net earnings | Platform earnings logs |
| Vehicle cost ratio | Worker registration |
| Zone Risk Index | Historical disruption data + IoT sensors |
| Work Intensity | Platform work logs |
| Time-of-Day Exposure | Platform earnings timestamps |
| Risk Adjustment | Internal claims history |

| Output | Description |
|---|---|
| Weekly premium | Personalized rupee amount deducted from platform payout |
| Tier recommendation | Basic / Standard / Premium |
| Max weekly payout cap | min(plan cap, 0.80 × BWE) |

---

*AIPS Premium Engine — Module Specification v1.0*
*Part of AIPS: Adaptive Income Protection System*
*Guidewire DEVTrails 2026*
