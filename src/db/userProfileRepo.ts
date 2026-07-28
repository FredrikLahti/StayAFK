import { getDb } from './client';
import { UserProfile } from '../domain/types';

const CURRENT_ID = 'current';

interface UserProfileRow {
  id: string;
  baseline_free_time_weekday: string;
  baseline_free_time_weekend: string;
  typical_free_windows: string;
  work_schedule_type: string;
  caregiving_flag: string;
  physical_limitations: number;
  gym_access: string;
  high_risk_windows: string;
  living_situation: string;
  created_at: string;
}

function rowToProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    baselineFreeTimeWeekday: row.baseline_free_time_weekday as UserProfile['baselineFreeTimeWeekday'],
    baselineFreeTimeWeekend: row.baseline_free_time_weekend as UserProfile['baselineFreeTimeWeekend'],
    typicalFreeWindows: JSON.parse(row.typical_free_windows),
    workScheduleType: row.work_schedule_type as UserProfile['workScheduleType'],
    caregivingFlag: row.caregiving_flag as UserProfile['caregivingFlag'],
    physicalLimitations: row.physical_limitations === 1,
    gymAccess: row.gym_access as UserProfile['gymAccess'],
    highRiskWindows: JSON.parse(row.high_risk_windows),
    livingSituation: row.living_situation as UserProfile['livingSituation'],
    createdAt: row.created_at,
  };
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<UserProfileRow>('SELECT * FROM user_profile WHERE id = ?', [CURRENT_ID]);
  return row ? rowToProfile(row) : null;
}

export async function saveUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt'>): Promise<UserProfile> {
  const db = await getDb();
  const full: UserProfile = { ...profile, id: CURRENT_ID, createdAt: new Date().toISOString() };

  await db.runAsync(
    `INSERT INTO user_profile (
      id, baseline_free_time_weekday, baseline_free_time_weekend, typical_free_windows,
      work_schedule_type, caregiving_flag, physical_limitations, gym_access,
      high_risk_windows, living_situation, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      baseline_free_time_weekday = excluded.baseline_free_time_weekday,
      baseline_free_time_weekend = excluded.baseline_free_time_weekend,
      typical_free_windows = excluded.typical_free_windows,
      work_schedule_type = excluded.work_schedule_type,
      caregiving_flag = excluded.caregiving_flag,
      physical_limitations = excluded.physical_limitations,
      gym_access = excluded.gym_access,
      high_risk_windows = excluded.high_risk_windows,
      living_situation = excluded.living_situation`,
    [
      full.id,
      full.baselineFreeTimeWeekday,
      full.baselineFreeTimeWeekend,
      JSON.stringify(full.typicalFreeWindows),
      full.workScheduleType,
      full.caregivingFlag,
      full.physicalLimitations ? 1 : 0,
      full.gymAccess,
      JSON.stringify(full.highRiskWindows),
      full.livingSituation,
      full.createdAt,
    ]
  );

  return (await getUserProfile()) ?? full;
}
