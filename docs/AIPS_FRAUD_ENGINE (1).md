# AIPS — Fraud Detection Engine V2
## Fraud Detection Module Specification

> Part of the AIPS (Adaptive Income Protection System) architecture
> B2B2C Embedded Insurance for Q-Commerce Delivery Partners
> Updated: Work Probability Curve, Activity Quality Score,
>           Payout Multiplier formula, no auto-deny in MVP

---

## Core Philosophy

Fraud detection in AIPS is not about catching every bad actor.

It is about making fraud unprofitable, detectable, and expensive to sustain.

The difference matters because:
- Trying to catch every bad actor creates false positives
- False positives deny valid claims
- Denied valid claims destroy worker trust faster than fraud destroys the business
- At lakhs of workers, even a 1% false positive rate means thousands of wrongly
  denied claims every month

The core design principle:

> Don't decide eligibility in binary.
> Price behavior using probability.
> Penalize fraud economically, not with hard denials.

V2 upgrades the system from rule-based denial to probability-weighted
economic control. A worker who rarely works mornings gets a reduced payout
for a morning rain event — not a denial. A worker who always works mornings
gets close to full payout. The system is economically fair across the
full range of work patterns.

The Fraud Engine produces two outputs:
1. A Fraud Score from 0.0 to 1.0
2. A Work Probability score for the claim window

Both feed into the final payout formula. Neither alone is the decision.

**MVP rule: No auto-deny.**
In the MVP, no claim is automatically denied by the fraud engine alone.
HIGH and CRITICAL scores route to fast-track human review — not auto-denial.
Automatic denial creates legal and trust risk before sufficient claims data
exists to calibrate thresholds accurately.

---

## Where Fraud Detection Sits in the Architecture

```
Trigger Engine → Attribution Engine → Fraud Engine → Payout Engine
```

The Fraud Engine runs AFTER the trigger is confirmed and AFTER attribution
has validated that income actually dropped.

It does not block events from being detected.
It does not interfere with the Trigger Engine.
It runs as a gate between attribution and payout.

This separation is intentional:
- Trigger Engine asks: did an event happen?
- Attribution Engine asks: did the worker lose income because of it?
- Fraud Engine asks: is this claim legitimate?
- Payout Engine asks: how much should we pay?

Each layer has a single responsibility.

---

## Identity Anchor: The Foundation of Fraud Prevention

Before any fraud scoring runs, the worker's identity must be anchored correctly.

### What does NOT work as an identity anchor

- Phone number — people have multiple SIMs, can rotate easily
- Email address — trivial to create multiple
- Bank account — people have multiple accounts
- Device ID alone — devices can be shared, replaced, or spoofed

### What works

**Platform-verified partner identity linked to Aadhaar-backed KYC.**

Zepto and Blinkit already perform Aadhaar-linked KYC on every delivery partner
before onboarding them. AIPS does not replicate this verification.

AIPS piggybacks on the platform's verified partner ID as its identity anchor.

This means:
- A worker cannot register on AIPS without an active, verified platform account
- The platform has already confirmed their Aadhaar linkage
- AIPS inherits that verification rather than running its own

One Aadhaar number = one AIPS policy.
Cross-platform deduplication is done by Aadhaar hash, not by name or phone.

### Device fingerprinting as a secondary signal

Device fingerprint (IMEI + device model + OS fingerprint) is used as a
supporting fraud signal, not as the identity anchor.

Reason: devices can be shared in low-income households.
Two legitimate workers sharing a phone should not be denied coverage.
Device fingerprint raises a flag for investigation — it does not auto-deny.

---

## Fraud Signal Stack

The Fraud Engine evaluates eight categories of fraud signals.
Each category produces a sub-score from 0.0 to 1.0.
Sub-scores are combined into the final Fraud Score.

---

### Signal 1 — Location Integrity

**What it checks:**
Is the worker actually where they claim to be?

**How it works:**

GPS coordinates are cross-referenced with the phone's accelerometer data.

```
if GPS shows movement at 25+ km/hr
AND accelerometer shows near-zero physical motion:
    location_fraud_flag = HIGH
```

A delivery worker moving at 25 km/hr on a bike has measurable vibration,
acceleration, and directional changes. A stationary phone with a fake GPS
app shows smooth, unrealistic movement patterns.

**Additional checks:**
- GPS drift pattern (fake GPS apps produce unnaturally smooth paths)
- Speed consistency (sudden teleportation between locations)
- Zone boundary behavior (GPS appearing exactly at zone boundary repeatedly)

