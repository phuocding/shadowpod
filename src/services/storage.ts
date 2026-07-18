import Dexie, { type EntityTable } from 'dexie';
import type { AudioRecord, Segment } from '../types';

// Define database schema
const db = new Dexie('shadowpod-db') as Dexie & {
  audioRecords: EntityTable<AudioRecord, 'id'>;
};

db.version(1).stores({
  audioRecords: 'id, name, createdAt, lastPlayedAt',
});

// Clear all data (for testing/reset)
export async function clearAllData(): Promise<void> {
  await db.audioRecords.clear();
}

// Save audio with transcript
export async function saveAudio(
  name: string,
  blob: Blob,
  transcript: Segment[],
  duration: number
): Promise<string> {
  const id = crypto.randomUUID();
  const record: AudioRecord = {
    id,
    name,
    blob,
    transcript,
    duration,
    createdAt: new Date(),
  };

  await db.audioRecords.add(record);
  return id;
}

// Get single audio by ID
export async function getAudio(id: string): Promise<AudioRecord | undefined> {
  return db.audioRecords.get(id);
}

// Get all audio records (sorted by oldest first, newest at end)
export async function getAllAudio(): Promise<AudioRecord[]> {
  return db.audioRecords.orderBy('createdAt').toArray();
}

// Delete audio by ID
export async function deleteAudio(id: string): Promise<void> {
  await db.audioRecords.delete(id);
}

// Update last played timestamp
export async function updateLastPlayed(id: string): Promise<void> {
  await db.audioRecords.update(id, { lastPlayedAt: new Date() });
}

// Toggle favorite status
export async function toggleFavorite(id: string): Promise<boolean> {
  const record = await db.audioRecords.get(id);
  if (!record) return false;
  const newValue = !record.isFavorite;
  await db.audioRecords.update(id, { isFavorite: newValue });
  return newValue;
}

// Update transcript (save original first time for restore)
export async function updateTranscript(id: string, newTranscript: Segment[]): Promise<void> {
  const record = await db.audioRecords.get(id);
  if (!record) return;

  // Save original transcript if not already saved
  if (!record.originalTranscript) {
    await db.audioRecords.update(id, {
      originalTranscript: record.transcript,
      transcript: newTranscript,
    });
  } else {
    await db.audioRecords.update(id, { transcript: newTranscript });
  }
}

// Restore original transcript
export async function restoreOriginalTranscript(id: string): Promise<Segment[] | null> {
  const record = await db.audioRecords.get(id);
  if (!record || !record.originalTranscript) return null;

  await db.audioRecords.update(id, {
    transcript: record.originalTranscript,
    originalTranscript: undefined,
  });
  return record.originalTranscript;
}

// Merge adjacent segments
export async function mergeSegments(id: string, segmentIds: number[]): Promise<Segment[] | null> {
  const record = await db.audioRecords.get(id);
  if (!record || segmentIds.length < 2) return null;

  const sortedIds = [...segmentIds].sort((a, b) => a - b);
  const segments = record.transcript;

  // Find segments to merge
  const toMerge = segments.filter(s => sortedIds.includes(s.id));
  if (toMerge.length !== sortedIds.length) return null;

  // Create merged segment
  const mergedSegment: Segment = {
    id: toMerge[0].id,
    text: toMerge.map(s => s.text).join(' '),
    startTime: toMerge[0].startTime,
    endTime: toMerge[toMerge.length - 1].endTime,
    words: toMerge.flatMap(s => s.words),
  };

  // Build new transcript
  const newTranscript: Segment[] = [];
  let merged = false;
  for (const seg of segments) {
    if (sortedIds.includes(seg.id)) {
      if (!merged) {
        newTranscript.push(mergedSegment);
        merged = true;
      }
    } else {
      newTranscript.push(seg);
    }
  }

  // Re-index segment IDs
  newTranscript.forEach((seg, idx) => { seg.id = idx; });

  await updateTranscript(id, newTranscript);
  return newTranscript;
}

// Split segment at word index
export async function splitSegment(id: string, segmentId: number, wordIndex: number): Promise<Segment[] | null> {
  const record = await db.audioRecords.get(id);
  if (!record) return null;

  const segment = record.transcript.find(s => s.id === segmentId);
  if (!segment || wordIndex <= 0 || wordIndex >= segment.words.length) return null;

  const firstWords = segment.words.slice(0, wordIndex);
  const secondWords = segment.words.slice(wordIndex);

  const firstSegment: Segment = {
    id: segment.id,
    text: firstWords.map(w => w.text).join(' '),
    startTime: segment.startTime,
    endTime: firstWords[firstWords.length - 1].endTime,
    words: firstWords,
  };

  const secondSegment: Segment = {
    id: segment.id + 1,
    text: secondWords.map(w => w.text).join(' '),
    startTime: secondWords[0].startTime,
    endTime: segment.endTime,
    words: secondWords,
  };

  // Build new transcript
  const newTranscript: Segment[] = [];
  for (const seg of record.transcript) {
    if (seg.id === segmentId) {
      newTranscript.push(firstSegment);
      newTranscript.push(secondSegment);
    } else {
      newTranscript.push(seg);
    }
  }

  // Re-index segment IDs
  newTranscript.forEach((seg, idx) => { seg.id = idx; });

  await updateTranscript(id, newTranscript);
  return newTranscript;
}

// Check storage usage (approximate)
export async function getStorageInfo(): Promise<{ used: number; available: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
    };
  }
  return { used: 0, available: 0 };
}

export { db };
