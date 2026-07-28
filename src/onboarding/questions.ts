// Exact question set from ARCHITECTURE.md's "Onboarding question set" section.
// Every question is single-select or multi-select, no text input; each maps
// to one UserProfile field.
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
  field: string;
  prompt: string;
  type: QuestionType;
  options: QuestionOption<V>[];
}

export const ONBOARDING_QUESTIONS: QuestionConfig[] = [
  {
    field: 'workScheduleType',
    prompt: 'Work/study situation',
    type: 'single',
    options: [
      { label: 'Standard schedule (similar hours most days)', value: 'fixed' as WorkScheduleType },
      { label: 'Shift work / rotating schedule', value: 'shift' as WorkScheduleType },
      { label: 'Student — varies a lot day to day', value: 'student' as WorkScheduleType },
      { label: 'No fixed schedule', value: 'irregular' as WorkScheduleType },
    ],
  },
  {
    field: 'baselineFreeTimeWeekday',
    prompt: 'Typical free time — weekday',
    type: 'single',
    options: [
      { label: 'Less than 2h', value: 'lt2' as FreeTimeBand },
      { label: '2-4h', value: '2to4' as FreeTimeBand },
      { label: '4-6h', value: '4to6' as FreeTimeBand },
      { label: '6h+', value: '6plus' as FreeTimeBand },
    ],
  },
  {
    field: 'baselineFreeTimeWeekend',
    prompt: 'Typical free time — weekend',
    type: 'single',
    options: [
      { label: 'Less than 2h', value: 'lt2' as FreeTimeBand },
      { label: '2-4h', value: '2to4' as FreeTimeBand },
      { label: '4-6h', value: '4to6' as FreeTimeBand },
      { label: '6h+', value: '6plus' as FreeTimeBand },
    ],
  },
  {
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
    field: 'physicalLimitations',
    prompt: 'Any physical limitations or injuries to work around?',
    type: 'single',
    options: [
      { label: 'None', value: 'false' },
      { label: 'Yes', value: 'true' },
    ],
  },
  {
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
    field: 'outdoorAccess',
    prompt: 'Outdoor space accessible for activity?',
    type: 'single',
    options: [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
    ],
  },
  {
    field: 'kitchenAccess',
    prompt: 'Kitchen/cooking access?',
    type: 'single',
    options: [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
    ],
  },
  {
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
    outdoorAccess: get('outdoorAccess') === 'true',
    kitchenAccess: get('kitchenAccess') === 'true',
    livingSituation: get('livingSituation') as LivingSituation,
    highRiskWindows: getList('highRiskWindows') as GamingTrigger[],
  };
}