**Sub-score:**
```
location_score = weighted combination of:
    - gps_vs_accelerometer_match    (0.50)
    - path_smoothness_anomaly       (0.30)
    - zone_boundary_behavior        (0.20)
```

High location_score = suspicious. Low = clean.

**MVP note:**
Full IMU-based motion signature validation using an LSTM trained on real
delivery patterns is Phase 3 work.
In the MVP, GPS vs accelerometer cross-check is the primary mechanism.

---

### Signal 2 — Activity Authenticity

**What it checks:**
Was the worker actually working, or just logged in waiting for a trigger?

**The problem:**
A scammer can log in, do nothing, and wait for a rain event to fire.
Login alone proves nothing.

**How it works:**

```
activity_authenticity = f(
    orders_completed_in_event_window,
    movement_pattern_consistency,
    login_to_first_order_gap,
    idle_login_duration_before_trigger
)
```

**Specific rules:**

Idle login abuse detection:
```
if worker logged in for 3+ hours before trigger
AND activity_quality_score < 0.3
AND trigger fires shortly after login:
    idle_abuse_flag = ELEVATED
```

**Activity Quality Score (replaces raw order count):**

A scammer can game a "3 orders" threshold by placing and cancelling orders.
Activity Quality measures real productive effort, not just order count.

```
activity_quality = (
    0.40 × normalized_time_worked
  + 0.35 × normalized_order_count
  + 0.25 × normalized_order_value
)
```

Where each component is normalized against the worker's own 8-week baseline
for that time window — not against a global average.

This is harder to fake because:
- Time worked requires sustained GPS movement
- Order value requires orders that actually complete and pay out
- All three must be elevated together — gaming one alone is not enough

Pre-trigger activity requirement:
Worker must have an activity_quality_score of at least 0.35 in the 4 hours
before the trigger window.
This replaces the old "3 orders OR 90 minutes moving" rule which was gameable.

**Activity authenticity sub-score:**
```
activity_authenticity_score =
    0.45 × (1 - activity_quality)
  + 0.35 × login_gap_score
  + 0.20 × idle_abuse_flag
```

High score = suspicious. Low = clean.

---

### Signal 3 — Enrollment Timing

**What it checks:**
Did the worker enroll suspiciously close to a known disruption event?

**The problem:**
Someone who enrolls 2 days before a forecast monsoon storm and immediately
claims is showing classic adverse selection behavior.

**How it works:**

```
enrollment_gap = days between policy activation and first claim

if enrollment_gap < 14 days:
    enrollment_flag = ELEVATED

if enrollment_gap < 7 days AND large storm was forecast:
    enrollment_flag = HIGH
```

**Weather forecast cross-reference:**
When a worker enrolls, the system checks whether a significant weather event
was forecast for their zone in the next 7 days.
If yes, the enrollment is flagged for monitoring.
This does not deny coverage — it raises the fraud threshold for that worker's
first claim.

**The 8-week eligibility gate handles most of this:**
A worker with less than 8 weeks of work history cannot enroll at all.
This signal catches workers who have the history but enroll strategically
just before a known event.

---

### Signal 4 — Claim Frequency and Pattern

**What it checks:**
Is this worker claiming at a rate that is statistically unusual compared to
their zone cohort?

**How it works:**

```
claim_rate = claims_in_last_8_weeks / eligible_trigger_events_in_last_8_weeks

zone_avg_claim_rate = average claim rate for all workers in same zone

if claim_rate > 2.5 × zone_avg_claim_rate:
    frequency_flag = ELEVATED

if claim_rate > 4 × zone_avg_claim_rate:
    frequency_flag = HIGH
```

**Seasonal adjustment:**
Claim rates are compared within the same season.
A worker claiming frequently during monsoon season is compared to other
monsoon-season claim rates, not to dry-season averages.

**Cooldown rule:**
After an approved claim, a 72-hour cooldown applies before the next claim
can be auto-approved. Claims during the cooldown period route to manual review.

---

### Signal 5 — Earnings Baseline Manipulation

**What it checks:**
Did the worker artificially inflate their earnings baseline before a claim
to increase payout?

**How it works:**

The BWE is calculated from 8 weeks of median earnings.
It is locked at policy start and cannot be changed after a trigger is announced.

However, a worker could try to inflate earnings in the 8 weeks before enrolling.

