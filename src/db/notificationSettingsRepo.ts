import { getDb } from './client';
import { NotificationIntensity, NotificationSettings } from '../domain/types';

const CURRENT_ID = 'current';

interface NotificationSettingsRow {
  id: string;
  intensity: string;
}

function rowToSettings(row: NotificationSettingsRow): NotificationSettings {
  return { intensity: row.intensity as NotificationIntensity };
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
  await db.runAsync(`INSERT INTO notification_settings (id, intensity) VALUES (?, 'minimal')`, [CURRENT_ID]);
  return { intensity: 'minimal' };
}

export async function updateNotificationIntensity(intensity: NotificationIntensity): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE notification_settings SET intensity = ? WHERE id = ?', [intensity, CURRENT_ID]);
}
