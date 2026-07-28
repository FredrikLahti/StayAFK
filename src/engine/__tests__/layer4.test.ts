import { assignPlaceholderActivities } from '../layer4';
import { PLACEHOLDER_ASSIGNMENT_LIBRARY } from '../../domain/defaults';
import { ScheduleSlot, UserProfile } from '../../domain/types';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'u1',
    baselineFreeTimeWeekday: '2to4',
    baselineFreeTimeWeekend: '4to6',
    typicalFreeWindows: ['evening'],
    workScheduleType: 'fixed',
    caregivingFlag: 'none',
    physicalLimitations: false,
    gymAccess: 'yes_will_use',
    outdoorAccess: true,
    kitchenAccess: true,
    highRiskWindows: [],
    livingSituation: 'alone',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSlot(overrides: Partial<ScheduleSlot> = {}): ScheduleSlot {
  return {
    id: 's1',
    date: '2026-07-28',
    timeWindow: 'evening',
    domain: 'Move',
    durationMinutes: 45,
    assignedActivityId: null,
    status: 'pending',
    phaseAtCreation: 'reset',
    ...overrides,
  };
}

describe('assignPlaceholderActivities (Layer 4)', () => {
  it('assigns an activity from the matching domain', () => {
    const slots = [makeSlot({ domain: 'Connect', durationMinutes: 60 })];
    const [result] = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, makeProfile());

    expect(result.assignedActivityId).toBe('connect-1');
  });

  it('excludes gym-tagged activities when the profile has no gym access', () => {
    const slots = [makeSlot({ domain: 'Move', durationMinutes: 45 })];
    const profile = makeProfile({ gymAccess: 'none' });
    const [result] = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, profile);

    expect(result.assignedActivityId).not.toBe('move-1'); // move-1 requires gym
  });

  it('excludes outdoor-tagged activities when there is no outdoor access', () => {
    const slots = [makeSlot({ domain: 'Move', durationMinutes: 30 })];
    const profile = makeProfile({ outdoorAccess: false, gymAccess: 'none' });
    const [result] = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, profile);

    expect(result.assignedActivityId).not.toBe('move-3');
  });

  it('excludes high-intensity activities when the profile has physical limitations', () => {
    const slots = [makeSlot({ domain: 'Move', durationMinutes: 45 })];
    const profile = makeProfile({ physicalLimitations: true });
    const [result] = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, profile);

    expect(result.assignedActivityId).not.toBe('move-1'); // move-1 is high intensity
  });

  it('picks the candidate whose duration is closest to the slot length', () => {
    const slots = [makeSlot({ domain: 'Move', durationMinutes: 20, timeWindow: 'morning' })];
    const profile = makeProfile();
    const [result] = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, profile);

    expect(result.assignedActivityId).toBe('move-4'); // 20 min, closest match
  });

  it('leaves assignedActivityId null when no library entry exists for the domain', () => {
    const slots = [makeSlot({ domain: 'Move' })];
    const [result] = assignPlaceholderActivities(slots, [], makeProfile());
    expect(result.assignedActivityId).toBeNull();
  });

  it('falls back to an infeasible candidate rather than leaving a slot unassigned', () => {
    // Only a gym-only entry exists for Move, and the profile has no gym access.
    const library = [
      {
        id: 'move-gym-only',
        domain: 'Move' as const,
        tags: { equipmentNeeded: 'gym' as const, location: 'gym' as const, intensity: 'high' as const, durationMinutes: 45 },
        description: '[PLACEHOLDER] gym only',
      },
    ];
    const slots = [makeSlot({ domain: 'Move' })];
    const profile = makeProfile({ gymAccess: 'none' });
    const [result] = assignPlaceholderActivities(slots, library, profile);

    expect(result.assignedActivityId).toBe('move-gym-only');
  });
});