```
if earnings_in_last_4_weeks > 1.5 × earnings_in_prior_4_weeks:
    baseline_inflation_flag = ELEVATED

if earnings_growth_rate > 2 standard deviations above zone average:
    baseline_inflation_flag = HIGH
```

**Baseline lock rule:**
The BWE is frozen at the time of policy activation.
Any earnings changes after activation do not affect the current policy period's
payout calculation.
The baseline recalculates weekly but each week's recalculation uses only
data that predates the current trigger event.

---

### Signal 6 — Cross-Platform Double Claiming

**What it checks:**
Is the worker earning on another platform during the same event window
while claiming income loss on AIPS?

**The problem:**
A worker insured on their Zepto account could switch to Swiggy during a
rain event and earn there while claiming loss here.

**How it works:**

AIPS uses Aadhaar-linked Unique Partner ID for deduplication.
One person = one active policy regardless of how many platform accounts they hold.

For cross-platform activity detection during a claim window:
```
if worker has registered platform accounts on multiple services
AND platform B shows active orders during the AIPS claim window:
    cross_platform_flag = HIGH
    route to manual review
```

**Limitation acknowledged:**
AIPS cannot directly query Swiggy or Zomato order logs.
Cross-platform detection relies on:
1. Aadhaar-linked identity to know which platforms a worker is registered on
2. Voluntary data-sharing agreements between platforms (Phase 3)
3. In MVP: manual review flag for workers known to be multi-platform

This is not fully solvable in the MVP. It is acknowledged and priced into
the loss ratio rather than treated as a hard block.

---

### Signal 7 — Zone-Level Coordinated Fraud

**What it checks:**
Is a group of workers in the same zone showing synchronized suspicious behavior
that suggests organized fraud?

**The problem:**
Individual fraud is manageable. Coordinated fraud — where a group of workers
in one dark store zone all game the system together — can cause large losses
in a single event.

**How it works:**

```
zone_claim_sync_score = correlation between:
    - timing of claims across workers in zone
    - similarity of claimed loss amounts
    - similarity of GPS patterns during event
    - shared device or network signals

if zone_claim_sync_score > 0.75
AND no external trigger confirmed by Trigger Engine:
    zone_fraud_alert = HIGH
    all claims in zone routed to manual review
    compliance team notified
```

**Important distinction:**
Many workers in a zone all claiming during a confirmed trigger event is
EXPECTED and NORMAL. That is the system working correctly.

Zone fraud alert only fires when:
- No trigger was confirmed, OR
- The synchronized behavior is statistically improbable even accounting
  for the confirmed trigger

---

### Signal 8 — Historical Anomaly Score

**What it checks:**
Does this worker's historical claim behavior show patterns that are
statistically unusual in ways not captured by other signals?

**How it works:**

This is a catch-all anomaly signal that looks at the worker's full history:

```
anomaly_score = f(
    variance_in_claim_amounts,
    claim_timing_relative_to_trigger_confirmation,
    gap_between_claim_and_prior_inactivity,
    historical_fraud_flags_count
)
```

Workers who have been manually reviewed and cleared have their anomaly
score reduced over time. Clean history is rewarded.

Workers who have previously had claims denied for fraud reasons have
permanently elevated anomaly scores that require manual review.

---

## Fraud Score Computation

All eight signal sub-scores are combined into a single Fraud Score.

### Weights

| Signal | Weight |
|---|---|
| Location integrity | 0.25 |
| Activity authenticity | 0.20 |
| Claim frequency | 0.15 |
| Enrollment timing | 0.10 |
| Baseline manipulation | 0.10 |
| Cross-platform activity | 0.10 |
| Zone coordination | 0.05 |
| Historical anomaly | 0.05 |

### Formula

```
FraudScore = Σ (Wi × Si)

Where:
Wi = weight of signal i
Si = sub-score of signal i (0.0 = clean, 1.0 = highly suspicious)
```

### Pseudo-code

```
computeFraudScore(signals, weights):
    score = 0.0
    for i in range(len(signals)):
        score += weights[i] × signals[i]
    return score
```

---

## Work Probability Curve (WPC)

This is the second major output of the Fraud Engine alongside FraudScore.

### What it is

For every worker, the system computes P(worker actually works at time T)
from their 8-week earning history.

This answers a question the Fraud Score alone cannot:
**Was this worker even likely to be earning during the disruption window?**

