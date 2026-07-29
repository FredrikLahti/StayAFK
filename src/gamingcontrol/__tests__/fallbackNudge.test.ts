import { shouldShowFallbackNudge, FALLBACK_NUDGE_MIN_DAY, FALLBACK_NUDGE_MAX_DAY } from '../fallbackNudge';

describe('shouldShowFallbackNudge', () => {
  it('does not show before the fallback window opens', () => {
    expect(shouldShowFallbackNudge(FALLBACK_NUDGE_MIN_DAY - 1, false, false)).toBe(false);
  });

  it('shows once the fallback window opens, if nothing else has covered it', () => {
    expect(shouldShowFallbackNudge(FALLBACK_NUDGE_MIN_DAY, false, false)).toBe(true);
    expect(shouldShowFallbackNudge(FALLBACK_NUDGE_MAX_DAY, false, false)).toBe(true);
  });

  it('does not show after the fallback window closes', () => {
    expect(shouldShowFallbackNudge(FALLBACK_NUDGE_MAX_DAY + 1, false, false)).toBe(false);
  });

  it('never shows if a craving-based spike nudge already covered this person', () => {
    expect(shouldShowFallbackNudge(FALLBACK_NUDGE_MIN_DAY + 1, true, false)).toBe(false);
  });

  it('never shows twice', () => {
    expect(shouldShowFallbackNudge(FALLBACK_NUDGE_MIN_DAY + 1, false, true)).toBe(false);
  });
});
