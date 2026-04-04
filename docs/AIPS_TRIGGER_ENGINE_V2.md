# AIPS — Trigger Engine V2
## Condition Decider Module Specification (Accuracy-First Architecture)

> Part of the AIPS (Adaptive Income Protection System) architecture
> B2B2C Embedded Insurance for Q-Commerce Delivery Partners
> Replaces: Trigger Engine V1

---

## What Changed From V1

V1 used hard boolean conditions.
All signals had to pass simultaneously or the trigger was denied.
One failed API call, one offline sensor, one GPS glitch — worker gets nothing.
At lakhs of workers across multiple cities, silent failures become a daily occurrence.
That is not acceptable.

V2 replaces hard conditions with a confidence-based evidence system.
Missing data degrades confidence. It does not kill the claim.
Conflicting data routes to review. It does not auto-deny.
Every decision is traceable, weighted, and auditable.

The core principle of V2:

> A worker should never lose a valid payout because our infrastructure had a bad day.

---

## What This Module Does

The Trigger Engine answers one question:

**Did a qualifying disruption happen, and was this worker genuinely exposed to it?**

It does NOT decide payout amounts. That is the Payout Engine.
It does NOT decide if the loss was caused by the event. That is the Attribution Engine.
It does NOT decide if the claim is fraudulent. That is the Fraud Engine.

The Trigger Engine produces one output per worker per event:

```
TriggerDecision {
    decision:     AUTO_APPROVE | AUTO_APPROVE_LOW_CONFIDENCE | MANUAL_REVIEW | REJECT
    TCS:          float (0.0 – 1.0)
    US:           float (0.0 – 1.0)
    event_record: full evidence bundle for audit
}
```

This output is passed downstream to the Attribution Engine.

---

## Design Principle: Discrete Events Only

AIPS insures disruptions. Not discomfort.

The Trigger Engine only fires on events that are:
- **Discrete** — clear start and end time
- **Externally verifiable** — confirmed by at least one reliable third-party source
- **Zone-specific** — confirmed at or near the worker's dark store zone
- **Not chronic** — a condition that exists every day is not an insurable event

**AQI and heat are not standalone triggers in the MVP.**

AQI 400 in Delhi in November is not an event. It is a season.
Standalone AQI payouts would fire daily. No premium model survives that.
AQI and heat become payout modifiers in Phase 2 — they increase payout when
combined with a genuine trigger. They never fire alone.

---

## The Three MVP Triggers

1. Heavy Rain
2. Internet Shutdown
3. Curfew / Zone Closure

---

## Data Sources

| Source | What It Provides | Reliability Class |
|---|---|---|
| Dark-store IoT sensor | Local rainfall at zone level | Primary (0.90) |
| OpenWeather One Call API | Rainfall, temperature, humidity | Secondary (0.70) |
| Neighbor zone IoT sensors | Rain confirmation from adjacent zones | Derived (0.65) |
| SFLC.in RSS feed | District-level shutdown records | Primary (0.85) |
| App heartbeat signal | Worker connectivity state per pin code | Derived (0.75) |
| Platform zone status API | Zone closure / curfew flags | Primary (0.88) |
| CAQM / state DM scrapers | Official curfew / GRAP notifications | Secondary (0.60) |

Reliability classes are not fixed. They adjust dynamically based on freshness
and consistency with other sources, as described in the Reliability Layer below.

---

## Architecture: Seven Layers

```
Layer 1 — Data Ingestion
Layer 2 — Signal Normalization
Layer 3 — Reliability Scoring
Layer 4 — Trigger Confidence Score (TCS)
Layer 5 — Uncertainty Score (US)
Layer 6 — Decision Engine
Layer 7 — Audit and Watchdog
```

Each layer is described in full below.

---

## Layer 1 — Data Ingestion

### Polling Architecture: Hybrid

V1 used pure 15-minute polling for everything.
V2 uses a hybrid model because not all signals change at the same rate.

| Source | Architecture | Reason |
|---|---|---|
| IoT sensors | MQTT real-time streaming | Physical events can change in under 2 minutes |
| OpenWeather API | 15-minute polling | API cost and rate limits |
| SFLC.in RSS | 10-minute polling | Shutdowns are not instantaneous |
| Platform zone API | Event-driven webhook | Platform pushes on change |
| App heartbeat | Continuous (5-min ping) | Connectivity detection needs recency |
| CAQM scraper | 30-minute polling | Official notifications move slowly |

