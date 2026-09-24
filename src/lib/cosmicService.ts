import { supabase } from './supabase';

export interface DailyCosmicData {
  id?: string;
  astronomyTitle: string;
  astronomyDate: string;
  astronomyContent: string;
  factTitle: string;
  factContent: string;
  updatedAt?: string;
}

export type CosmicEntryType = 'astronomy' | 'fact';
export type CosmicEntryStatus = 'live' | 'draft' | 'archived';

export interface CosmicEntry {
  id: string;
  type: CosmicEntryType;
  title: string;
  /** Milestone date (e.g. "September 6, 2014").
   *  For fact entries this is the calendar date used for midnight IST rollover.
   *  NOT displayed on the frontend for 'fact' type.
   */
  astronomyDate?: string;
  content: string;
  /** @deprecated kept for DB backwards-compat only. Always null going forward. */
  scheduledAt?: string | null;
  status: CosmicEntryStatus;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_COSMIC_DATA: DailyCosmicData = {
  id: 'current',
  astronomyTitle: 'This Day in Astronomy',
  astronomyDate: 'September 18, 1977',
  astronomyContent: '<p>On this day in 1977, Voyager 1 looked back across millions of miles of deep space to capture the first-ever image of the Earth and Moon together in a single frame—a luminous blue jewel paired with its companion, poised against the silent cosmic abyss.</p>',
  factTitle: 'SPACE FACT OF THE DAY',
  factContent: '<p>If two pieces of the same type of metal touch in the vacuum of space, they will bond permanently into a single solid piece through cold welding. On Earth, a thin oxide film keeps metal atoms apart, but in the pure void, the atoms have no idea they belong to different pieces.</p>'
};

const LOCAL_STORAGE_KEY = 'zwosmos_daily_cosmic';
const LOCAL_STORAGE_ENTRIES_KEY = 'zwosmos_cosmic_entries';

const DEFAULT_ENTRIES: CosmicEntry[] = [
  {
    id: 'default-astronomy-1',
    type: 'astronomy',
    title: DEFAULT_COSMIC_DATA.astronomyTitle,
    astronomyDate: DEFAULT_COSMIC_DATA.astronomyDate,
    content: DEFAULT_COSMIC_DATA.astronomyContent,
    scheduledAt: null,
    status: 'live',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'default-fact-1',
    type: 'fact',
    title: DEFAULT_COSMIC_DATA.factTitle,
    astronomyDate: '',
    content: DEFAULT_COSMIC_DATA.factContent,
    scheduledAt: null,
    status: 'live',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/* =========================================================================
   Midnight IST Rollover Helpers
   ========================================================================= */

const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Parse a milestone date string like "September 6, 2014" or "September 6"
 * and return { month (1-12), day }. Year is ignored — rollover matches
 * the same calendar day every year.
 */
function parseMilestoneDateForRollover(dateStr: string): { month: number; day: number } | null {
  if (!dateStr) return null;
  const m1 = dateStr.trim().match(/^([A-Za-z]+)\s+(\d{1,2})/);
  if (m1) {
    const monthIdx = MONTHS_LIST.findIndex(m => m.toLowerCase() === m1[1].toLowerCase());
    if (monthIdx !== -1) return { month: monthIdx + 1, day: parseInt(m1[2], 10) };
  }
  const m2 = dateStr.trim().match(/^(\d{1,2})\s+([A-Za-z]+)/);
  if (m2) {
    const monthIdx = MONTHS_LIST.findIndex(m => m.toLowerCase() === m2[2].toLowerCase());
    if (monthIdx !== -1) return { month: monthIdx + 1, day: parseInt(m2[1], 10) };
  }
  return null;
}

/** Return today's month and day in IST (UTC+5:30). */
function getTodayIST(): { month: number; day: number } {
  const now = new Date();
  const istDate = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60 * 1000);
  return { month: istDate.getMonth() + 1, day: istDate.getDate() };
}

function mapRowToCosmic(row: any): DailyCosmicData {
  return {
    id: row.id || 'current',
    astronomyTitle: row.astronomy_title ?? row.astronomyTitle ?? DEFAULT_COSMIC_DATA.astronomyTitle,
    astronomyDate: row.astronomy_date ?? row.astronomyDate ?? DEFAULT_COSMIC_DATA.astronomyDate,
    astronomyContent: row.astronomy_content ?? row.astronomyContent ?? DEFAULT_COSMIC_DATA.astronomyContent,
    factTitle: row.fact_title ?? row.factTitle ?? DEFAULT_COSMIC_DATA.factTitle,
    factContent: row.fact_content ?? row.factContent ?? DEFAULT_COSMIC_DATA.factContent,
    updatedAt: row.updated_at ?? row.updatedAt
  };
}

function mapRowToEntry(row: any): CosmicEntry {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    astronomyDate: row.astronomy_date ?? row.astronomyDate,
    content: row.content,
    scheduledAt: row.scheduled_at ?? row.scheduledAt ?? null,
    status: row.status || 'draft',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString()
  };
}

/* =========================================================================
   Cosmic Entries (Queue, Schedule, History)
   ========================================================================= */

export async function getCosmicEntries(type?: CosmicEntryType): Promise<CosmicEntry[]> {
  let entries: CosmicEntry[] = [];

  // 1. Try reading from LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ENTRIES_KEY);
    if (raw) {
      entries = JSON.parse(raw);
    } else {
      entries = [...DEFAULT_ENTRIES];
      localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(entries));
    }
  } catch (err) {
    console.warn('LocalStorage error reading cosmic entries:', err);
    entries = [...DEFAULT_ENTRIES];
  }

  // 2. Try fetching from Supabase if connected
  if (supabase) {
    try {
      let query = supabase.from('cosmic_entries').select('*').order('created_at', { ascending: false });
      if (type) {
        query = query.eq('type', type);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const remoteEntries = data.map(mapRowToEntry);

        // Purge dummy local fallback entries (default-*) when remote entries exist
        const hasRemoteAstronomy = remoteEntries.some(r => r.type === 'astronomy');
        const hasRemoteFact = remoteEntries.some(r => r.type === 'fact');

        const filteredLocal = entries.filter(e => {
          if (e.id.startsWith('default-astronomy') && hasRemoteAstronomy) return false;
          if (e.id.startsWith('default-fact') && hasRemoteFact) return false;
          return true;
        });

        // Merge with local entries by id, preferring remote
        const mergedMap = new Map<string, CosmicEntry>();
        filteredLocal.forEach(e => mergedMap.set(e.id, e));
        remoteEntries.forEach(e => mergedMap.set(e.id, e));
        entries = Array.from(mergedMap.values());
      }
    } catch (err) {
      // Supabase table might not exist yet, local fallback keeps app running smoothly
    }
  }

  // 3. Ensure strictly ONLY ONE entry is 'live' per type (astronomy and fact)
  // If multiple entries have status === 'live', the newest one remains 'live' and older ones become 'archived'
  for (const t of ['astronomy', 'fact'] as CosmicEntryType[]) {
    const liveEntries = entries.filter(e => e.type === t && e.status === 'live');
    if (liveEntries.length > 1) {
      liveEntries.sort(
        (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
      const keepLiveId = liveEntries[0].id;
      const demotedIds: string[] = [];

      entries = entries.map(e => {
        if (e.type === t && e.status === 'live' && e.id !== keepLiveId) {
          demotedIds.push(e.id);
          return { ...e, status: 'archived' as CosmicEntryStatus, updatedAt: new Date().toISOString() };
        }
        return e;
      });

      // Sync demotions to Supabase if connected
      if (supabase && demotedIds.length > 0) {
        try {
          await supabase
            .from('cosmic_entries')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .in('id', demotedIds);
        } catch {}
      }
    }
  }

  // Save the cleaned & deduplicated list to LocalStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(entries));
  } catch {}

  if (type) {
    return entries.filter(e => e.type === type);
  }
  return entries;
}

