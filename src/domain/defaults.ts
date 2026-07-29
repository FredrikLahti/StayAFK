// Stage-1 default seed data derived from ARCHITECTURE.md's "Domain floors"
// section. Where the doc gives a real-world unit (steps, sets, nights of
// sleep) rather than a schedulable time budget, we convert it to a weekly
// minutes figure so the engine has something to allocate against - the
// conversions are noted per domain and are safe to revisit once Stage 5
// content authoring replaces the placeholders.
import { AssignmentLibraryEntry, Domain, DomainFloor } from './types';

export const DEFAULT_DOMAIN_FLOORS: DomainFloor[] = [
  {
    domain: 'Sleep',
    weeklyMinimumMinutes: 8 * 60 * 7,
    minSessionsPerWeek: 7,
    notes: '~8h/night target (allowing for individual variation). Scheduled as a fixed nightly ' +
      'commitment, not carved out of discretionary free time.',
  },
  {
    domain: 'Move',
    weeklyMinimumMinutes: 4 * 45 + 2 * 45, // 4x strength + 2x cardio sessions @ ~45min
    minSessionsPerWeek: 6,
    notes: '12-20 sets/muscle group/week via ~4x/week Upper/Lower, plus 8,000-12,000 daily steps ' +
      'and 1-2 additional cardio sessions/week. Stage 1 models this as a weekly minutes budget; ' +
      'step counts/set counts are Stage 5 content concerns.',
  },
  {
    domain: 'Fuel',
    weeklyMinimumMinutes: 3 * 35, // meal-prep/planning sessions
    minSessionsPerWeek: 3,
    notes: 'Diet-style agnostic; calories/protein heuristics are Stage 5 concerns. Stage 1 only ' +
      'protects meal-prep/planning time.',
  },
  {
    domain: 'Connect',
    weeklyMinimumMinutes: 60,
    minSessionsPerWeek: 1,
    notes: '1 meaningful contact/week minimum (brief digital pings do not count).',
  },
  {
    domain: 'Build',
    weeklyMinimumMinutes: 2 * 75,
    minSessionsPerWeek: 2,
    notes: 'No prescribed content or numeric floor in ARCHITECTURE.md - this is a Stage-1 default ' +
      'protected-time budget, easy to revisit.',
  },
  {
    domain: 'Live',
    weeklyMinimumMinutes: 0,
    minSessionsPerWeek: 0,
    notes: 'Catch-all domain; filled by the engine’s Layer 3 fallback rather than given its own floor.',
  },
  {
    domain: 'Maintain',
    weeklyMinimumMinutes: 0,
    minSessionsPerWeek: 0,
    notes: 'Not a domain in ARCHITECTURE.md’s floor list; included as an allocatable domain per the ' +
      'Stage-1 task spec (chores/self-upkeep) with no fixed minimum.',
  },
];

export function getDefaultFloor(domain: Domain): DomainFloor | undefined {
  return DEFAULT_DOMAIN_FLOORS.find((f) => f.domain === domain);
}

