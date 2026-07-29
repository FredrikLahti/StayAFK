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
  profile: UserProfile,
  recentlyAssignedIds: Set<string>
): AssignmentLibraryEntry | undefined {
  if (candidates.length === 0) return undefined;

  const feasible = candidates.filter((c) => isFeasible(c, profile));
  // Fall back to any candidate for the domain rather than leaving the slot
  // unassigned, even if none is a perfect fit for this profile yet.
  const pool = feasible.length > 0 ? feasible : candidates;

  // Checklist slots have no duration to match against (see domain/types.ts'
  // SlotKind) - there's nothing to compare, so just take the first feasible
  // candidate rather than a closest-duration match.
  if (slot.durationMinutes === null) return pool[0];

  const targetMinutes = slot.durationMinutes;
  const bestDistance = pool.reduce(
    (min, entry) => Math.min(min, Math.abs(entry.tags.durationMinutes - targetMinutes)),
    Infinity
  );
  const tiedBest = pool.filter((entry) => Math.abs(entry.tags.durationMinutes - targetMinutes) === bestDistance);

  // Multiple equally-good matches (e.g. move_lower_a/move_lower_b share
  // identical tags) - prefer one not already assigned earlier this week so
  // the engine alternates between them instead of always picking the same
  // one. Falls back to the first tied candidate, same deterministic
  // behavior as before, once everything tied has already been used.
  return tiedBest.find((entry) => !recentlyAssignedIds.has(entry.id)) ?? tiedBest[0];
}

export function assignPlaceholderActivities(
  slots: ScheduleSlot[],
  library: AssignmentLibraryEntry[],
  profile: UserProfile,
  recentlyAssignedIds: string[] = []
): ScheduleSlot[] {
  const used = new Set(recentlyAssignedIds);
  return slots.map((slot) => {
    const candidates = library.filter((entry) => entry.domain === slot.domain);
    const match = pickBestMatch(candidates, slot, profile, used);
    if (match) used.add(match.id);
    return { ...slot, assignedActivityId: match?.id ?? null };
  });
}
