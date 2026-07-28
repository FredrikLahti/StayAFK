import { getDb } from './client';
import { NotificationIntensity, NotificationSettings } from '../domain/types';

const CURRENT_ID = 'current';

interface NotificationSettingsRow {
  id: string;
  intensity: string;
  notifications_paused: number;
}

function rowToSettings(row: NotificationSettingsRow): NotificationSettings {
  return { intensity: row.intensity as NotificationIntensity, notificationsPaused: row.notifications_paused === 1 };
}

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<NotificationSettingsRow>(
    'SELECT * FROM notification_settings WHERE id = ?',
    [CURRENT_ID]
  );
  return row ? rowToSettings(row) : null;
}

// Defaults to 'minimal' - the less-intrusive tier - the first time Reset begins.
export async function ensureNotificationSettings(): Promise<NotificationSettings> {
  const existing = await getNotificationSettings();
  if (existing) return existing;

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO notification_settings (id, intensity, notifications_paused) VALUES (?, 'minimal', 0)`,
    [CURRENT_ID]
  );
  return { intensity: 'minimal', notificationsPaused: false };
}

export async function updateNotificationIntensity(intensity: NotificationIntensity): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE notification_settings SET intensity = ? WHERE id = ?', [intensity, CURRENT_ID]);
}

// "I'm good, don't need this" from the silence-based life-check message -
// stops all future local notifications without forcing an uninstall.
export async function pauseNotifications(): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE notification_settings SET notifications_paused = 1 WHERE id = ?', [CURRENT_ID]);
}
