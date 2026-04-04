# AIPS — Attribution Engine V1

## 1. Core Purpose

The Attribution Engine answers one question:

Did this worker lose income because of the confirmed disruption event?

It does not answer:

* did an event happen? That is Trigger Engine. 
* is the claim fraudulent? That is Fraud Engine. 
* how much should the final payout be? That is Payout Engine.

Attribution is the causal bridge between trigger and fraud. It converts a confirmed zone event into a defensible estimate of event-linked income loss. The module must be fair, explainable, and resistant to both underpayment and gaming.

---

## 2. Design Principles

1. Attribution is causal, not binary.
2. Confidence is a gatekeeper, not a multiplier.
3. Missing or weak data must not punish the worker.
4. Historical behavior matters as much as immediate pre-event activity.
5. Recovery after an event is positive evidence, not a penalty if absent.
6. Very small expected losses should not enter full attribution logic.
7. The system must be explainable to workers and reviewers.

---

## 3. Module Output

AttributionDecision {
status: STRONG | PARTIAL | WEAK | NONE
expected_income
actual_income
raw_loss
attributable_loss_amount
attributable_loss_ratio
causality_score
confidence_score
market_pulse_factor
evidence_bundle
explanation_codes[]
}

Definitions:

* status: human-readable tier
* expected_income: earnings the worker likely would have made in the event window
* actual_income: earnings actually observed in the same window
* raw_loss: expected_income minus actual_income
* attributable_loss_amount: portion of raw_loss causally tied to the event
* attributable_loss_ratio: attributable_loss_amount divided by expected_income
* causality_score: strength of event-to-loss link
* confidence_score: data quality and completeness score
* market_pulse_factor: demand-adjusted multiplier
* evidence_bundle: full trace for audit and review

---

## 4. Full Pipeline

Trigger Engine confirms the event and the worker’s exposure. 
Premium Engine provides the worker’s earnings structure, work pattern, and time-of-day profile. 
Attribution Engine computes causal income loss.
Fraud Engine then checks legitimacy and suspicious patterns before payout. 
Payout Engine applies the final payout formula.

---

## 5. Inputs

### From Trigger Engine

* trigger_type
* event_start
* event_end
* TCS
* US
* exposure_score
* zone_id
* peak_overlap_flag
* event confidence context 

### From Premium Engine

* 8-week earnings history
* personal earnings heatmap
* work intensity profile
* zone context
* baseline earning pattern 

### From platform logs

* login timestamps
* active minutes
* order attempts
* order completions
* order values
* shift start/end if available

### Optional external context

* zone reopening time
* district-level shutdown resolution
* demand pulse from active-worker earnings in the zone
* weather normalization context

---

## 6. Layer 1 — Baseline Earnings Model

Purpose: estimate what the worker would have earned during the event window if the event had not happened.

### 6.1 Expected Income Formula

ExpectedIncome(T) =
AdjustedHourlyRate(T) × EventDuration × OpportunityFactor × MarketPulseFactor

Where:

* AdjustedHourlyRate(T) is the worker’s normal earning rate for that exact time block
* EventDuration is the overlap between the worker’s active earning window and the trigger window
* OpportunityFactor captures whether the worker realistically had time to earn
* MarketPulseFactor adjusts for demand spikes or demand compression

---

### 6.2 Adjusted Hourly Rate

AdjustedHourlyRate(T) =
earnings in time block T over 8 weeks
/
hours worked in time block T over 8 weeks

This must use the worker’s own time block history, not a city average.

---

### 6.3 Opportunity Factor

OpportunityFactor is used to avoid penalizing workers who had no realistic chance to earn before the disruption hit.

Rules:

* if event starts within 30 minutes of shift start, OpportunityFactor = 1.0
* if worker was already active shortly before the event, OpportunityFactor stays high
* if worker had long inactivity and no historical intent for that slot, OpportunityFactor is reduced

This preserves fairness for shift-edge cases and prevents the system from assuming “not logged in” always means “not intending to work.” The reviewer’s ghost-shift concern is explicitly addressed here.

---

### 6.4 Historical Intent

Historical Intent is a new signal in V2.

