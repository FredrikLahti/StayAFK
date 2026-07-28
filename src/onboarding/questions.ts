// Question set derived from ARCHITECTURE.md's "Onboarding question set"
// section, since refined for clarity: Q1 reworded, weekday/weekend free-time
// reframed as an explicit pair, and outdoor/kitchen access dropped (low
// signal - most people have both, so layer4.ts now treats access as
// unconditionally available).
import {
  CaregivingLevel,
  DayPart,
  FreeTimeBand,
  GamingTrigger,
  GymAccess,
  LivingSituation,
  WorkScheduleType,
} from '../domain/types';

export type QuestionType = 'single' | 'multi';

export interface QuestionOption<V extends string> {
  label: string;
  value: V;
}

export interface QuestionConfig<V extends string = string> {
  kind: 'single' | 'multi';
  field: string;
  prompt: string;
  type: QuestionType;
  options: QuestionOption<V>[];
}

// Weekday/weekend free time are the same underlying question asked twice -
// presented as one paired step (a "Weekdays" / "Weekends" pair sharing the
// same option set) rather than two sequential, separate-feeling questions.
export interface PairedQuestionConfig<V extends string = string> {
  kind: 'paired';
  prompt: string;
  pairs: [
    { field: string; label: string; options: QuestionOption<V>[] },
    { field: string; label: string; options: QuestionOption<V>[] },
  ];
}

export type OnboardingStep = QuestionConfig | PairedQuestionConfig;

const FREE_TIME_OPTIONS: QuestionOption<FreeTimeBand>[] = [
  { label: 'Less than 2h', value: 'lt2' },
  { label: '2-4h', value: '2to4' },
  { label: '4-6h', value: '4to6' },
  { label: '6h+', value: '6plus' },
];

export const ONBOARDING_QUESTIONS: OnboardingStep[] = [
  {
    kind: 'single',
    field: 'workScheduleType',
    prompt: 'How is your regular week usually occupied?',
    type: 'single',
    options: [
      { label: 'Standard schedule (similar hours most days)', value: 'fixed' as WorkScheduleType },
      { label: 'Shift work / rotating schedule', value: 'shift' as WorkScheduleType },
      { label: 'Student — varies a lot day to day', value: 'student' as WorkScheduleType },
      { label: 'No fixed schedule', value: 'irregular' as WorkScheduleType },
    ],
  },
  {
    kind: 'paired',
    prompt: 'Typical free time',
    pairs: [
      { field: 'baselineFreeTimeWeekday', label: 'Weekdays', options: FREE_TIME_OPTIONS },
      { field: 'baselineFreeTimeWeekend', label: 'Weekends', options: FREE_TIME_OPTIONS },
    ],
  },
  {
    kind: 'multi',
    field: 'typicalFreeWindows',
    prompt: 'When free time usually falls',
    type: 'multi',
    options: [
      { label: 'Morning', value: 'morning' as DayPart },
      { label: 'Afternoon', value: 'afternoon' as DayPart },
      { label: 'Evening', value: 'evening' as DayPart },
      { label: 'Night', value: 'night' as DayPart },
    ],
  },
  {
    kind: 'single',
    field: 'caregivingFlag',
    prompt: 'Caregiving responsibilities',
    type: 'single',
    options: [
      { label: 'None', value: 'none' as CaregivingLevel },
      { label: 'Yes, regularly', value: 'regular' as CaregivingLevel },
      { label: 'Yes, occasionally', value: 'occasional' as CaregivingLevel },
    ],
  },
  {
    kind: 'single',
    field: 'physicalLimitations',
    prompt: 'Any physical limitations or injuries to work around?',
    type: 'single',
    options: [
      { label: 'None', value: 'false' },
      { label: 'Yes', value: 'true' },
    ],
  },
  {
    kind: 'single',
    field: 'gymAccess',
    prompt: 'Gym access',
    type: 'single',
    options: [
      { label: "Yes, and I'll realistically use it", value: 'yes_will_use' as GymAccess },
      { label: 'Yes, but I rarely go', value: 'yes_rarely' as GymAccess },
      { label: 'No gym access', value: 'none' as GymAccess },
    ],
  },
  {
    kind: 'single',
    field: 'livingSituation',
    prompt: 'Living situation',
    type: 'single',
    options: [
      { label: 'Live alone', value: 'alone' as LivingSituation },
      { label: 'With partner', value: 'partner' as LivingSituation },
      { label: 'With family', value: 'family' as LivingSituation },
      { label: 'With roommates', value: 'roommates' as LivingSituation },
    ],
  },
  {
    kind: 'multi',
    field: 'highRiskWindows',
    prompt: 'When does gaming usually take over?',
    type: 'multi',
    options: [
      { label: 'After work/school', value: 'after_work' as GamingTrigger },
      { label: 'Late at night', value: 'late_night' as GamingTrigger },
      { label: 'Weekends', value: 'weekends' as GamingTrigger },
      { label: 'Whenever free time opens up', value: 'free_time_opens_up' as GamingTrigger },
    ],
  },
];

// Answers are collected as raw strings (single) or string[] (multi) during
// the flow, then converted to the correctly-typed UserProfile fields here.
export function buildProfileFromAnswers(
  answers: Record<string, string | string[]>
): Omit<
  import('../domain/types').UserProfile,
  'id' | 'createdAt'
> {
  const get = (field: string) => answers[field] as string;
  const getList = (field: string) => (answers[field] as string[]) ?? [];

  return {
    workScheduleType: get('workScheduleType') as WorkScheduleType,
    baselineFreeTimeWeekday: get('baselineFreeTimeWeekday') as FreeTimeBand,
    baselineFreeTimeWeekend: get('baselineFreeTimeWeekend') as FreeTimeBand,
    typicalFreeWindows: getList('typicalFreeWindows') as DayPart[],
    caregivingFlag: get('caregivingFlag') as CaregivingLevel,
    physicalLimitations: get('physicalLimitations') === 'true',
    gymAccess: get('gymAccess') as GymAccess,
    highRiskWindows: getList('highRiskWindows') as GamingTrigger[],
    livingSituation: get('livingSituation') as LivingSituation,
  };
}