IoT sensors stream via MQTT to a Redis pub/sub channel.
When a sensor reading crosses a soft threshold, the engine wakes immediately
rather than waiting for the next polling cycle.

All ingested signals are timestamped at ingestion time.
Staleness is tracked from this timestamp, not from the source's internal time.

---

## Layer 2 — Signal Normalization

All signals must be converted to a common 0.0–1.0 scale before they can be
combined. Raw mm/hour and raw AQI and raw boolean flags cannot be added together.

### Rain normalization

```
normalizeRain(rain_mm, threshold):
    if rain_mm >= threshold × 1.5:  return 1.0
    if rain_mm <= threshold × 0.5:  return 0.0
    return (rain_mm - 0.5 × threshold) / threshold
```

This gives a smooth gradient:
- Well above threshold → strong signal (1.0)
- At threshold → moderate signal (0.5)
- Well below threshold → weak signal (0.0)
- Avoids the cliff edge where 4.9mm and 5.1mm produce opposite outcomes

### City-specific thresholds

| City | Threshold |
|---|---|
| Delhi | 5 mm/hr |
| Bengaluru | 6 mm/hr |
| Hyderabad | 7 mm/hr |
| Mumbai | 10 mm/hr |

Thresholds are calibrated against urban drainage failure data per city.
A single national threshold would trigger false payouts in Mumbai
or miss real events in Delhi.

### Temporal smoothing

A 10-minute spike of heavy rain is not the same as 2 hours of sustained rain.
Raw instantaneous readings must be smoothed before normalization.

```
smoothed_rain = moving_average(rain_readings, window=30_minutes)
               + (intensity_weight × peak_reading_in_window)
```

The smoothed value is what gets normalized — not the instantaneous reading.
This prevents a brief spike from triggering a full payout.

### Shutdown normalization

Shutdown signals are semi-boolean but weighted by evidence quality:

```
normalizeShutdown(sflc_confirmed, heartbeat_ratio, neighboring_area_silent):
    score = 0.0
    if sflc_confirmed:        score += 0.5
    if heartbeat_ratio > 0.7: score += 0.3
    if neighboring_silent:    score += 0.2
    return min(score, 1.0)
```

### Zone closure normalization

```
normalizeClosure(platform_flag, official_notification, scraper_hit):
    score = 0.0
    if platform_flag:          score += 0.5
    if official_notification:  score += 0.4
    if scraper_hit:            score += 0.1
    return min(score, 1.0)
```

---

## Layer 3 — Reliability Scoring

Not all sources are equally trustworthy.
An IoT sensor reading from 2 minutes ago is not the same as an OpenWeather
interpolation from 18 minutes ago.

Reliability is computed dynamically for each signal at the time of evaluation.

### Reliability formula

```
reliability(signal) = base_reliability × freshness(signal) × consistency(signal)
```

### Base reliability (static per source)

| Source | Base Reliability |
|---|---|
| IoT sensor (online) | 0.90 |
| IoT sensor (offline) | 0.00 |
| OpenWeather | 0.70 |
| Neighbor zone IoT | 0.65 |
| SFLC.in RSS | 0.85 |
| App heartbeat | 0.75 |
| Platform zone API | 0.88 |
| CAQM scraper | 0.60 |

### Freshness scoring

```
freshness(minutes_since_update):
    if minutes_since_update < 5:   return 1.0
    if minutes_since_update > 30:  return 0.5
    return 1.0 - (minutes_since_update / 60.0)
```

A signal that has not updated in over 30 minutes is treated as half as reliable.

### Consistency scoring

Compare each signal to the others in the same category:

```
consistency(signal_value, other_signal_values):
    mean = average(other_signal_values)
    diff = abs(signal_value - mean)
    return max(0.0, 1.0 - diff)
```

A signal that contradicts all others gets a low consistency score.
It still contributes to TCS — but with reduced weight.

### When a source goes offline

If the IoT sensor is offline, its reliability drops to 0.0.
Its weight is redistributed proportionally to the remaining active sources.