A worker whose entire income comes from 6 PM–10 PM should not receive
the same payout as a morning-only worker when a 6 AM rain event fires.
This is not fraud detection — it is fairness.

### Formula

```
work_probability(time_window T) =
    0.65 × empirical_frequency(T)
  + 0.25 × slot_density(T)
  + 0.10 × clean_history_bonus

Where:
- empirical_frequency(T): fraction of past weeks worker was active in window T
- slot_density(T): average orders per hour in window T vs other windows
- clean_history_bonus: small uplift (max 0.10) for workers with no prior flags
```

### Example output for a worker

| Time Window | Work Probability |
|---|---|
| 6–9 AM | 0.05 |
| 9 AM–12 PM | 0.40 |
| 12–6 PM | 0.80 |
| 6–10 PM | 0.92 |
| 10 PM–12 AM | 0.30 |

### Payout Multiplier

The WPC directly controls the payout multiplier:

```
payout_multiplier = 0.15 + 0.85 × work_probability(T)
```

This means:
- Worker who never works that window → multiplier ≈ 0.15 (not zero, not full)
- Worker who always works that window → multiplier ≈ 1.0

**The floor of 0.15 is intentional.**
A zero payout for a confirmed disruption event, even for a low-probability
window, would feel punitive and damage trust. The 15% floor acknowledges
the event was real while correctly discounting the unlikely income loss.

### Morning rain worked example

Worker rarely works 6–9 AM (empirical frequency = 0.05).
Rain event fires 6–8 AM.

```
work_probability = 0.65 × 0.05 + 0.25 × 0.02 + 0.10 × 0.0
                 ≈ 0.038

payout_multiplier = 0.15 + 0.85 × 0.038
                  ≈ 0.18
```

Worker receives approximately 18% of their calculated daily loss.
Not zero. Not denied. Economically calibrated.

### Opportunity Score (edge case protection)

If the disruption starts within 30 minutes of the worker's store opening
or shift start, the worker had almost no opportunity to earn regardless
of their probability profile.

```
if event_start_time is within 30 min of shift_start:
    opportunity_score = LOW
    payout_multiplier is not further reduced
    (worker is not penalized for bad timing they didn't control)
```

This prevents the system from penalizing workers who arrived for their
shift just as the disruption hit.

---

## Final Payout Formula

The Payout Engine uses both outputs of the Fraud Engine:

```
payout = claimed_loss
       × (1 - 0.70 × fraud_score)
       × payout_multiplier
```

Where:
- claimed_loss = disruption_hours × worker_hourly_value × time_weight (from Payout Engine)
- fraud_score = 0.0 to 1.0 from Fraud Engine signal stack
- payout_multiplier = 0.15 to 1.0 from Work Probability Curve

**Behavior at extremes:**

| Fraud Score | Work Probability | Payout |
|---|---|---|
| 0.0 (clean) | 1.0 (always works this window) | 100% of claimed loss |
| 0.0 (clean) | 0.05 (rarely works this window) | ~18% of claimed loss |
| 0.5 (suspicious) | 1.0 | 65% of claimed loss |
| 0.8 (high risk) | 1.0 | 44% of claimed loss — routes to review |
| 0.8 (high risk) | 0.05 | ~8% — routes to fast-track review |

This means fraud cannot completely zero out a claim — the system routes
high-risk claims to human review rather than auto-denying. But fraud
significantly and correctly reduces the economic benefit of claiming.

---

---

## Decision Tiers

| Fraud Score | Tier | Action |
|---|---|---|
| 0.0 – 0.35 | LOW RISK | Auto-approve, payout formula runs immediately |
| 0.35 – 0.60 | MEDIUM RISK | Zone cluster review (aligns with Trigger Engine) |
| 0.60 – 0.80 | HIGH RISK | Fast-track human review (2-hour window) |
| > 0.80 | CRITICAL | Fast-track human review + compliance flag |

**No auto-deny in MVP.**

HIGH and CRITICAL scores do not auto-deny. They route to fast-track review.
Reason: before sufficient real claims data exists, calibrating auto-deny
thresholds accurately is not possible. A wrongly auto-denied claim for a
verified rain event is a reputational and legal liability.
Auto-deny can be introduced in Phase 3 once threshold accuracy is validated
against real outcomes.

### Review package

When a claim routes to manual review, the reviewer receives:

