// Core data model, mirroring ARCHITECTURE.md's "Core data model" section.

export type Domain = 'Sleep' | 'Move' | 'Fuel' | 'Connect' | 'Build' | 'Live' | 'Maintain';

export const ALL_DOMAINS: Domain[] = ['Sleep', 'Move', 'Fuel', 'Connect', 'Build', 'Live', 'Maintain'];

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
  outdoorAccess: boolean;
  kitchenAccess: boolean;
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

export interface ScheduleSlot {
  id: string;
  date: string;
  timeWindow: DayPart;
  domain: Domain;
  durationMinutes: number;
  assignedActivityId: string | null;
  // The AssignmentLibrary entry actually logged when status is 'equivalent'
  // (what the person substituted in, as opposed to assignedActivityId,
  // what the engine originally assigned). Null otherwise.
  equivalentActivityId: string | null;
  status: SlotStatus;
  phaseAtCreation: PhaseName;
}

export type EquipmentNeeded = 'none' | 'gym' | 'kitchen' | 'outdoor';
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