```
redistribute_weights(signals, weights):
    total_available_weight = sum(weights[i] for i available signals)
    for each available signal i:
        adjusted_weight[i] = weights[i] / total_available_weight
```

This is the fail-open mechanism.
Missing data degrades confidence. It does not kill the claim.

---

## Layer 4 — Trigger Confidence Score (TCS)

TCS is the core output of the engine.
It is a single number from 0.0 to 1.0 expressing how confident the system is
that a qualifying disruption occurred for this worker in this zone.

### Formula

```
TCS = Σ (Wi × Si × Ri) / Σ (Wi × Ri)
```

Where:
- Wi = weight of signal i
- Si = normalized signal value (0.0–1.0)
- Ri = reliability score (0.0–1.0)

### Default signal weights for rain trigger

| Signal | Weight |
|---|---|
| IoT sensor (local) | 0.40 |
| OpenWeather | 0.25 |
| Neighbor zone IoT | 0.15 |
| Historical zone pattern | 0.10 |
| Order volume drop signal | 0.10 |

Note on order volume:
Order volume drop is one signal among many — not a hard requirement.
If orders held steady during a rain event, this signal reduces TCS slightly.
It does not veto the trigger.
This preserves parametric speed while still incorporating real income signals.

### Pseudo-code

```
computeTCS(signals, weights):
    numerator = 0.0
    denominator = 0.0

    for i in range(len(signals)):
        if not signals[i].available:
            continue
        numerator   += weights[i] × signals[i].value × signals[i].reliability
        denominator += weights[i] × signals[i].reliability

    if denominator == 0:
        return 0.0

    return numerator / denominator
```

### Worked example — Scenario: Strong rain, sensor online

| Signal | Raw | Normalized | Reliability | Weight |
|---|---|---|---|---|
| IoT | 8 mm | 1.00 | 0.90 | 0.40 |
| OpenWeather | 7 mm | 0.90 | 0.70 | 0.25 |
| Neighbor | 6 mm | 0.70 | 0.65 | 0.15 |
| Historical | consistent | 0.80 | 0.70 | 0.10 |
| Order drop | 25% drop | 0.70 | 0.75 | 0.10 |

TCS ≈ 0.88 → AUTO APPROVE

### Worked example — Scenario: Sensor offline, API moderate

| Signal | Raw | Normalized | Reliability | Weight |
|---|---|---|---|---|
| IoT | offline | — | 0.00 | redistributed |
| OpenWeather | 7 mm | 0.90 | 0.70 | 0.42 (after redistribution) |
| Neighbor | 6 mm | 0.70 | 0.65 | 0.25 |
| Historical | consistent | 0.80 | 0.70 | 0.17 |
| Order drop | 20% drop | 0.60 | 0.75 | 0.17 |

TCS ≈ 0.76 → AUTO APPROVE

The worker still gets paid. The sensor going offline is our infrastructure problem,
not the worker's problem.

### Worked example — Scenario: Conflicting signals

| Signal | Raw | Normalized | Reliability |
|---|---|---|---|
| IoT | 8 mm | 1.00 | 0.90 |
| OpenWeather | 2 mm | 0.10 | 0.70 |
| Neighbor | 2 mm | 0.10 | 0.65 |

TCS ≈ 0.55 → MANUAL REVIEW

Conflict does not auto-deny. It escalates to a human who sees the full evidence.

---

## Layer 5 — Uncertainty Score (US)

TCS tells us the signal strength. US tells us how much we should trust that number.

A TCS of 0.72 with low uncertainty is more reliable than a TCS of 0.80 with
high uncertainty from conflicting, stale, or missing data.

### Formula

```
US = (0.4 × missing_ratio)
   + (0.3 × signal_variance)
   + (0.3 × (1 - avg_reliability))
```

Where:
- missing_ratio = number of unavailable signals / total signals
- signal_variance = variance of all normalized signal values
- avg_reliability = mean reliability across all available signals

### Pseudo-code

```
computeUncertainty(signals):
    total = len(signals)
    missing = sum(1 for s in signals if not s.available)
    available = [s for s in signals if s.available]

    values        = [s.value for s in available]
    reliabilities = [s.reliability for s in available]

    missing_ratio   = missing / total
    mean_val        = average(values)
    variance        = average((v - mean_val)^2 for v in values)
    avg_reliability = average(reliabilities)

    return 0.4 × missing_ratio
         + 0.3 × variance
         + 0.3 × (1 - avg_reliability)
```

