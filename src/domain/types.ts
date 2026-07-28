// Core data model, mirroring ARCHITECTURE.md's "Core data model" section.
// Stage 1 only implements the fields needed to drive onboarding + the
// scheduling engine; GamingControlStatus/CravingEvent/RelapseEvent/
// NotificationSettings/PurchaseStatus are later-stage concerns and are
// intentionally omitted here.

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
