import { getDb } from './client';
import { PurchasePlatform, PurchaseStatus } from '../domain/types';

const CURRENT_ID = 'current';

interface PurchaseStatusRow {
  id: string;
  is_unlocked: number;
  purchase_date: string | null;
  platform: string | null;
}

function rowToStatus(row: PurchaseStatusRow): PurchaseStatus {
  return {
    isUnlocked: row.is_unlocked === 1,
    purchaseDate: row.purchase_date,
    platform: (row.platform as PurchasePlatform | null) ?? null,
  };
}

export async function getPurchaseStatus(): Promise<PurchaseStatus | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<PurchaseStatusRow>('SELECT * FROM purchase_status WHERE id = ?', [CURRENT_ID]);
  return row ? rowToStatus(row) : null;
}

export async function ensurePurchaseStatus(): Promise<PurchaseStatus> {
  const existing = await getPurchaseStatus();
  if (existing) return existing;

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO purchase_status (id, is_unlocked, purchase_date, platform) VALUES (?, 0, NULL, NULL)`,
    [CURRENT_ID]
  );
  return { isUnlocked: false, purchaseDate: null, platform: null };
}

export async function markPurchased(platform: PurchasePlatform, purchaseDate: string): Promise<PurchaseStatus> {
  const db = await getDb();
  await db.runAsync('UPDATE purchase_status SET is_unlocked = 1, purchase_date = ?, platform = ? WHERE id = ?', [
    purchaseDate,
    platform,
    CURRENT_ID,
  ]);
  return { isUnlocked: true, purchaseDate, platform };
}
