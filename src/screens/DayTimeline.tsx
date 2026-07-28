import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AssignmentLibraryEntry, DayPart, ScheduleSlot } from '../domain/types';
import { DAY_SPAN_HOURS, DAY_SPAN_START_HOUR, WINDOW_BOUNDS, WINDOW_ORDER } from './timelineTime';
import { colors, fontFamily, radius, spacing, typography, DOMAIN_COLOR, SLOT_STATUS_COLOR } from '../theme';

interface Props {
  slots: ScheduleSlot[];
  onSelectSlot: (slotId: string) => void;
}

const PX_PER_HOUR = 56;
const SLEEP_ROW_HEIGHT = 40;
const TRACK_HEIGHT = 96;
const HOUR_TICKS = [6, 9, 12, 15, 18, 21, 24];

function hourToX(hour: number): number {
  return (hour - DAY_SPAN_START_HOUR) * PX_PER_HOUR;
}

// Horizontal calendar-style view of today, color-coded by domain. Slot
// browsing/selection lives entirely here; the actual check-in flow (Done /
// Equivalent / Missed / Not possible, honesty check included) is untouched -
// tapping a chip just tells the parent which slot to open in the shared
// check-in sheet (see TodayScreen), same as tapping the Next Up card.
//
// Sleep gets its own dedicated row rather than sharing the domain-chip
// track: if "night" is also one of the person's free-time windows, other
// domain slots can legitimately land in that same window alongside the
// fixed Sleep slot, and stacking them in one lane would visually bury the
// shaded protected-time block under tappable to-do chips.
export default function DayTimeline({ slots, onSelectSlot }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const sleepSlot = slots.find((s) => s.domain === 'Sleep');
  const domainSlots = slots.filter((s) => s.domain !== 'Sleep');

  // Slots sharing a window split that window's display width evenly, in the
  // order the engine produced them (there's no real per-slot clock time to
  // lay out against - see timelineTime.ts).
  const slotsByWindow = new Map<DayPart, ScheduleSlot[]>();
  for (const slot of domainSlots) {
    const list = slotsByWindow.get(slot.timeWindow) ?? [];
    list.push(slot);
    slotsByWindow.set(slot.timeWindow, list);
  }

  const totalWidth = DAY_SPAN_HOURS * PX_PER_HOUR;
  const sleepLeft = hourToX(WINDOW_BOUNDS.night.startHour);
  const sleepWidth = hourToX(WINDOW_BOUNDS.night.endHour) - sleepLeft;

  // Most people's free time (and so most of their slots) sits in the
  // evening/night - defaulting the scroll position to 6am would open the
  // timeline on several empty hours with everything scrolled off-screen to
  // the right. Jump straight to the first window that actually has a slot.
  useEffect(() => {
    const firstOccupiedWindow = WINDOW_ORDER.find((window) => slotsByWindow.has(window));
    if (firstOccupiedWindow) {
      const targetX = Math.max(0, hourToX(WINDOW_BOUNDS[firstOccupiedWindow].startHour) - spacing.xxl);
      scrollRef.current?.scrollTo({ x: targetX, animated: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Today's timeline</Text>
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: totalWidth }}>
          <View style={styles.axisRow}>
            {HOUR_TICKS.map((hour) => (
              <Text key={hour} style={[styles.axisLabel, { left: hourToX(hour) - 8 }]}>
                {hour % 24}
              </Text>
            ))}
          </View>

          {sleepSlot && (
            <View style={[styles.sleepRow, { height: SLEEP_ROW_HEIGHT }]}>
              <Pressable
                style={[styles.sleepBlock, { left: sleepLeft, width: sleepWidth }]}
                onPress={() => onSelectSlot(sleepSlot.id)}
                testID={`slot-${sleepSlot.id}`}
              >
                <Text style={styles.sleepLabel}>Sleep · protected</Text>
                <Text style={styles.sleepSublabel}>{sleepSlot.durationMinutes} min</Text>
              </Pressable>
            </View>
          )}

          <View style={[styles.track, { height: TRACK_HEIGHT }]}>
            {Array.from(slotsByWindow.entries()).flatMap(([window, windowSlots]) => {
              const bounds = WINDOW_BOUNDS[window];
              const windowLeft = hourToX(bounds.startHour);
              const windowWidth = hourToX(bounds.endHour) - windowLeft;
              const chipWidth = windowWidth / windowSlots.length;

              return windowSlots.map((slot, index) => {
                const left = windowLeft + index * chipWidth;
                const domainColor = DOMAIN_COLOR[slot.domain];
                const isPending = slot.status === 'pending';
                return (
                  <Pressable
                    key={slot.id}
                    style={[
                      styles.chip,
                      {
                        left: left + 2,
                        width: Math.max(chipWidth - 4, 44),
                        backgroundColor: isPending ? domainColor : colors.surface,
                        borderColor: domainColor,
                      },
                    ]}
                    onPress={() => onSelectSlot(slot.id)}
                    testID={`slot-${slot.id}`}
                  >
                    {!isPending && (
                      <View style={[styles.statusDot, { backgroundColor: SLOT_STATUS_COLOR[slot.status] }]} />
                    )}
                    <Text
                      style={[styles.chipDomain, { color: isPending ? colors.background : domainColor }]}
                      numberOfLines={1}
                    >
                      {slot.domain}
                    </Text>
                    <Text style={[styles.chipDuration, { color: isPending ? colors.background : colors.textSecondary }]}>
                      {slot.durationMinutes}m
                    </Text>
                  </Pressable>
                );
              });
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  sectionLabel: { ...typography.sectionTitle, marginBottom: spacing.sm },
  axisRow: { height: 16, marginBottom: spacing.xs },
  axisLabel: { position: 'absolute', ...typography.monoMuted, fontSize: 10, width: 16, textAlign: 'center' },
  sleepRow: { position: 'relative', marginBottom: spacing.xs },
  track: { position: 'relative' },
  sleepBlock: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(110, 123, 168, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(110, 123, 168, 0.4)',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepLabel: { fontFamily: fontFamily.headerMedium, color: colors.metalFlat, fontSize: 11 },
  sleepSublabel: { ...typography.monoMuted, fontSize: 10, marginTop: 2 },
  chip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  statusDot: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3 },
  chipDomain: { fontFamily: fontFamily.headerMedium, fontSize: 11 },
  chipDuration: { fontFamily: fontFamily.mono, fontSize: 9, marginTop: 2 },
});
