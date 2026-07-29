import { averageConsecutiveDays, computeFoundationStageInfo } from '../stageInfo';
import { FoundationStatus } from '../../domain/types';

function makeStatus(overrides: Partial<FoundationStatus> = {}): FoundationStatus {
  return {
    domain: 'Move',
    establishedCapacityMinutes: 0,
    currentActivityState: 'restarted',
    consecutiveDays: 0,
    ...overrides,
  };
}

describe('averageConsecutiveDays', () => {
  it('averages across statuses', () => {
    const statuses = [makeStatus({ consecutiveDays: 10 }), makeStatus({ consecutiveDays: 20 })];
    expect(averageConsecutiveDays(statuses)).toBe(15);
  });

  it('is 0 for an empty list', () => {
    expect(averageConsecutiveDays([])).toBe(0);
  });
});

describe('computeFoundationStageInfo', () => {
  it('is Restarted at day 0, counting toward Repeating', () => {
    const info = computeFoundationStageInfo(0);
    expect(info.stage).toBe('restarted');
    expect(info.nextStage).toBe('repeating');
    expect(info.daysToNextStage).toBe(4);
    expect(info.progressWithinStage).toBe(0);
  });

  it('is Repeating partway to Established', () => {
    // Repeating band is 4-21 (17 days wide); day 12.5 is halfway through.
    const info = computeFoundationStageInfo(12.5);
    expect(info.stage).toBe('repeating');
    expect(info.nextStageLabel).toBe('Established');
    expect(info.progressWithinStage).toBeCloseTo(0.5);
  });

  it('is Established just past the 21-day mark', () => {
    const info = computeFoundationStageInfo(21);
    expect(info.stage).toBe('established');
    expect(info.nextStage).toBe('self_sustaining');
    expect(info.daysToNextStage).toBe(45);
  });

  it('is Self-sustaining at 66+ days with no next stage', () => {
    const info = computeFoundationStageInfo(66);
    expect(info.stage).toBe('self_sustaining');
    expect(info.nextStage).toBeNull();
    expect(info.nextStageLabel).toBeNull();
    expect(info.daysToNextStage).toBeNull();
    expect(info.progressWithinStage).toBe(1);
  });

  it('never reports a negative days-to-next-stage past the boundary', () => {
    const info = computeFoundationStageInfo(3.9999);
    expect(info.daysToNextStage).toBeGreaterThanOrEqual(0);
  });
});