HistoricalIntent =
strength of the worker’s past habit of working this same time block on the same day type

Examples:

* worked Fridays 7 PM–11 PM in 7 of the last 8 weeks → high intent
* usually inactive at that time block → low intent

This signal fixes the false-negative case where the worker sees the weather coming and does not log in immediately before the event, even though their work history shows they normally would have been working that slot. This directly addresses the review’s “ghost shift” problem. 

HistoricalIntent is combined with pre-event activity as follows:

IntentScore = max(PreEventActivityScore, HistoricalIntentScore)

This prevents one weak signal from collapsing an otherwise valid claim.

---

## 7. Layer 2 — Observed Income Measurement

Purpose: measure what the worker actually earned in the same window.

ActualIncome(T) = sum of completed order values within the event window

Rules:

* only completed earnings count
* partial orders are counted proportionally if platform logs support that
* cancelled or abandoned orders do not count as income
* if platform outage is confirmed, the observed income can be zero, but the system must preserve a separate cause split instead of assuming the event alone caused everything

Observed income is not the same as orders attempted. Attempted work is useful for context, but actual income is the payout-relevant number.

---

## 8. Layer 3 — Raw Loss Computation

RawLoss = max(0, ExpectedIncome - ActualIncome)

If RawLoss is below a minimum evaluation threshold, the claim does not enter full attribution scoring.

Minimum Evaluation Threshold:

* if ExpectedIncome < ₹50, skip full attribution
* route to LOW_IMPACT or review bucket instead

This removes noise from tiny earning windows and avoids unstable ratios in very low-income periods. It directly fixes the epsilon vulnerability called out in review. 

NormalizedLoss is no longer a free-running ratio used to punish low-income windows. If ratio-based analytics are needed internally, they must be clipped and never allowed to drive payout reduction directly.

---

## 9. Layer 4 — Causality Scoring Engine

Purpose: measure how strongly the loss is linked to the event.

CausalityScore is computed from six signals plus one demand adjustment.

### Signals

1. Time Alignment
   Did the income drop start inside the event window?

2. Zone Alignment
   Was the worker in the affected zone during the event?

3. Historical Intent
   Did the worker normally work this slot?

4. Pre-Event Activity
   Was the worker already active shortly before the event?

5. Recovery Evidence
   Did earnings resume after the event ended?

6. Baseline Stability
   Was the worker’s earnings pattern stable enough to trust the baseline?

7. Market Pulse
   Did zone-level demand rise or fall unusually during the event?

---

### 9.1 Signal Weights

Default MVP weights:

* Time Alignment: 0.22
* Zone Alignment: 0.18
* Historical Intent: 0.18
* Pre-Event Activity: 0.12
* Recovery Evidence: 0.10
* Baseline Stability: 0.10
* Market Pulse: 0.10

Total = 1.00

The weights are intentionally not dominated by a single short-term behavior signal. This prevents the system from overreacting to one missed login, one delayed start, or one messy log gap.

---

### 9.2 Time Alignment

High score if:

* income drop begins inside the trigger window
* earnings recover after the event ends
* the drop overlaps the confirmed disruption window

Low score if:

* income drop started before the event
* income was already weak or unstable
* no temporal overlap exists

---

### 9.3 Zone Alignment

High score if:

* the worker is physically or operationally inside the affected zone
* exposure score from Trigger Engine is strong 

Low score if:

* worker is outside the zone
* movement data contradicts claimed presence
* zone match is weak or missing

---

### 9.4 Historical Intent

High score if:

* the worker regularly earns in that time block
* weekly consistency is strong
* the worker’s historical slot pattern matches the event time

Low score if:

* the worker rarely works that slot
* the pattern is highly irregular
* no meaningful historical habit exists

This signal is mandatory in V2. It prevents the system from punishing workers who stayed off the road because the storm was already obvious.

---

### 9.5 Pre-Event Activity

Pre-Event Activity is no longer treated as a hard proof of intent. It is only one evidence source.

High score if:

* the worker was active in the 90–120 minutes before event start
* activity quality is good
* logs show genuine work behavior

Low score if:

* worker was idle
* activity quality is low
* behavior looks synthetic or minimal

