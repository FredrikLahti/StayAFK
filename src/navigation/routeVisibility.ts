// Pure lookup for which routes the persistent floating CravingButton should
// appear on - everywhere the habit loop/gaming-control signal is relevant,
// but not on utility screens (onboarding, settings, paywall) where it would
// just be noise.
const ROUTES_WITH_CRAVING_BUTTON = new Set(['Home', 'DayDetail', 'DomainDetail', 'GamingControl']);

export function shouldShowCravingButton(routeName: string | undefined): boolean {
  return routeName != null && ROUTES_WITH_CRAVING_BUTTON.has(routeName);
}
