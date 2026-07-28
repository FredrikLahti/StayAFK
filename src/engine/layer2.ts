// Layer 2: allocate today's free time across domains, respecting
// DomainFloor requirements and weighting toward maximal fill during the
// Reset phase (per ARCHITECTURE.md's Layer 2 description).
//
// Sleep and Live are handled outside this layer: Sleep is a fixed nightly
// commitment rather than something that competes for discretionary free
// time (see layer3.ts), and Live is the Layer 3 fallback for whatever this
// layer doesn't spend, not a domain that actively competes for a share here.
import { Domain, DomainFloor, PhaseName } from '../domain/types';

export const ALLOCATABLE_DOMAINS: Domain[] = ['Move', 'Fuel', 'Connect', 'Build', 'Maintain'];

export interface DomainAllocation {
  domain: Domain;
  minutes: number;
}

// How much of the free time left over after floors are met gets actively
// filled with more domain time (vs. left for Layer 3 to hand to Live).
// Reset phase is weighted toward maximal fill per ARCHITECTURE.md; later
// phases leave more room for autonomy. Stage 1 has no phase-transition data
// yet, so this is a simple fixed weighting per phase, easy to tune later.
const FILL_WEIGHT_BY_PHASE: Record<PhaseName, number> = {
  reset: 1,
  saturation: 0.8,
  stabilisation: 0.6,
  autonomy: 0.4,
};

export function allocateDomainMinutes(
  totalFreeMinutes: number,
  floors: DomainFloor[],
  phase: PhaseName
): DomainAllocation[] {
  const floorMap = new Map(floors.map((f) => [f.domain, f]));

  const dailyTargets = ALLOCATABLE_DOMAINS.map((domain) => {
    const floor = floorMap.get(domain);
    const weeklyMinutes = floor?.weeklyMinimumMinutes ?? 0;
    return { domain, dailyMinimum: weeklyMinutes / 7 };
  });

  const totalDailyMinimum = dailyTargets.reduce((sum, d) => sum + d.dailyMinimum, 0);

  if (totalFreeMinutes <= 0) {
    return dailyTargets.map((d) => ({ domain: d.domain, minutes: 0 }));
  }

  if (totalDailyMinimum >= totalFreeMinutes) {
    // Not enough free time today to fully satisfy every floor: share what's
    // available proportionally to each domain's floor weight.
    if (totalDailyMinimum === 0) {
      return dailyTargets.map((d) => ({ domain: d.domain, minutes: 0 }));
    }
    return dailyTargets.map((d) => ({
      domain: d.domain,
      minutes: Math.floor((d.dailyMinimum / totalDailyMinimum) * totalFreeMinutes),
    }));
  }

  // Floors are all satisfiable; distribute the remaining time weighted
  // toward maximal fill (still proportional to floor weight, so domains
  // with a bigger weekly floor get a bigger share of the extra time too).
  // Domains with a 0 floor (e.g. Maintain) still get weight 1 so they're
  // not entirely starved of "bonus" fill time.
  const remaining = totalFreeMinutes - totalDailyMinimum;
  const fillWeight = FILL_WEIGHT_BY_PHASE[phase];
  const distributable = remaining * fillWeight;
  const totalShareWeight = dailyTargets.reduce((sum, d) => sum + (d.dailyMinimum || 1), 0);

  return dailyTargets.map((d) => {
    const shareWeight = d.dailyMinimum || 1;
    const extra = (shareWeight / totalShareWeight) * distributable;
    return { domain: d.domain, minutes: Math.floor(d.dailyMinimum + extra) };
  });
}
