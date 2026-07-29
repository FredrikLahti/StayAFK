// Core data model, mirroring ARCHITECTURE.md's "Core data model" section.

export type Domain = 'Sleep' | 'Move' | 'Fuel' | 'Connect' | 'Build' | 'Live' | 'Maintain';

export const ALL_DOMAINS: Domain[] = ['Sleep', 'Move', 'Fuel', 'Connect', 'Build', 'Live', 'Maintain'];

// Per the "Day structure: time-boxed vs. checklist domains" split: Sleep,
// Move, and Build get real minute-duration windows placed on the timeline.
// Fuel, Connect, and Maintain no longer get a duration or time window at
// all - they're a day-level checklist, still gated by their existing
// floor/frequency rules for whether they're due (see engine/checklist.ts),
// just without a fake duration attached. Live isn't in either list - it's
// no longer an assignable domain, replaced by the single 'flexible' slot
// that stands in for whatever free time is left over (see SlotKind).
export const TIMEBOXED_DOMAINS: Domain[] = ['Sleep', 'Move', 'Build'];
export const CHECKLIST_DOMAINS: Domain[] = ['Fuel', 'Connect', 'Maintain'];

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export const DAY_PARTS: DayPart[] = ['morning', 'afternoon', 'evening', 'night'];

// Onboarding buckets for "typical free time" questions.
export type FreeTimeBand = 'lt2' | '2to4' | '4to6' | '6plus';

export type WorkScheduleType = 'fixed' | 'shift' | 'student' | 'irregular';

export type CaregivingLevel = 'none' | 'regular' | 'occasional';

export type GymAccess = 'yes_will_use' | 'yes_rarely' | 'none';

export type LivingSituation = 'alone' | 'partner' | 'family' | 'roommates';

export type GamingTrigger = 'after_work' | 'late_night' | 'weekends' | 'free_time_opens_up';

export interface UserProfile {
  id: string;
  baselineFreeTimeWeekday: FreeTimeBand;
  baselineFreeTimeWeekend: FreeTimeBand;
  typicalFreeWindows: DayPart[];
  workScheduleType: WorkScheduleType;
  caregivingFlag: CaregivingLevel;
  physicalLimitations: boolean;
  gymAccess: GymAccess;
  highRiskWindows: GamingTrigger[];
  livingSituation: LivingSituation;
  createdAt: string;
}

export type FreeTimeResponseType = 'same_as_usual' | 'less' | 'more';
export type FreeTimeSource = 'auto_baseline' | 'manual';

export interface DailyFreeTimeCheck {
  date: string; // ISO yyyy-mm-dd
  responseType: FreeTimeResponseType;
  adjustedHours?: FreeTimeBand;
  adjustedWindows?: DayPart[];
  source: FreeTimeSource;
}

export type PhaseName = 'reset' | 'saturation' | 'stabilisation' | 'autonomy';

export interface Phase {
  currentPhase: PhaseName;
  // Full ISO timestamp (date + time), not just a date - the free trial is
  // anchored to this exact moment so everyone gets a full 72 hours
  // regardless of what time of day they start.
  phaseStartDate: string;
}

export interface DomainFloor {
  domain: Domain;
  weeklyMinimumMinutes: number;
  minSessionsPerWeek: number;
  notes: string;
}

export type ActivityState = 'restarted' | 'repeating' | 'established' | 'self_sustaining';

export interface FoundationStatus {
  domain: Domain;
  establishedCapacityMinutes: number;
  currentActivityState: ActivityState;
  consecutiveDays: number;
}

export type SlotStatus = 'pending' | 'done' | 'equivalent' | 'missed' | 'not_possible';

// 'timeboxed': a real minute-duration window placed in a specific DayPart
// (Sleep/Move/Build). 'checklist': a day-level item with no duration or
// window (Fuel/Connect/Maintain). 'flexible': the single open-time region
// (domain 'Live') standing in for whatever's left after the timeboxed
// blocks are placed - replaces the old per-window Live filler slot.
export type SlotKind = 'timeboxed' | 'checklist' | 'flexible';

export interface ScheduleSlot {
  id: string;
  date: string;
  kind: SlotKind;
  // Only set for 'timeboxed' slots - checklist items and the flexible
  // block aren't tied to one specific time of day.
  timeWindow: DayPart | null;
  domain: Domain;
  // Only set for 'timeboxed' and 'flexible' slots - checklist items have no
  // duration attached at all.
  durationMinutes: number | null;
  assignedActivityId: string | null;
  // The AssignmentLibrary entry actually logged when status is 'equivalent'
  // (what the person substituted in, as opposed to assignedActivityId,
  // what the engine originally assigned). Null otherwise.
  equivalentActivityId: string | null;
  status: SlotStatus;
  phaseAtCreation: PhaseName;
}