### US interpretation

| US | Meaning |
|---|---|
| < 0.20 | High confidence in TCS value |
| 0.20 – 0.40 | Moderate confidence — acceptable |
| 0.40 – 0.60 | Low confidence — flag for review |
| > 0.60 | Very uncertain — do not auto-approve regardless of TCS |

---

## Layer 6 — Decision Engine

TCS and US are combined to produce the final trigger decision.

### Decision matrix

| TCS | US | Decision |
|---|---|---|
| > 0.75 | < 0.30 | AUTO_APPROVE |
| > 0.65 | < 0.50 | AUTO_APPROVE_LOW_CONFIDENCE |
| 0.50 – 0.75 | any | MANUAL_REVIEW |
| < 0.50 | > 0.60 | REJECT |
| < 0.50 | < 0.30 | LOW_IMPACT (reduced payout, routed for review) |

### Pseudo-code

```
decide(TCS, US):
    if TCS > 0.75 and US < 0.30:
        return AUTO_APPROVE

    if TCS > 0.65 and US < 0.50:
        return AUTO_APPROVE_LOW_CONFIDENCE

    if TCS >= 0.50:
        return MANUAL_REVIEW

    if TCS < 0.50 and US > 0.60:
        return REJECT

    return LOW_IMPACT
```

### What each decision means downstream

**AUTO_APPROVE:**
Full payout calculation proceeds immediately.
Audit log is written. No human required.

**AUTO_APPROVE_LOW_CONFIDENCE:**
Payout calculation proceeds but with a confidence-scaled payout modifier.
Payout Engine reduces the payout by a defined percentage (e.g. 80% of full value).
Audit log flagged for post-event review.

**MANUAL_REVIEW:**
Event record is routed to a human reviewer with full evidence bundle.
Reviewer sees: TCS, US, all signal values, reliability scores, conflict flags.
Reviewer has a defined time window to decide (4 hours).
If no decision is made in time, system defaults to auto-approve at low confidence.
Worker is notified that review is in progress.

**REJECT:**
No payout. Reason code is recorded.
Worker can appeal. Appeal routes to manual review.

**LOW_IMPACT:**
Event occurred but was minor. A reduced payout may apply.
Routes to Attribution Engine for income drop confirmation before any payout.

---

## Trigger 1 — Heavy Rain: Full Signal Stack

```
Rain Trigger signals:
  S1 = normalizeRain(IoT_reading, city_threshold)          weight=0.40
  S2 = normalizeRain(OpenWeather_reading, city_threshold)  weight=0.25
  S3 = normalizeRain(neighbor_IoT_avg, city_threshold)     weight=0.15
  S4 = historical_zone_pattern_score                       weight=0.10
  S5 = order_volume_drop_signal                            weight=0.10

TCS = computeTCS([S1..S5], weights)
US  = computeUncertainty([S1..S5])
decision = decide(TCS, US)
```

Duration classification (passed to Payout Engine):

| Smoothed Duration | Classification |
|---|---|
| Under 2 hours | Minor |
| 2–4 hours | Moderate |
| 4+ hours, peak overlap | Major |
| All-day zone impact | Severe |

Peak-hour overlap flag:
The engine checks whether the event duration overlaps the worker's personal
earning heatmap (from Premium Engine data).
If yes, peak_overlap = true is included in the event record.
The Payout Engine uses this to apply time-of-day weighting.

---

## Trigger 2 — Internet Shutdown: Full Signal Stack

```
Shutdown Trigger signals:
  S1 = sflc_confirmed (boolean → 0.0 or 1.0)              weight=0.45
  S2 = heartbeat_silence_ratio (% of workers silent)       weight=0.30
  S3 = neighboring_area_active (inverse — silent=1.0)      weight=0.15
  S4 = historical_shutdown_pattern_for_district            weight=0.10

TCS = computeTCS([S1..S4], weights)
US  = computeUncertainty([S1..S4])
decision = decide(TCS, US)
```

Pre-announced shutdown rule:
If a shutdown was officially announced more than 6 hours before it starts,
workers who were inactive in the 3 days prior are flagged for fraud review.
This closes the "sign up before an announced shutdown" loophole.

