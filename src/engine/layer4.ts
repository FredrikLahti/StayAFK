// Layer 4: assign a placeholder AssignmentLibrary entry to each domain slot
// via tag-matching only (no real content yet - per ARCHITECTURE.md's Layer 4
// description and the Stage 1 task scope).
import { AssignmentLibraryEntry, ScheduleSlot, UserProfile } from '../domain/types';

function isFeasible(entry: AssignmentLibraryEntry, profile: UserProfile): boolean {
  if (entry.tags.equipmentNeeded === 'gym' && profile.gymAccess === 'none') return false;
  // Outdoor/kitchen access are no longer collected during onboarding (most
  // people have both) - assumed available for everyone.
  if (profile.physicalLimitations && entry.tags.intensity === 'high') return false;
  return true;
}

function pickBestMatch(
  candidates: AssignmentLibraryEntry[],
  slot: ScheduleSlot,
  profile: UserProfile
): AssignmentLibraryEntry | undefined {
  if (candidates.length === 0) return undefined;

  const feasible = candidates.filter((c) => isFeasible(c, profile));
  // Fall back to any candidate for the domain rather than leaving the slot
  // unassigned, even if none is a perfect fit for this profile yet.
  const pool = feasible.length > 0 ? feasible : candidates;

  return pool.reduce((best, entry) =>
    Math.abs(entry.tags.durationMinutes - slot.durationMinutes) <
    Math.abs(best.tags.durationMinutes - slot.durationMinutes)
      ? entry
      : best
  );
}

export function assignPlaceholderActivities(
  slots: ScheduleSlot[],
  library: AssignmentLibraryEntry[],
  profile: UserProfile
): ScheduleSlot[] {
  return slots.map((slot) => {
    const candidates = library.filter((entry) => entry.domain === slot.domain);
    const match = pickBestMatch(candidates, slot, profile);
    return { ...slot, assignedActivityId: match?.id ?? null };
  });
}
