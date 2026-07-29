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
    kind: 'timeboxed',
    timeWindow: 'evening',
    domain: 'Move',
    durationMinutes: 45,
    assignedActivityId: null,
    equivalentActivityId: null,
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

    // These four are the only gym-tagged Move entries.
    expect(['move_upper', 'move_lower_a', 'move_lower_b', 'move_disco_arms']).not.toContain(
      result.assignedActivityId
    );
  });

  it('excludes high-intensity activities when the profile has physical limitations', () => {
    const slots = [makeSlot({ domain: 'Move', durationMinutes: 45 })];
    const profile = makeProfile({ physicalLimitations: true });
    const [result] = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, profile);

    expect(result.assignedActivityId).not.toBe('move_hill_sprints'); // the only high-intensity Move entry
  });

  it('picks the candidate whose duration is closest to the slot length', () => {
    const slots = [makeSlot({ domain: 'Move', durationMinutes: 20, timeWindow: 'morning' })];
    const profile = makeProfile();
    const [result] = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, profile);

    expect(result.assignedActivityId).toBe('move_mobility_light'); // 20 min, exact match
  });

  it('alternates between duration-tied candidates instead of always picking the same one', () => {
    // move_upper/move_lower_a/move_lower_b all share identical tags (gym,
    // moderate, 60min), so a 60-min Move slot ties between all three.
    const slots = [
      makeSlot({ id: 's1', domain: 'Move', durationMinutes: 60 }),
      makeSlot({ id: 's2', domain: 'Move', durationMinutes: 60 }),
      makeSlot({ id: 's3', domain: 'Move', durationMinutes: 60 }),
    ];
    const result = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, makeProfile());

    expect(new Set(result.map((s) => s.assignedActivityId)).size).toBe(3);
  });

  it('deprioritizes candidates already assigned earlier this week', () => {
    const slots = [makeSlot({ domain: 'Move', durationMinutes: 60 })];
    const [result] = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, makeProfile(), [
      'move_upper',
      'move_lower_a',
    ]);

    expect(result.assignedActivityId).toBe('move_lower_b');
  });

  it('alternates move_lower_a/move_lower_b across the week once move_upper is already used', () => {
    const slots = [
      makeSlot({ id: 's1', domain: 'Move', durationMinutes: 60 }),
      makeSlot({ id: 's2', domain: 'Move', durationMinutes: 60 }),
    ];
    const result = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, makeProfile(), ['move_upper']);

    expect(result.map((s) => s.assignedActivityId)).toEqual(['move_lower_a', 'move_lower_b']);
  });

  it('leaves assignedActivityId null when no library entry exists for the domain', () => {
    const slots = [makeSlot({ domain: 'Move' })];
    const [result] = assignPlaceholderActivities(slots, [], makeProfile());
    expect(result.assignedActivityId).toBeNull();
  });

  it('assigns a checklist slot (no duration) without a closest-duration comparison', () => {
    const slots = [
      makeSlot({ kind: 'checklist', timeWindow: null, domain: 'Fuel', durationMinutes: null }),
    ];
    const [result] = assignPlaceholderActivities(slots, PLACEHOLDER_ASSIGNMENT_LIBRARY, makeProfile());

    expect(result.assignedActivityId).not.toBeNull();
  });

  it('falls back to an infeasible candidate rather than leaving a slot unassigned', () => {
    // Only a gym-only entry exists for Move, and the profile has no gym access.
    const library = [
      {
        id: 'move-gym-only',
        domain: 'Move' as const,
        tags: { equipmentNeeded: 'gym' as const, location: 'gym' as const, intensity: 'high' as const, durationMinutes: 45 },
        intensityTier: 'high' as const,
        description: '[PLACEHOLDER] gym only',
      },
    ];
    const slots = [makeSlot({ domain: 'Move' })];
    const profile = makeProfile({ gymAccess: 'none' });
    const [result] = assignPlaceholderActivities(slots, library, profile);

    expect(result.assignedActivityId).toBe('move-gym-only');
  });
});