Duration handling:
Partial (2–6 hrs) → standard payout
Extended (6–12 hrs) → full daily payout
Multi-day → capped at weekly ceiling

---

## Trigger 3 — Curfew / Zone Closure: Full Signal Stack

```
Closure Trigger signals:
  S1 = platform_zone_flag (0.0 or 1.0)                    weight=0.50
  S2 = official_notification_confirmed (0.0 or 1.0)       weight=0.35
  S3 = scraper_hit_score                                   weight=0.15

TCS = computeTCS([S1..S3], weights)
US  = computeUncertainty([S1..S3])
decision = decide(TCS, US)
```

The platform zone flag carries the highest weight here because the platform
has the most direct operational knowledge of whether a zone is closed.
The platform also has contractual accountability for accuracy.

Scraper limitations are acknowledged:
Government notifications in India are inconsistent and non-machine-readable.
In the MVP, the scraper covers CAQM and state DM sites.
Production reliability improves with a direct platform data partnership.

---

## Worker Exposure Scoring

When a trigger fires for a zone, the engine scores each worker's exposure.
This replaces the V1 boolean check (was worker logged in: yes/no).

### Exposure Score formula

```
ExposureScore = (0.40 × activity_level)
              + (0.30 × gps_confidence)
              + (0.30 × recent_orders_ratio)
```

Where:
- activity_level: normalized active hours in the event window vs baseline
- gps_confidence: how consistently GPS placed the worker in zone
- recent_orders_ratio: orders attempted in last hour before trigger / baseline

### Exposure score outcomes

| Score | Outcome |
|---|---|
| > 0.70 | Full payout calculation proceeds |
| 0.40 – 0.70 | Partial payout (scaled by exposure score) |
| < 0.40 | Routed to manual review |

### Active window rule

A worker who took a break 45 minutes before the trigger is still considered active.
Normal breaks within a shift window are not treated as inactivity.
The engine uses a rolling 90-minute activity window, not an instantaneous check.

### GPS missing

If GPS data is unavailable for the event window, exposure score is reduced but
not zeroed. Platform login + order history can partially substitute.
GPS-missing events are flagged in the audit trail and routed to manual review.

---

## Layer 7 — Audit Trail and Watchdog

### Audit record per event per worker

Every trigger evaluation produces a complete audit record:

```
AuditRecord {
    worker_id
    zone_id
    trigger_type
    event_start
    event_end
    all_signal_values_at_evaluation_time
    all_reliability_scores
    TCS
    US
    exposure_score
    decision
    reason_code
    peak_overlap_flag
    anomaly_flags[]
    reviewer_id (if manual review)
    timestamp
}
```

This record is stored in TimescaleDB.
In Phase 3, it is hashed and written to Polygon blockchain via Chainlink oracle.
Once written on-chain, it cannot be altered.
The insurer cannot retroactively claim a threshold was not crossed.

### Watchdog system

The watchdog monitors infrastructure health continuously.

It checks:
- IoT sensor uptime per zone
- API response latency per source
- Heartbeat data gaps per pin code
- Scraper failure rates

If a sensor or API fails:
- Watchdog raises a System Risk Event
- Affected zone is flagged
- Trigger threshold for that zone is adjusted conservatively
- All decisions in that zone are routed to manual review until source recovers

If the watchdog detects mass silence across many zones simultaneously
(possible infrastructure failure on AIPS side):
- All pending trigger evaluations are paused
- Engineering alert is raised
- No claims are denied during the pause
- Workers are notified of a system check in progress

This prevents mass wrongful denials due to AIPS infrastructure failure.

---

## Tampering Detection

For IoT sensors specifically, the dual-source model enables tampering detection.

```
if IoT_reading < (city_threshold × 0.3)
   AND OpenWeather_reading > city_threshold
   AND neighbor_IoT_avg > city_threshold:
       raise SensorAnomalyFlag
       route to manual review
       log for compliance audit
```

If a dark store operator tampers with their rain gauge to suppress trigger events,
the discrepancy with OpenWeather and neighboring sensors flags it immediately.

Flagged tamper events are escalated to the compliance team.
Confirmed tampering is a contractual breach by the platform.
In Phase 3, tamper-evident sensor logs are written on-chain.

---

## Edge Cases