```
ReviewPackage {
    worker_id
    claim_id
    fraud_score
    score_breakdown_per_signal
    which_signals_triggered_flags
    worker_history_summary
    zone_context (other workers in zone, trigger confirmation)
    evidence_bundle from Trigger Engine
    recommended_action
    appeal_deadline
}
```

The reviewer should be able to make a decision within minutes, not hours.
The package is designed so the context is immediately clear — not a raw data dump.

### Appeal process

Every denied claim has appeal rights.
Appeal routes to a senior reviewer who sees the full evidence bundle plus
the original reviewer's notes.
Workers are told specifically which signals elevated their score.
Vague denials are not acceptable.

---

## Progressive Consequences

Fraud prevention is not just about one claim.
It is about making sustained fraud unprofitable over time.

| Behavior | Consequence |
|---|---|
| First elevated score (cleared on review) | No consequence |
| Second elevated score in 8 weeks | Premium increase at next recalculation |
| Confirmed fraud attempt | Policy suspended for 12 weeks |
| Confirmed coordinated fraud | Account banned, platform notified |
| Clean history for 6+ months | Anomaly score reduced, faster auto-approvals |

The goal is that an honest worker with a long clean history experiences
almost no friction. Frequent legitimate claims are fine — that is the product
working correctly. What the system watches for is behavioral anomalies, not
claim volume alone.

---

## What Fraud Detection Does NOT Do

- It does not block the Trigger Engine from detecting events
- It does not deny claims based on claim volume alone (high claims in a
  high-risk zone during monsoon season is expected)
- It does not penalize workers for living in high-risk zones
- It does not use race, religion, location name, or any demographic signal
- It does not auto-deny without a reason code and appeal path
- It does not share fraud flags with the platform without worker consent
  unless confirmed fraud is reported to authorities

---

## MVP Implementation Notes

In the MVP, the following are rule-based:

- Location integrity: GPS vs accelerometer cross-check only
- Activity authenticity: order count and login gap rules
- All threshold values and weights are manually calibrated

The following are Phase 3 ML upgrades:

| Signal | MVP | Phase 3 |
|---|---|---|
| Location integrity | GPS vs accelerometer | LSTM motion signature model |
| Activity authenticity | Rule-based order checks | Isolation Forest on activity patterns |
| Zone coordination | Threshold-based correlation | Graph anomaly detection |
| Historical anomaly | Rule-based history scan | Gradient Boosting on full feature set |

ML is not required for a working fraud engine in the MVP.
Rule-based scoring is auditable, explainable, and reliable in a demo.
ML becomes meaningful only after real claims data exists to train on.

---

## Feedback Loop

After every resolved claim (approved or denied), the fraud signal accuracy
is evaluated:

```
PostClaimEvaluation {
    predicted_fraud_score
    actual_outcome (legitimate / fraudulent / disputed)
    which_signals_were_predictive
    which_signals_were_noise
}
```

This data feeds back into:
- Weight recalibration (which signals are actually predictive)
- Threshold tuning (are we over- or under-flagging)
- ML training data (Phase 3)

Without this feedback loop, the fraud engine never improves.
With it, it gets better every week.

---

## Relationship to Other Modules

```
Premium Engine  →  sets baseline, cooldown affects RA factor
Trigger Engine  →  fraud engine never blocks trigger detection
Attribution     →  fraud runs after attribution confirms income drop
Payout Engine   →  fraud score is a multiplier on payout, not a veto alone
Blockchain      →  all fraud decisions logged with full evidence bundle
Dashboard       →  worker sees which signals were elevated (transparency)
```

---

## Summary

| | V1 | V2 |
|---|---|---|
| Identity anchor | Vague — phone/email | Platform KYC + Aadhaar |
| Activity check | Raw order count (gameable) | Activity Quality Score |
| Time-of-day fairness | Flat weighting | Work Probability Curve |
| Payout formula | Binary approve/deny | Continuous: claimed_loss × (1 - 0.7×fraud) × WPC |
| Auto-deny | Yes (HIGH/CRITICAL) | No auto-deny in MVP |
| Morning non-workers | Same payout as evening workers | Correctly reduced via WPC |
| Opportunity edge case | Not handled | Opportunity Score protects new-shift workers |
| ML dependency | None in MVP | None in MVP |
| Feedback loop | Not present | Post-claim evaluation feeds weight tuning |

---

*AIPS Fraud Detection Engine V2 — Module Specification*
*Part of AIPS: Adaptive Income Protection System*
*Guidewire DEVTrails 2026*
