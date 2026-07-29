# Gamer Reset App — Architecture & Build Plan (v1 draft)

This turns the product/mechanics decisions into something Claude Code can actually build against. Nothing here is locked — it's a working spec to sanity-check before we start coding.

## Tech stack

- **React Native + Expo** — cross-platform (iOS + Android) from one codebase, well-suited to a mostly-prompted build, and Claude Code works well with it.
- **Local-first storage** (on-device DB, e.g. SQLite via Expo) for everything — schedules, check-ins, craving logs, relapse history. No account system, no server needed for the core product. This matches the "cheap to run, no ongoing cost" goal directly: nothing to host, nothing to maintain server-side.
- **One-time purchase via native App Store / Google Play IAP** — receipt validated on-device (standard IAP flow), no backend required for purchases either.
- **Push notifications** via Expo's notification service — locally scheduled based on the engine's own logic (end-of-day check-ins, slot reminders), not server-triggered.

Net effect: this can ship as a fully offline-capable app with no ongoing infrastructure cost, which matches "side business, not a SaaS empire" well.

## Core data model

**UserProfile** (from onboarding)
baseline_free_time_weekday, baseline_free_time_weekend (rough one-time estimates, not a detailed schedule — just enough to generate a real Day 1 plan), typical_free_windows (morning/afternoon/evening/night — rough shape of when free time usually falls), work_schedule_type (fixed / shift / irregular / variable), caregiving_flag, physical_limitations, gym_access, outdoor_access, kitchen_access, high_risk_windows[], living_situation

**DailyFreeTimeCheck** (recurring, lightweight — this is what actually drives Layer 1 each day)
date, response_type (same_as_usual / less / more), adjusted_hours + adjusted_window (only asked if less/more selected — a "same as usual" day only confirms hours match the baseline shape and needs no window input at all), source (auto-accepted baseline / manually adjusted)
Single-tap by default ("same as usual"); only becomes multi-tap when the day genuinely differs. This is what makes the engine accurate for variable schedules (students, shift work) without forcing detailed manual input on people with stable routines.

**Phase**
current_phase (reset / saturation / stabilisation / autonomy — *working names, not finalized, easy to revisit later*), phase_start_date

**DomainFloor** (per domain: Sleep, Move, Fuel, Connect, Build, Live)
weekly_minimum_requirements (e.g. Move: {low_intensity: Nx, high_intensity: Nx, strength: Nx}) — fixed/non-decreasing regardless of phase

**FoundationStatus** (per domain)
established_capacity (long-term demonstrated ability — never discounted by relapse)
current_activity_state (Restarted / Repeating / Established / Self-sustaining — this one *is* affected by relapse)

**ScheduleSlot**
date, time_window, domain, assigned_activity_id, status (pending / done / equivalent / missed / not_possible), phase_at_creation

**AssignmentLibrary** (authored together, offline — not a live LLM service inside the app)
id, domain, tags (equipment_needed, location, intensity, duration), description

**GamingControlStatus**
state (Reset active / In control / Under pressure / Lapse interrupted / Pattern returning / Recovery active / Self-sustaining), signal_log[] (derived from Live-substitution frequency, craving frequency/clustering, check-in gaps)

**CravingEvent**
timestamp, optional_trigger_tag (bored / stressed / saw game content / free time opened up)

**RelapseEvent**
date, severity (short_lapse / several_days / full_return), resulting_action

**NotificationSettings**
per-category intensity level (e.g. slot-level detail vs. end-of-day-only)

**PurchaseStatus**
is_unlocked (bool), purchase_date, platform

## Screens (v1 scope)

1. **Onboarding** — the ~8 constraint questions, single-select/tap only
2. **"I'm done. Reset me."** — the entry trigger screen
3. **Generated plan / Today view** — the day's slots, each showing domain + assignment
4. **Slot check-in** — Done / Equivalent / Missed / Not possible, with the "Is it, though?" honesty check on Equivalent
5. **Foundation overview** — per-domain progress state (Restarted → Self-sustaining)
6. **Gaming Control status** — current state + craving button (persistent, easy access)
7. **Relapse flow** — "I started gaming again" button + one-tap severity question
8. **Settings** — notification intensity, support-resource link, purchase/unlock status
9. **Paywall** — clearly separated from free flow, shown only when the free 72-hour Reset ends

*Deferred past v1:* Prestige Mode screens, full multi-week content breadth beyond the first Reset window.

## Build order (matches the "core loop first, narrow" plan)

**Stage 1 — Skeleton + engine logic (no real content yet)**
Data model, onboarding → Layer 1-4 engine logic (time budgeting → domain allocation → risk-window flagging → assignment slotting), using placeholder/dummy assignments so the mechanism is testable end-to-end.

