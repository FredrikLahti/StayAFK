import { applyRelapseToFoundationStatuses, getRelapseOutcome } from '../relapse';
import { ActivityState, FoundationStatus } from '../../domain/types';

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

function makeStatus(domain: FoundationStatus['domain'], currentActivityState: ActivityState): FoundationStatus {
  return {
    domain,
    establishedCapacityMinutes: 1234,
    currentActivityState,
    consecutiveDays: 42,
  };
}

describe('applyRelapseToFoundationStatuses', () => {
  const allStates: ActivityState[] = ['restarted', 'repeating', 'established', 'self_sustaining'];
  const statuses: FoundationStatus[] = [
    makeStatus('Sleep', 'restarted'),
    makeStatus('Move', 'repeating'),
    makeStatus('Fuel', 'established'),
    makeStatus('Connect', 'self_sustaining'),
  ];

  it('short_lapse leaves every domain completely unchanged', () => {
    const result = applyRelapseToFoundationStatuses('short_lapse', statuses);
    expect(result).toEqual(statuses);
  });

  it('several_days drops every domain back exactly one stage', () => {
    const result = applyRelapseToFoundationStatuses('several_days', statuses);
    expect(result.find((s) => s.domain === 'Sleep')!.currentActivityState).toBe('restarted'); // floored
    expect(result.find((s) => s.domain === 'Move')!.currentActivityState).toBe('restarted');
    expect(result.find((s) => s.domain === 'Fuel')!.currentActivityState).toBe('repeating');
    expect(result.find((s) => s.domain === 'Connect')!.currentActivityState).toBe('established');
  });

  it('several_days never drops a domain below restarted', () => {
    const result = applyRelapseToFoundationStatuses('several_days', [makeStatus('Sleep', 'restarted')]);
    expect(result[0].currentActivityState).toBe('restarted');
  });

  it('full_return resets every domain to restarted regardless of starting stage', () => {
    const result = applyRelapseToFoundationStatuses('full_return', statuses);
    expect(result.every((s) => s.currentActivityState === 'restarted')).toBe(true);
  });

  it.each(['short_lapse', 'several_days', 'full_return'] as const)(
    'never changes establishedCapacityMinutes or consecutiveDays for %s',
    (severity) => {
      const result = applyRelapseToFoundationStatuses(severity, statuses);
      result.forEach((updated, i) => {
        expect(updated.establishedCapacityMinutes).toBe(statuses[i].establishedCapacityMinutes);
        expect(updated.consecutiveDays).toBe(statuses[i].consecutiveDays);
        expect(updated.domain).toBe(statuses[i].domain);
      });
    }
  );

  it.each(allStates)('several_days moves %s down exactly one stage or floors at restarted', (state) => {
    const before = allStates.indexOf(state);
    const result = applyRelapseToFoundationStatuses('several_days', [makeStatus('Sleep', state)]);
    const after = allStates.indexOf(result[0].currentActivityState);
    expect(after).toBe(Math.max(0, before - 1));
  });
});