export async function saveCosmicEntry(
  entryData: Partial<CosmicEntry> & { type: CosmicEntryType; title: string; content: string }
): Promise<{ success: boolean; data?: CosmicEntry; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const currentEntries = await getCosmicEntries();

    let entry: CosmicEntry;
    const isNew = !entryData.id;

    if (!isNew) {
      const existing = currentEntries.find(e => e.id === entryData.id);
      entry = {
        ...(existing || DEFAULT_ENTRIES[0]),
        ...entryData,
        id: entryData.id!,
        updatedAt: nowIso
      };
    } else {
      entry = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'entry_' + Date.now(),
        type: entryData.type,
        title: entryData.title,
        astronomyDate: entryData.astronomyDate || '',
        content: entryData.content,
        scheduledAt: entryData.scheduledAt || null,
        status: entryData.status || 'draft',
        createdAt: nowIso,
        updatedAt: nowIso
      };
    }

    // If marked as 'live', demote other live entries of the same type to 'archived'
    let updatedList = currentEntries.filter(e => e.id !== entry.id);
    if (entry.status === 'live') {
      updatedList = updatedList.map(e => {
        if (e.type === entry.type && e.status === 'live') {
          return { ...e, status: 'archived', updatedAt: nowIso };
        }
        return e;
      });
    }

    updatedList.unshift(entry);

    // Save to LocalStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(updatedList));
    } catch {}

    // Persist to Supabase if available
    if (supabase) {
      try {
        const payload = {
          id: entry.id,
          type: entry.type,
          title: entry.title,
          astronomy_date: entry.astronomyDate || null,
          content: entry.content,
          scheduled_at: entry.scheduledAt || null,
          status: entry.status,
          updated_at: nowIso
        };

        if (entry.status === 'live') {
          // Demote other live entries of the same type in Supabase
          await supabase
            .from('cosmic_entries')
            .update({ status: 'archived', updated_at: nowIso })
            .eq('type', entry.type)
            .neq('id', entry.id)
            .eq('status', 'live');
        }

        await supabase.from('cosmic_entries').upsert(payload, { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase upsert warning for cosmic_entries:', err);
      }
    }

    // If live, update the active daily_cosmic immediately
    if (entry.status === 'live') {
      if (entry.type === 'astronomy') {
        await updateCosmicData({
          astronomyTitle: entry.title,
          astronomyDate: entry.astronomyDate || '',
          astronomyContent: entry.content
        });
      } else {
        await updateCosmicData({
          factTitle: entry.title,
          factContent: entry.content
        });
      }
    }

    return { success: true, data: entry };
  } catch (err: any) {
    console.error('Failed to save cosmic entry:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function saveCosmicEntriesBatch(
  entriesData: Array<{
    type: CosmicEntryType;
    title: string;
    astronomyDate?: string;
    content: string;
    status?: CosmicEntryStatus;
  }>
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!entriesData || entriesData.length === 0) {
      return { success: true, count: 0 };
    }

    const nowIso = new Date().toISOString();
    const currentEntries = await getCosmicEntries();

    const newEntries: CosmicEntry[] = entriesData.map((item, index) => {
      const generatedId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `entry_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`;

      return {
        id: generatedId,
        type: item.type,
        title: item.title,
        astronomyDate: item.astronomyDate || '',
        content: item.content,
        scheduledAt: null,
        status: item.status || 'draft',
        createdAt: nowIso,
        updatedAt: nowIso
      };
    });

    // Prepend new entries so newest appears at the top of the list
    const updatedList = [...newEntries, ...currentEntries];

    // Save to LocalStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // Persist to Supabase in batches of 50
    if (supabase) {
      try {
        const rows = newEntries.map(entry => ({
          id: entry.id,
          type: entry.type,
          title: entry.title,
          astronomy_date: entry.astronomyDate || null,
          content: entry.content,
          status: entry.status,
          created_at: entry.createdAt,
          updated_at: entry.updatedAt
        }));

        const CHUNK_SIZE = 50;
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE);
          const { error } = await supabase.from('cosmic_entries').insert(chunk);
          if (error) {
            console.warn('Supabase batch chunk insert warning:', error.message);
          }
        }
      } catch (err) {
        console.warn('Supabase batch insert error:', err);
      }
    }

    return { success: true, count: newEntries.length };
  } catch (err: any) {
    console.error('Failed to save batch cosmic entries:', err);
    return { success: false, count: 0, error: err.message || 'Unknown error' };
  }
}

