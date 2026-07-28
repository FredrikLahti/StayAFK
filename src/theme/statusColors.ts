import { SlotStatus } from '../domain/types';
import { colors } from './colors';

// SlotStatus color mapping - replaces the single blue previously used for
// every status. 'pending' has no color of its own since pending slots show
// action buttons instead of a status label.
export const SLOT_STATUS_COLOR: Record<SlotStatus, string> = {
  pending: colors.textSecondary,
  done: colors.status.done,
  equivalent: colors.status.equivalent,
  missed: colors.status.missed,
  not_possible: colors.status.notPossible,
};