Pre-Event Activity must never override Historical Intent by itself.

---

### 9.6 Recovery Evidence

Recovery evidence is asymmetric.

If the worker resumes earning after the event:

* this is positive evidence
* score increases

If the worker does not resume earning immediately:

* this is neutral
* score does not decrease merely because recovery is absent

This corrects the V1 bias that penalized workers for being physically tired, soaked, or unable to continue after the event. The reviewer’s point is fully accepted here. 

---

### 9.7 Baseline Stability

High score if:

* the worker’s 8-week earnings in this slot are stable
* the time block has low variance
* the baseline is trustworthy

Low score if:

* earnings are extremely volatile
* no stable pattern exists
* the baseline is weak or noisy

A weak baseline should reduce confidence, not punish the worker.

---

### 9.8 Market Pulse

Market Pulse is a demand adjustment that prevents under-attribution on unusually strong earning days.

The idea:
if the whole zone is earning more than usual because of a real demand surge, the worker’s expected income should be adjusted upward before loss is measured.

MarketPulseFactor = zone_peer_earnings_during_window / historical_zone_peer_baseline

Use only verified active workers in the zone, and only if there are enough active workers to make the estimate credible.

Rules:

* if active verified workers in zone < 10, do not apply market pulse
* if demand data is inconsistent, do not apply market pulse
* market pulse can increase expected income, but must never be derived from suspicious or synthetic activity

This addresses the review’s “Market Pulse” criticism and prevents overpaying or underpaying on megadays such as major sports finals or festival surges. 

---

## 10. Causality Score Formula

CausalityScore =
Σ (Wi × Si)

Where:

* Wi is the weight of signal i
* Si is the normalized score of signal i

CausalityScore must be interpreted as event-link strength, not as payout percentage.

---

## 11. Layer 5 — Confidence and Data Integrity

Confidence is a quality gate, not a payout penalty.

This is the major correction from V1.

### 11.1 Confidence Formula

Confidence =
0.40 × data_completeness

* 0.30 × signal_consistency
* 0.30 × baseline_strength

---

### 11.2 Confidence Behavior

If Confidence ≥ 0.70:

* attribution may proceed to decisioning

If Confidence < 0.70:

* route to manual review
* do not reduce payout by multiplying by confidence

This fixes the double-penalty flaw identified in the review. The worker should not lose money because the platform’s data was incomplete or noisy. Confidence only decides whether the system is allowed to make an automated attribution decision. It does not haircut the loss.

---

## 12. Layer 6 — Loss Apportionment

AttributableLoss =
RawLoss × CausalityFactor

Where:

* CausalityFactor is derived from the CausalityScore
* Confidence is not multiplied into the loss
* Confidence is used only to allow or block automation

Recommended rule:

* if Confidence ≥ 0.70 and CausalityScore is strong, compute attributable loss
* if Confidence < 0.70, route to manual review
* if ExpectedIncome < minimum threshold, skip full attribution

### Attributable Loss Ratio

AttributableLossRatio =
AttributableLoss / ExpectedIncome

This ratio is for reporting and downstream analysis. It must not be used as a punitive multiplier on its own.

---

## 13. Layer 7 — Decision Engine

### Decision Tiers

| CausalityScore | Confidence | Status  | Action                               |
| -------------- | ---------- | ------- | ------------------------------------ |
| ≥ 0.75         | ≥ 0.70     | STRONG  | Auto-pass to payout                  |
| 0.50–0.74      | ≥ 0.70     | PARTIAL | Partial attribution, payout proceeds |
| 0.30–0.49      | any        | WEAK    | Manual review                        |
| < 0.30         | any        | NONE    | No event-linked loss                 |

### Automation Rule

If Confidence < 0.70:

* do not auto-finalize
* route to manual review
* preserve evidence bundle

This makes confidence a gatekeeper, not a discount factor.

---

## 14. Edge Case Handling

### 14.1 Worker inactive before event

If the worker had no genuine intent or historical habit for that slot, attribution should fall.

### 14.2 Event at shift start

If the event begins within 30 minutes of shift start, the worker is protected from being treated as voluntarily inactive.

### 14.3 Worker outside zone