// Obviously-placeholder assignments, a few per domain, just to exercise the
// Layer 4 tag-matching end-to-end. Real content is Stage 5.
export const PLACEHOLDER_ASSIGNMENT_LIBRARY: AssignmentLibraryEntry[] = [
  {
    id: 'sleep-1',
    domain: 'Sleep',
    tags: { equipmentNeeded: 'none', location: 'home', intensity: 'low', durationMinutes: 480 },
    intensityTier: 'low',
    description: '[PLACEHOLDER] Sleep window',
  },
  {
    id: 'move_upper',
    domain: 'Move',
    tags: { equipmentNeeded: 'gym', location: 'gym', intensity: 'moderate', durationMinutes: 60 },
    intensityTier: 'moderate',
    description: 'Upper body (full upper - press, pull, accessories)',
    expectedFeeling: 'Heavy upper work - chest/back/shoulders should feel pumped and genuinely fatigued after',
    substitutionNote: 'Bench press occupied? Dumbbell or machine press works fine as a substitute.',
  },
  {
    id: 'move_lower_a',
    domain: 'Move',
    tags: { equipmentNeeded: 'gym', location: 'gym', intensity: 'moderate', durationMinutes: 60 },
    intensityTier: 'moderate',
    description: 'Lower body A - squat-focused + accessories (leg extension/curl)',
    expectedFeeling: 'Heavy squatting - quads/glutes genuinely taxed, some full-body fatigue from the compound lift',
  },
  {
    id: 'move_lower_b',
    domain: 'Move',
    tags: { equipmentNeeded: 'gym', location: 'gym', intensity: 'moderate', durationMinutes: 60 },
    intensityTier: 'moderate',
    description: 'Lower body B - deadlift-focused + accessories',
    expectedFeeling: 'Heavy deadlifting - posterior chain genuinely worked, real full-body fatigue',
  },
  {
    id: 'move_disco_arms',
    domain: 'Move',
    // Genuinely lighter than the heavy compound days (tags.intensity 'low',
    // which is what gates the physical-limitations exclusion) - but still
    // kept at intensityTier 'moderate' rather than 'low', so a substitution
    // away from it doesn't get lumped with the true low-effort mobility
    // session for the honesty-check tier-gap comparison (see honestyCheck.ts).
    tags: { equipmentNeeded: 'gym', location: 'gym', intensity: 'low', durationMinutes: 30 },
    intensityTier: 'moderate',
    description: 'Casual/fun arm-focused bonus session',
    expectedFeeling: "Lighter, fun-focused - a pump is fine, doesn't need to be genuinely taxing",
  },
  {
    id: 'move_hill_sprints',
    domain: 'Move',
    tags: { equipmentNeeded: 'none', location: 'outdoor', intensity: 'high', durationMinutes: 25 },
    intensityTier: 'high',
    description: 'Hill sprint session',
    expectedFeeling: 'Pulse maxed out, legs burning, genuinely out of breath by the end',
  },
  {
    id: 'move_jog',
    domain: 'Move',
    tags: { equipmentNeeded: 'none', location: 'outdoor', intensity: 'moderate', durationMinutes: 30 },
    intensityTier: 'moderate',
    description: 'Steady jog',
    expectedFeeling: 'Sustained elevated heart rate, comfortably hard, not gasping',
  },
  {
    id: 'move_bike',
    domain: 'Move',
    tags: { equipmentNeeded: 'bike', location: 'outdoor', intensity: 'moderate', durationMinutes: 35 },
    intensityTier: 'moderate',
    description: 'Cycling session',
    expectedFeeling: 'Similar to a jog - sustained effort, legs should feel it',
  },
  {
    id: 'move_swim',
    domain: 'Move',
    tags: { equipmentNeeded: 'pool', location: 'anywhere', intensity: 'moderate', durationMinutes: 35 },
    intensityTier: 'moderate',
    description: 'Swim session',
    expectedFeeling: 'Full-body sustained effort, breathing genuinely elevated',
  },
  {
    id: 'move_mobility_light',
    domain: 'Move',
    // Spec gives this as a "15-20min" range - durationMinutes only takes a
    // single number, so using the upper bound.
    tags: { equipmentNeeded: 'none', location: 'anywhere', intensity: 'low', durationMinutes: 20 },
    intensityTier: 'low',
    description: 'Light mobility/stretching',
    expectedFeeling: 'Gentle, relaxed - no real fatigue or elevated heart rate expected',
  },
  {
    id: 'fuel-1',
    domain: 'Fuel',
    tags: { equipmentNeeded: 'kitchen', location: 'home', intensity: 'low', durationMinutes: 35 },
    intensityTier: 'moderate',
    description: '[PLACEHOLDER] Fuel activity - meal prep session',
  },
  {
    id: 'fuel-2',
    domain: 'Fuel',
    tags: { equipmentNeeded: 'none', location: 'anywhere', intensity: 'low', durationMinutes: 15 },
    intensityTier: 'low',
    description: '[PLACEHOLDER] Fuel activity - meal planning check-in',
  },
  {
    id: 'connect-1',
    domain: 'Connect',
    tags: { equipmentNeeded: 'none', location: 'anywhere', intensity: 'low', durationMinutes: 60 },
    intensityTier: 'high',
    description: '[PLACEHOLDER] Connect activity - call or visit someone',
  },
  {
    id: 'connect-2',
    domain: 'Connect',
    tags: { equipmentNeeded: 'none', location: 'anywhere', intensity: 'low', durationMinutes: 5 },
    intensityTier: 'low',
    description: "[PLACEHOLDER] Connect activity - quick text or meme (ARCHITECTURE.md's own example of a substitution that shouldn't count)",
  },
  {
    id: 'build-1',
    domain: 'Build',
    tags: { equipmentNeeded: 'none', location: 'home', intensity: 'moderate', durationMinutes: 75 },
    intensityTier: 'moderate',
    description: '[PLACEHOLDER] Build activity - protected project time',
  },
  {
    id: 'live-1',
    domain: 'Live',
    tags: { equipmentNeeded: 'none', location: 'anywhere', intensity: 'low', durationMinutes: 30 },
    intensityTier: 'low',
    description: '[PLACEHOLDER] Live activity - open/unstructured time',
  },
  {
    id: 'maintain-1',
    domain: 'Maintain',
    tags: { equipmentNeeded: 'none', location: 'home', intensity: 'low', durationMinutes: 20 },
    intensityTier: 'low',
    description: '[PLACEHOLDER] Maintain activity - chores/admin/self-upkeep',
  },
];