| Situation | Handling |
|---|---|
| Rain stops and restarts within 90 minutes | Treated as one continuous event |
| Worker moves between zones during event | Primary zone at trigger start is used |
| IoT sensor offline | Weight redistributed; OpenWeather + neighbor become primary |
| SFLC.in RSS delayed | Heartbeat signal triggers provisional event pending RSS confirmation |
| Platform zone flag conflicts with external data | External data takes precedence; conflict logged |
| Two triggers fire simultaneously | Both events logged separately; payouts combined but capped at weekly ceiling |
| Worker has no GPS data | Exposure score reduced; event routed to manual review |
| All sources below threshold but consistent | TCS low, US low → LOW_IMPACT decision |
| Worker on break before trigger | 90-minute activity window keeps them eligible |
| Zone has fewer than 5 active workers | Attribution Engine falls back to city-level cohort |
| Stacked micro-events in same window | Combined into single event record if gap < 90 minutes |

---

## 10 Simulated Scenarios (Delhi, Rain Trigger, Threshold = 5mm/hr)

These scenarios validate the TCS + decision logic against real-world conditions.

| # | IoT | OW | Neighbor | Order drop | TCS (approx) | Decision |
|---|---|---|---|---|---|---|
| 1 | 8mm | 7mm | 6mm | 25% | 0.88 | AUTO_APPROVE |
| 2 | 8mm | 4mm | 3mm | 10% | 0.62 | MANUAL_REVIEW |
| 3 | offline | 7mm | 6mm | 20% | 0.76 | AUTO_APPROVE |
| 4 | 2mm | 2mm | 1mm | 0% | 0.05 | REJECT |
| 5 | 5mm | 5mm | 4mm | 15% | 0.50 | MANUAL_REVIEW |
| 6 | 8mm | 2mm | 2mm | 5% | 0.52 | MANUAL_REVIEW |
| 7 | 6mm | 6mm | 6mm | 20% | 0.72 | MANUAL_REVIEW / borderline AUTO |
| 8 | 2mm | 3mm | 7mm | 30% | 0.44 | LOW_IMPACT |
| 9 | 4mm | 4mm | 4mm | 5% | 0.30 | REJECT |
| 10 | 7mm | 7mm | 7mm | 35% | 0.88 | AUTO_APPROVE |

Observations:
- System never crashes from missing data (Scenario 3)
- Conflicting signals always route to review, never auto-deny (Scenarios 2, 6)
- Borderline cases exist at the 0.50–0.75 range (Scenarios 5, 7) — this is expected and tunable
- Weak neighbor-only signal does not auto-trigger (Scenario 8) — correct

---

## What This Engine Does NOT Do

- Does not fire on AQI or heat alone in MVP
- Does not auto-deny if one signal is missing
- Does not treat all signals as equal weight
- Does not make payout amount decisions
- Does not run fraud detection
- Does not re-trigger for the same continuous event per polling cycle
- Does not allow retroactive trigger claims

---

## Phase 3 Upgrades

| Feature | MVP | Phase 3 |
|---|---|---|
| Thresholds | Rule-based, static per city | ML-adaptive per zone based on real claim outcomes |
| TCS weights | Rule-based, tuned manually | Learned from historical event data |
| IoT sensors | Installed at dark stores | Tamper-evident, on-chain logging via Chainlink |
| Attribution | Separate engine | Tighter feedback loop into TCS |
| Fraud signals | Separate engine | Partial integration into TCS uncertainty layer |
| Prediction | None | Pre-staging payout validation on forecast events |

---

## Summary

| | V1 | V2 |
|---|---|---|
| Condition logic | Hard boolean AND | Confidence scoring (TCS) |
| Missing data | Claim denied | Weight redistributed |
| Conflicting data | Unpredictable | Manual review with full evidence |
| Sensor failure | Silent denial | Watchdog + fallback weights |
| Exposure check | Boolean login/GPS | Scored: activity + GPS + orders |
| Uncertainty | Not modeled | Explicit US score |
| Audit | Basic log | Full evidence bundle per decision |
| Tampering | Not detected | Dual-source cross-check + flag |

---

*AIPS Trigger Engine V2 — Module Specification*
*Part of AIPS: Adaptive Income Protection System*
*Guidewire DEVTrails 2026*
