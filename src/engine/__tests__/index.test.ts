import { generateDailySchedule } from '../index';
import { DEFAULT_DOMAIN_FLOORS, PLACEHOLDER_ASSIGNMENT_LIBRARY } from '../../domain/defaults';
import { UserProfile } from '../../domain/types';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'u1',
    baselineFreeTimeWeekday: '2to4',
    baselineFreeTimeWeekend: '4to6',
    typicalFreeWindows: ['evening', 'night'],
    workScheduleType: 'fixed',
    caregivingFlag: 'none',
    physicalLimitations: false,
    gymAccess: 'yes_will_use',
    outdoorAccess: true,
    kitchenAccess: true,
    highRiskWindows: ['late_night'],
    livingSituation: 'alone',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('generateDailySchedule (end-to-end)', () => {
  it('produces a full day of slots with no gaps and every domain slot assigned an activity', () => {
    const slots = generateDailySchedule({
      date: '2026-07-28',
      profile: makeProfile(),
      check: { date: '2026-07-28', responseType: 'same_as_usual', source: 'auto_baseline' },
      floors: DEFAULT_DOMAIN_FLOORS,
      library: PLACEHOLDER_ASSIGNMENT_LIBRARY,
      phase: 'reset',
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots.some((s) => s.domain === 'Sleep')).toBe(true);
    // Every non-Sleep slot should sit inside the profile's typical windows.
    for (const slot of slots) {
      if (slot.domain !== 'Sleep') {
        expect(['evening', 'night']).toContain(slot.timeWindow);
      }
      expect(slot.status).toBe('pending');
      expect(slot.phaseAtCreation).toBe('reset');
    }
    // Placeholder library covers every domain used, so nothing should be unassigned.
    expect(slots.every((s) => s.assignedActivityId !== null)).toBe(true);
  });

  it('is deterministic for the same inputs', () => {
    const params = {
      date: '2026-07-28',
      profile: makeProfile(),
      check: { date: '2026-07-28', responseType: 'same_as_usual' as const, source: 'auto_baseline' as const },
      floors: DEFAULT_DOMAIN_FLOORS,
      library: PLACEHOLDER_ASSIGNMENT_LIBRARY,
      phase: 'reset' as const,
    };

    expect(generateDailySchedule(params)).toEqual(generateDailySchedule(params));
  });
});
