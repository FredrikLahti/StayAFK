import { isChecklistDomainDue } from '../checklist';
import { DomainFloor } from '../../domain/types';

function makeFloor(overrides: Partial<DomainFloor> = {}): DomainFloor {
  return { domain: 'Fuel', weeklyMinimumMinutes: 105, minSessionsPerWeek: 3, notes: '', ...overrides };
}

describe('isChecklistDomainDue', () => {
  it('is due when fewer completions than the weekly minimum have happened', () => {
    expect(isChecklistDomainDue(makeFloor({ minSessionsPerWeek: 3 }), 1)).toBe(true);
  });

  it('is not due once the weekly minimum has already been met', () => {
    expect(isChecklistDomainDue(makeFloor({ minSessionsPerWeek: 3 }), 3)).toBe(false);
  });

  it('is not due once the weekly minimum has been exceeded', () => {
    expect(isChecklistDomainDue(makeFloor({ minSessionsPerWeek: 1 }), 5)).toBe(false);
  });

  it('is always due for a domain with no weekly frequency requirement (e.g. Maintain)', () => {
    expect(isChecklistDomainDue(makeFloor({ minSessionsPerWeek: 0 }), 0)).toBe(true);
    expect(isChecklistDomainDue(makeFloor({ minSessionsPerWeek: 0 }), 10)).toBe(true);
  });
});