If zone alignment fails, attribution should drop sharply.

### 14.4 No GPS

If GPS is missing, attribution is not auto-denied. Confidence drops and the case goes to review.

### 14.5 Recovery absent

No recovery evidence is neutral, not negative.

### 14.6 Demand spike day

Market pulse can raise expected income if and only if the zone peer data is credible.

### 14.7 Very small expected income

If ExpectedIncome < ₹50, skip full attribution and route to low-impact handling.

### 14.8 Platform outage mixed with weather

Split causality into separate components rather than assigning all loss to the weather event.

### 14.9 Multiple overlapping events

Split the window and attribute separately, then combine.

### 14.10 Zone-level synchronized behavior

If many workers show the same drop pattern, reduce confidence and route suspicious patterns into fraud review. Attribution should not try to solve organized fraud on its own. That belongs to Fraud Engine. 

---

## 15. Cause Breakdown

AttributionResult should be able to output a cause breakdown when more than one factor contributed to the loss.

Example:

CauseBreakdown {
rain: 0.60
platform_outage: 0.25
normal_demand_drop: 0.15
}

The sum of the breakdown should be 1.0 for the interpreted loss component.

This is important for cases where the event was real but not the only reason for the income drop.

---

## 16. Audit and Explanation System

Every Attribution decision must generate a complete audit bundle:

AttributionAudit {
worker_id
claim_id
zone_id
trigger_type
event_start
event_end
expected_income
actual_income
raw_loss
causality_score
confidence_score
market_pulse_factor
attributable_loss_amount
attributable_loss_ratio
signal_breakdown
reason_codes[]
reviewer_id
timestamp
}

Example reason codes:

* STRONG_TIME_ALIGNMENT
* HISTORICAL_INTENT_HIGH
* LOW_PRE_EVENT_ACTIVITY
* NO_ZONE_MATCH
* MARKET_PULSE_APPLIED
* MARKET_PULSE_SKIPPED_LOW_SAMPLE
* CONFIDENCE_BELOW_GATE
* EXPECTED_INCOME_BELOW_THRESHOLD

Workers and reviewers should be able to understand why the system reached a result without reading raw logs.

---

## 17. Integration With Other Modules

### From Trigger Engine

* confirmed event
* exposure score
* zone context
* TCS and US 

### From Premium Engine

* earnings baseline
* time-of-day profile
* weekly work pattern
* zone risk context 

### To Fraud Engine

* attributable loss
* causality score
* confidence score
* cause breakdown
* evidence bundle 

### To Payout Engine

* final attributable loss amount
* attribution status
* explanation codes

---

## 18. What Attribution Does Not Do

* does not detect triggers
* does not detect fraud
* does not price the policy
* does not auto-deny claims
* does not punish workers for system data gaps
* does not use demographic signals
* does not make confidence a payout haircut
* does not treat immediate recovery as mandatory
* does not rely on one weak signal alone

---

## 19. MVP vs Phase 3

| Component    | MVP                                  | Phase 3                      |
| ------------ | ------------------------------------ | ---------------------------- |
| Baseline     | Rule-based 8-week earnings model     | ML regression / causal model |
| Intent       | Historical intent rules              | Learned behavioral patterns  |
| Recovery     | Asymmetric heuristic                 | Survival / re-entry modeling |
| Market Pulse | Zone peer multiplier with guardrails | Dynamic demand forecasting   |
| Confidence   | Gatekeeper threshold                 | Bayesian uncertainty model   |
| Attribution  | Explainable weighted rules           | Hybrid causal ML             |

The MVP should stay rule-based. The purpose is auditability, competition readiness, and stable behavior with limited real-world data.

---

## 20. Final Summary

Attribution Engine V2 must do four things well:

1. estimate the worker’s expected income for the event window
2. measure actual income in the same window
3. decide how much of the loss was caused by the event
4. refuse to punish the worker when data is weak, noisy, or incomplete

This version fixes the main flaws called out in the review:

* confidence is no longer a penalty multiplier
* historical intent prevents ghost-shift false negatives
* recovery is positive-only
* market pulse adjusts for demand spikes
* minimum expected-income threshold avoids noisy micro-claims


