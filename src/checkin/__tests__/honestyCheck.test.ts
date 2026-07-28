import { shouldTriggerHonestyCheck } from '../honestyCheck';

describe('shouldTriggerHonestyCheck', () => {
  it('does not trigger when the substitute is the same tier', () => {
    expect(shouldTriggerHonestyCheck('high', 'high')).toBe(false);
    expect(shouldTriggerHonestyCheck('moderate', 'moderate')).toBe(false);
    expect(shouldTriggerHonestyCheck('low', 'low')).toBe(false);
  });

  it('does not trigger when the substitute is exactly one tier below', () => {
    expect(shouldTriggerHonestyCheck('high', 'moderate')).toBe(false);
    expect(shouldTriggerHonestyCheck('moderate', 'low')).toBe(false);
  });

  it('triggers when the substitute is more than one tier below', () => {
    expect(shouldTriggerHonestyCheck('high', 'low')).toBe(true);
  });

  it('does not trigger when the substitute is the same tier or higher', () => {
    expect(shouldTriggerHonestyCheck('low', 'moderate')).toBe(false);
    expect(shouldTriggerHonestyCheck('low', 'high')).toBe(false);
    expect(shouldTriggerHonestyCheck('moderate', 'high')).toBe(false);
  });
});
