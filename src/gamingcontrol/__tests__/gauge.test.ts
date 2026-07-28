import { gaugeFraction, gaugeZone, GAUGE_STATE_ORDER } from '../gauge';

describe('gaugeFraction', () => {
  it('places the first state at 0', () => {
    expect(gaugeFraction(GAUGE_STATE_ORDER[0])).toBe(0);
  });

  it('places the last state at 1', () => {
    expect(gaugeFraction(GAUGE_STATE_ORDER[GAUGE_STATE_ORDER.length - 1])).toBe(1);
  });

  it('spaces states evenly in between', () => {
    expect(gaugeFraction('under_pressure')).toBeCloseTo(2 / 6);
  });
});

describe('gaugeZone', () => {
  it('treats reset_active and in_control as neutral', () => {
    expect(gaugeZone('reset_active')).toBe('neutral');
    expect(gaugeZone('in_control')).toBe('neutral');
  });

  it('treats every relapse-caused state as the relapse zone', () => {
    expect(gaugeZone('under_pressure')).toBe('relapse');
    expect(gaugeZone('lapse_interrupted')).toBe('relapse');
    expect(gaugeZone('pattern_returning')).toBe('relapse');
    expect(gaugeZone('recovery_active')).toBe('relapse');
  });

  it('treats self_sustaining as the achievement zone', () => {
    expect(gaugeZone('self_sustaining')).toBe('achievement');
  });
});
