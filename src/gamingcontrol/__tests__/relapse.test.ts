import { getRelapseOutcome } from '../relapse';

describe('getRelapseOutcome', () => {
  it('maps short_lapse to lapse_interrupted with the exact copy', () => {
    const outcome = getRelapseOutcome('short_lapse');
    expect(outcome.resultingState).toBe('lapse_interrupted');
    expect(outcome.message).toBe(
      "Noted. One slip doesn't undo the work. Gaming Control: Lapse interrupted. Back to it."
    );
  });

  it('maps several_days to recovery_active with the exact copy', () => {
    const outcome = getRelapseOutcome('several_days');
    expect(outcome.resultingState).toBe('recovery_active');
    expect(outcome.message).toBe(
      "Alright. Your training, sleep, and everything else you rebuilt didn't disappear because of this. " +
        "We're not starting over — we're restoring the parts that slipped. Recovery starts now."
    );
  });

  it('maps full_return to recovery_active with the exact copy', () => {
    const outcome = getRelapseOutcome('full_return');
    expect(outcome.resultingState).toBe('recovery_active');
    expect(outcome.message).toBe(
      "This is the big one. Here's the thing though — your capacity is still real, even if it's dormant " +
        "right now. We're not rebuilding from nothing. Reset restarting, pulling in what already worked for you before."
    );
  });

  it('never references FoundationStatus or established_capacity in any outcome', () => {
    for (const severity of ['short_lapse', 'several_days', 'full_return'] as const) {
      const outcome = getRelapseOutcome(severity);
      expect(JSON.stringify(outcome)).not.toMatch(/established|foundation/i);
    }
  });
});