**Stage 2 — Core daily loop**
Today view, check-in flow (Done/Equivalent/Missed/Not possible + honesty check), end-of-day notification logic.

**Stage 3 — Gaming Control + cravings + relapse**
Craving button, signal aggregation, relapse detection (explicit + silence-based), severity flow, recovery-campaign re-seeding logic.

**Stage 4 — Settings, notifications, purchase**
Notification intensity settings, IAP integration, paywall screen.

**Stage 5 — Content authoring**
Real assignment library replacing placeholders — this is where your domain expertise goes in, once the mechanism above is proven to work.

**Stage 6 — Prestige Mode + polish**

## Domain floors (draft, based on decisions so far)

- **Sleep**: ~8h/night target (allowing for individual variation)
- **Move — strength**: 12-20 sets per muscle group/week; likely split: 4x/week Upper/Lower (optional playful bonus session, e.g. a casual Saturday arm-focused session)
- **Move — cardio**: 8,000-12,000 daily step count, plus 1-2 additional cardio workouts/week (e.g. one hill sprint session + one jog/bike/swim session)
- **Fuel**: diet-style agnostic (no judgment on keto/carnivore/etc.); focus on calories relative to the person's goal (gain/loss), reducing excessive snacking, and a simple protein heuristic (~1g/lb bodyweight or current equivalent guideline) — no detailed macro tracking
- **Connect**: kept as its own (light) domain — floor: 1 meaningful contact/week minimum (call, in-person visit, phone-free time with partner/family/friend; brief digital pings like a Discord message or meme don't count — good candidate for the "Is it, though?" honesty check)
- **Build ("meaningful work")**: no prescribed content or tips — just protected time slots for something the person does for themselves (hobby project, side business, creative work, etc.), content-agnostic
- **Live**: catch-all for whatever else comes up in a week/month outside work, gaming, and the other domains — includes ordinary life events and family time, not just "fun activities"

## Foundation progression formula (draft)

Same timeline applied uniformly across all domains for MVP (complexity is situational/subjective per person, not a fixed property of a domain, so no domain gets a different clock):

- **Restarted**: days 0-4 of consistent execution
- **Repeating**: day ~4-21
- **Established**: day ~21-66
- **Self-sustaining**: 66+ days

Loosely grounded in habit-formation research (Lally et al., 2010) — median ~66 days to automaticity, with an early "conscious effort" phase (~first 3 weeks) and a transition phase after that. A single missed day should not reset progress or drop a domain back a stage — consistent with both the product's "no punishment for a single miss" principle and the research finding that isolated misses don't meaningfully disrupt habit formation.

## Onboarding question set (draft — all single-tap/multi-select, no typing)

1. **Work/study situation** (single-select)
   - Standard schedule (similar hours most days)
   - Shift work / rotating schedule
   - Student — varies a lot day to day
   - No fixed schedule

2. **Typical free time — weekday** (single-select)
   - Less than 2h / 2-4h / 4-6h / 6h+

3. **Typical free time — weekend** (single-select)
   - Less than 2h / 2-4h / 4-6h / 6h+

4. **When free time usually falls** (multi-select)
   - Morning / Afternoon / Evening / Night

5. **Caregiving responsibilities** (single-select)
   - None / Yes, regularly / Yes, occasionally

6. **Any physical limitations or injuries to work around?** (single-select)
   - None / Yes (flags the profile for lower-impact assignment matching — detail can be added later)

7. **Gym access** (single-select)
   - Yes, and I'll realistically use it / Yes, but I rarely go / No gym access

8. **Outdoor space accessible for activity?** (yes/no)

9. **Kitchen/cooking access?** (yes/no)

10. **Living situation** (single-select)
    - Live alone / With partner / With family / With roommates

11. **When does gaming usually take over?** (multi-select)
    - After work/school / Late at night / Weekends / Whenever free time opens up

This is the last open item — with this in place, the architecture doc is content-complete and ready to hand to Claude Code for Stage 1.

## Day structure: time-boxed vs. checklist domains (revised)

Not every domain should occupy a precise minute-slot on the timeline — assigning fake-precise durations to things like a quick errand or a phone call produced absurd results (e.g. "18min Connect"). Split:

- Time-boxed (real timeline windows, real durations): Sleep, Move, Build.
- Checklist-based (no assigned duration): Fuel, Connect, Maintain.
- Live is the open "flexible time" block itself, not its own line item.

## Navigation structure (as of claude/navigation-restructure)

Home (Foundation ring w/ stage name + weekly calendar strip + Next Up + domain shortcuts) -> Day Detail (per-day timeline, time-boxed blocks + flexible block + checklist) / Domain Detail (per-domain floor progress + Learn More placeholder) -> Gaming Control, Settings reachable via header links.
