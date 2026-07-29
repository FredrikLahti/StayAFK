import { shouldShowCravingButton } from '../routeVisibility';

describe('shouldShowCravingButton', () => {
  it('shows on the core habit-loop screens', () => {
    expect(shouldShowCravingButton('Home')).toBe(true);
    expect(shouldShowCravingButton('DayDetail')).toBe(true);
    expect(shouldShowCravingButton('DomainDetail')).toBe(true);
    expect(shouldShowCravingButton('GamingControl')).toBe(true);
  });

  it('hides on utility screens', () => {
    expect(shouldShowCravingButton('Entry')).toBe(false);
    expect(shouldShowCravingButton('Onboarding')).toBe(false);
    expect(shouldShowCravingButton('Settings')).toBe(false);
    expect(shouldShowCravingButton('Paywall')).toBe(false);
  });

  it('hides when the route name is unknown', () => {
    expect(shouldShowCravingButton(undefined)).toBe(false);
  });
});
