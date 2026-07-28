import { getDb } from './client';
import { AssignmentLibraryEntry, AssignmentTags, Domain, IntensityTier } from '../domain/types';
import { PLACEHOLDER_ASSIGNMENT_LIBRARY } from '../domain/defaults';

interface AssignmentLibraryRow {
  id: string;
  domain: string;
  tags: string;
  intensity_tier: string;
  description: string;
}

function rowToEntry(row: AssignmentLibraryRow): AssignmentLibraryEntry {
  return {
    id: row.id,
    domain: row.domain as Domain,
    tags: JSON.parse(row.tags) as AssignmentTags,
    intensityTier: row.intensity_tier as IntensityTier,
    description: row.description,
  };
}

export async function getAssignmentLibrary(): Promise<AssignmentLibraryEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<AssignmentLibraryRow>('SELECT * FROM assignment_library');
  return rows.map(rowToEntry);
}

export async function seedPlaceholderAssignmentLibraryIfEmpty(): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM assignment_library');
  if (existing && existing.count > 0) return;

  for (const entry of PLACEHOLDER_ASSIGNMENT_LIBRARY) {
    await db.runAsync(
      `INSERT INTO assignment_library (id, domain, tags, intensity_tier, description) VALUES (?, ?, ?, ?, ?)`,
      [entry.id, entry.domain, JSON.stringify(entry.tags), entry.intensityTier, entry.description]
    );
  }
}
