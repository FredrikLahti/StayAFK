import { allocateDomainMinutes, ALLOCATABLE_DOMAINS } from '../layer2';
import { DEFAULT_DOMAIN_FLOORS } from '../../domain/defaults';

describe('allocateDomainMinutes (Layer 2)', () => {
  it('never allocates more than the total free minutes available', () => {
    const totalFreeMinutes = 60;
    const allocations = allocateDomainMinutes(totalFreeMinutes, DEFAULT_DOMAIN_FLOORS, 'reset');

    const total = allocations.reduce((sum, a) => sum + a.minutes, 0);
    expect(total).toBeLessThanOrEqual(totalFreeMinutes);
    expect(allocations.map((a) => a.domain).sort()).toEqual([...ALLOCATABLE_DOMAINS].sort());
  });

  it('shares scarce time proportionally to floor weight when floors cannot all be met', () => {
    // Move's daily floor (~64 min) is bigger than Connect's (~8.6 min), so
    // with very little free time Move should still get more of it than Connect.
    const allocations = allocateDomainMinutes(10, DEFAULT_DOMAIN_FLOORS, 'reset');
    const move = allocations.find((a) => a.domain === 'Move')!;
    const connect = allocations.find((a) => a.domain === 'Connect')!;

    expect(move.minutes).toBeGreaterThan(connect.minutes);
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

  it('still allocates zero-floor domains some fill time when free time is abundant', () => {
    // Maintain has a 0 weekly floor in the defaults, but should still get a
    // share of "maximal fill" time in reset phase rather than being starved.
    const allocations = allocateDomainMinutes(1000, DEFAULT_DOMAIN_FLOORS, 'reset');
    const maintain = allocations.find((a) => a.domain === 'Maintain')!;
    expect(maintain.minutes).toBeGreaterThan(0);
  });
});