export async function setEntryLive(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const entries = await getCosmicEntries();
    const target = entries.find(e => e.id === id);
    if (!target) return { success: false, error: 'Entry not found' };

    target.status = 'live';
    target.updatedAt = new Date().toISOString();

    return await saveCosmicEntry(target);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCosmicEntry(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getCosmicEntries();
    const updated = current.filter(e => e.id !== id);

    try {
      localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(updated));
    } catch {}

    if (supabase) {
      try {
        await supabase.from('cosmic_entries').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete warning for cosmic_entries:', err);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/* =========================================================================
   Active Cosmic Data — Midnight IST Date-Based Auto-Rollover
   =========================================================================
   Each night at 12:00 AM IST, when getActiveCosmicData() is called on the
   homepage, the system checks all draft entries whose astronomyDate
   matches today's calendar month+day (IST). The newest matching draft is
   promoted to 'live', automatically archiving the previous live entry.
   ========================================================================= */

export async function getActiveCosmicData(): Promise<DailyCosmicData> {
  const today = getTodayIST();
  const entries = await getCosmicEntries();

  for (const type of ['astronomy', 'fact'] as CosmicEntryType[]) {
    // Find draft entries whose milestone month+day matches today in IST
    const todayMatches = entries
      .filter(e => {
        if (e.type !== type || e.status !== 'draft') return false;
        const parsed = parseMilestoneDateForRollover(e.astronomyDate || '');
        if (!parsed) return false;
        return parsed.month === today.month && parsed.day === today.day;
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    if (todayMatches.length > 0) {
      // Promote the newest matching draft to live
      await setEntryLive(todayMatches[0].id);
    }
  }

  return await getCosmicData();
}

/* =========================================================================
   Classic Single-Row Methods (Preserved for compatibility)
   ========================================================================= */

export async function getCosmicData(): Promise<DailyCosmicData> {
  // 1. Check localStorage first for instant rendering
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      fetchFromSupabase().catch(() => {});
      return mapRowToCosmic(parsed);
    }
  } catch (err) {
    console.warn('Error reading cosmic data from localStorage:', err);
  }

  // 2. Fetch from Supabase
  const remote = await fetchFromSupabase();
  if (remote) {
    return remote;
  }

  return DEFAULT_COSMIC_DATA;
}

async function fetchFromSupabase(): Promise<DailyCosmicData | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('daily_cosmic')
      .select('*')
      .eq('id', 'current')
      .maybeSingle();

    if (error) {
      console.warn('Supabase daily_cosmic fetch note:', error.message);
      return null;
    }

    if (data) {
      const mapped = mapRowToCosmic(data);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
      } catch {}
      return mapped;
    }
  } catch (err) {
    console.warn('Error fetching daily cosmic from Supabase:', err);
  }

  return null;
}

export async function updateCosmicData(
  updates: Partial<DailyCosmicData>
): Promise<{ success: boolean; data?: DailyCosmicData; error?: string }> {
  try {
    const current = await getCosmicData();
    const merged: DailyCosmicData = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage immediately
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
    } catch {}

    // Dispatch custom event to notify open tabs & homepage immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('zwosmos_daily_cosmic_updated', {
          detail: merged
        })
      );
    }

    // Persist to Supabase if connected
    if (supabase) {
      const payload = {
        id: 'current',
        astronomy_title: merged.astronomyTitle,
        astronomy_date: merged.astronomyDate,
        astronomy_content: merged.astronomyContent,
        fact_title: merged.factTitle,
        fact_content: merged.factContent,
        updated_at: merged.updatedAt
      };

      const { error } = await supabase
        .from('daily_cosmic')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase upsert warning for daily_cosmic:', error.message);
      }
    }

    return { success: true, data: merged };
  } catch (err: any) {
    console.error('Failed to update cosmic data:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}