export type EquipmentNeeded = 'none' | 'gym' | 'kitchen' | 'outdoor' | 'bike' | 'pool';
export type ActivityLocation = 'home' | 'gym' | 'outdoor' | 'anywhere';
export type ActivityIntensity = 'low' | 'moderate' | 'high';

export interface AssignmentTags {
  equipmentNeeded: EquipmentNeeded;
  location: ActivityLocation;
  intensity: ActivityIntensity;
  durationMinutes: number;
}

// Ordinal tier used by the check-in honesty check to compare a claimed
// "Equivalent" substitution against what was originally assigned - distinct
// from AssignmentTags.intensity, which drives Layer 4's feasibility
// matching (e.g. excluding high-intensity picks for physical limitations).
export type IntensityTier = 'low' | 'moderate' | 'high';

export interface AssignmentLibraryEntry {
  id: string;
  domain: Domain;
  tags: AssignmentTags;
  intensityTier: IntensityTier;
  description: string;
  // Shown alongside the "Is it, though?" honesty check when a time-boxed
  // activity is logged as Equivalent - what the originally-assigned
  // activity should generally feel like, so the person can self-judge
  // their substitution against something concrete rather than the app
  // trying to categorize the substitution itself.
  expectedFeeling?: string;
  // Optional equipment-alternative or other practical substitution note.
  substitutionNote?: string;
}

// Full state list per ARCHITECTURE.md. Stage 3 (explicit-trigger scope) only
// ever produces 'in_control' (the starting state) and, via relapse,
// 'lapse_interrupted' / 'recovery_active'. 'under_pressure',
// 'pattern_returning', and 'self_sustaining' all depend on behavioral signal
// derivation (Live-substitution frequency, craving clustering, check-in
// gaps), which is explicitly out of scope for this pass.
export type GamingControlState =
  | 'reset_active'
  | 'in_control'
  | 'under_pressure'
  | 'lapse_interrupted'
  | 'pattern_returning'
  | 'recovery_active'
  | 'self_sustaining';

export interface GamingControlStatus {
  state: GamingControlState;
  // Placeholder for now per Stage 3 scope - real signal derivation
  // (Live-substitution frequency, craving clustering, check-in gaps) is a
  // later stage.
  signalLog: string[];
}

export type CravingTriggerTag = 'bored' | 'stressed' | 'saw_game_content' | 'free_time_opened_up';

export interface CravingEvent {
  id: string;
  timestamp: string; // ISO datetime
  // Not collected by Stage 3's single-tap button (no follow-up question
  // yet), but present in the data model for when that's added.
  triggerTag?: CravingTriggerTag;
}

export type RelapseSeverity = 'short_lapse' | 'several_days' | 'full_return';

export interface RelapseEvent {
  id: string;
  date: string; // ISO yyyy-mm-dd
  severity: RelapseSeverity;
  // The GamingControlState the relapse resolved into.
  resultingAction: GamingControlState;
}

// A simple overall level rather than true per-category granularity - Stage
// 4 explicitly allows this simplification ("a simple overall level if
// per-category is overkill for now").
export type NotificationIntensity = 'minimal' | 'detailed';

export interface NotificationSettings {
  intensity: NotificationIntensity;
  // Set when the person responds "I'm good, don't need this" to the
  // silence-based life-check message - stops all future local
  // notifications without forcing an uninstall.
  notificationsPaused: boolean;
}

export type PurchasePlatform = 'ios' | 'android' | 'web';

export interface PurchaseStatus {
  isUnlocked: boolean;
  purchaseDate: string | null;
  platform: PurchasePlatform | null;
}

// Tracks the one-time motivational nudge shown either when a craving-based
// spike is detected (gamingcontrol/cravingSpike.ts) or, as a backstop for
// people who don't use the craving button much, a fixed-timeline fallback
// (gamingcontrol/fallbackNudge.ts). Persisted so the nudge never repeats
// once acknowledged.
export interface MotivationalNudgeStatus {
  lastSpikeNudgeShownAt: string | null; // ISO datetime
  fallbackNudgeShown: boolean;
}
