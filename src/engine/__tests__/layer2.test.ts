import { allocateDomainMinutes, ALLOCATABLE_DOMAINS } from '../layer2';
import { DEFAULT_DOMAIN_FLOORS } from '../../domain/defaults';

describe('allocateDomainMinutes (Layer 2)', () => {
  it('only allocates the time-boxed domains (Move/Build) - Fuel/Connect/Maintain are checklist-only now', () => {
    expect([...ALLOCATABLE_DOMAINS].sort()).toEqual(['Build', 'Move']);
  });

  it('never allocates more than the total free minutes available', () => {
    const totalFreeMinutes = 60;
    const allocations = allocateDomainMinutes(totalFreeMinutes, DEFAULT_DOMAIN_FLOORS, 'reset');

    const total = allocations.reduce((sum, a) => sum + a.minutes, 0);
    expect(total).toBeLessThanOrEqual(totalFreeMinutes);
    expect(allocations.map((a) => a.domain).sort()).toEqual([...ALLOCATABLE_DOMAINS].sort());
  });

  it('shares scarce time proportionally to floor weight when floors cannot all be met', () => {
    // Move's daily floor (~55.7 min) is bigger than Build's (~21.4 min), so
    // with very little free time Move should still get more of it than Build.
    const allocations = allocateDomainMinutes(10, DEFAULT_DOMAIN_FLOORS, 'reset');
    const move = allocations.find((a) => a.domain === 'Move')!;
    const build = allocations.find((a) => a.domain === 'Build')!;

    expect(move.minutes).toBeGreaterThan(build.minutes);
  });

  it('fills more of the remaining time in reset phase than in autonomy phase', () => {
    // Plenty of free time relative to the floors, so there's room to fill.
    const totalFreeMinutes = 600;
    const resetAllocations = allocateDomainMinutes(totalFreeMinutes, DEFAULT_DOMAIN_FLOORS, 'reset');
    const autonomyAllocations = allocateDomainMinutes(totalFreeMinutes, DEFAULT_DOMAIN_FLOORS, 'autonomy');

    const resetTotal = resetAllocations.reduce((sum, a) => sum + a.minutes, 0);
    const autonomyTotal = autonomyAllocations.reduce((sum, a) => sum + a.minutes, 0);

    expect(resetTotal).toBeGreaterThan(autonomyTotal);
  });

  it('returns zero minutes for every domain when there is no free time', () => {
    const allocations = allocateDomainMinutes(0, DEFAULT_DOMAIN_FLOORS, 'reset');
    expect(allocations.every((a) => a.minutes === 0)).toBe(true);
  });

  it('still gives Build a share of "maximal fill" time when free time is abundant, not just its floor', () => {
    const allocations = allocateDomainMinutes(1000, DEFAULT_DOMAIN_FLOORS, 'reset');
    const build = allocations.find((a) => a.domain === 'Build')!;
    const buildDailyFloor = DEFAULT_DOMAIN_FLOORS.find((f) => f.domain === 'Build')!.weeklyMinimumMinutes / 7;

    expect(build.minutes).toBeGreaterThan(buildDailyFloor);
  });
});
