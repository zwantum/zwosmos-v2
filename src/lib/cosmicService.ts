import { supabase } from './supabase';

export interface DailyCosmicData {
  id?: string;
  astronomyTitle: string;
  astronomySubtitle?: string;
  astronomyDate: string;
  astronomyContent: string;
  factTitle: string;
  factSubtitle?: string;
  factDate?: string;
  factContent: string;
  terminologyTitle?: string;
  terminologySubtitle?: string;
  terminologyContent?: string;
  updatedAt?: string;
}

export type CosmicEntryType = 'astronomy' | 'fact' | 'terminology';
export type CosmicEntryStatus = 'live' | 'draft' | 'archived';

export interface CosmicEntry {
  id: string;
  type: CosmicEntryType;
  title: string;
  subtitle?: string;
  /** Milestone date (e.g. "September 6, 2014").
   *  For 'astronomy' type, used for calendar date matching at midnight IST.
   *  NOT required or used for 'fact' or 'terminology' type.
   */
  astronomyDate?: string;
  content: string;
  /** @deprecated kept for DB backwards-compat only. Always null going forward. */
  scheduledAt?: string | null;
  status: CosmicEntryStatus;
  createdAt: string;
  updatedAt: string;
}

export const FACT_TOPIC_PRESETS: string[] = [
  'You & the Cosmos',
  'The Scale of Everything',
  'Solar System & Planets',
  'Stars & Supernovae',
  'Black Holes & Singularities',
  'Deep Space & Galaxies',
  'Origins of the Universe',
  'Exoplanets & Cosmic Habitats',
  'Space Exploration & Technology',
  'Cosmic Physics & The Quantum Void'
];

export const TERMINOLOGY_TOPIC_PRESETS: string[] = [
  'Astrophysics & Relativity',
  'Cosmology & The Big Bang',
  'Black Holes & Singularities',
  'Stellar Evolution',
  'Planetary Science',
  'Deep Space & Galaxies',
  'Space Exploration & Technology',
  'Telescopes & Observatories',
  'Orbital Mechanics',
  'Quantum Astronomy'
];

export const DEFAULT_COSMIC_DATA: DailyCosmicData = {
  id: 'current',
  astronomyTitle: 'This Day in Astronomy',
  astronomySubtitle: 'Messier Spots Cosmic Whirlpool',
  astronomyDate: 'October 13, 2026',
  astronomyContent: "<p>On 13 October 1773, Charles Messier recorded the object now known as M51 while searching for comets. To him it appeared as a faint, fuzzy patch; its spectacular spiral pattern would be recognized only with later telescopes. Today the Whirlpool Galaxy is a striking example of a spiral galaxy interacting with a smaller companion. Their gravitational encounter helps shape gas and star formation across the pair. Messier originally catalogued such objects so observers would not mistake them for comets. His practical list became a lasting guide to some of the night sky's most scientifically valuable sights.</p>",
  factTitle: 'Space Fact of the Day',
  factSubtitle: 'The Telescope Revolution',
  factDate: 'October 13, 2026',
  factContent: '<p>Modern telescopes fight that trembling by firing lasers upward to create artificial guide stars, then flexing their mirrors hundreds of times per second - actively un-twinkling the sky in real time.</p>',
  terminologyTitle: 'Space Terminologies',
  terminologySubtitle: 'Radiolysis',
  terminologyContent: '<p>The breaking apart of molecules by ionising radiation, which can create reactive products and chemical-energy opportunities. In icy environments, radiation can modify water and surface compounds. Whether those products support a habitable subsurface environment depends on transport and reaction pathways, since radiation can both supply useful chemistry and damage living systems.</p>'
};

const LOCAL_STORAGE_KEY = 'zwosmos_daily_cosmic';
const LOCAL_STORAGE_ENTRIES_KEY = 'zwosmos_cosmic_entries';

/**
 * Synchronous local cache reader for instantaneous, flash-free initial render.
 */
export function getCachedCosmicData(): DailyCosmicData {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.astronomyContent && parsed.factContent) {
          const cosmic = mapRowToCosmic(parsed);
          const today = getTodayIST();
          const parsedMilestone = parseMilestoneDateForRollover(cosmic.astronomyDate || '');
          // If cached daily_cosmic matches today's date in IST, use it directly!
          if (parsedMilestone && parsedMilestone.month === today.month && parsedMilestone.day === today.day) {
            return cosmic;
          }
          // If cached daily_cosmic was from yesterday or older, check local entries for today's milestone
          const rawEntries = localStorage.getItem(LOCAL_STORAGE_ENTRIES_KEY);
          if (rawEntries) {
            const entries: CosmicEntry[] = JSON.parse(rawEntries);
            const todayAstro = entries.find(e => {
              if (e.type !== 'astronomy') return false;
              const p = parseMilestoneDateForRollover(e.astronomyDate || '');
              return p && p.month === today.month && p.day === today.day;
            });
            const liveFact = entries.find(e => e.type === 'fact' && e.status === 'live');
            const liveTerm = entries.find(e => e.type === 'terminology' && e.status === 'live');
            if (todayAstro) {
              const todayFormatted = getFormattedTodayIST();
              return {
                ...cosmic,
                astronomyTitle: 'This Day in Astronomy',
                astronomySubtitle: todayAstro.subtitle || todayAstro.title,
                astronomyDate: todayAstro.astronomyDate || todayFormatted,
                astronomyContent: todayAstro.content,
                factTitle: 'Space Fact of the Day',
                factSubtitle: liveFact?.subtitle || liveFact?.title || cosmic.factSubtitle,
                factDate: todayFormatted,
                factContent: liveFact?.content || cosmic.factContent,
                terminologyTitle: 'Space Terminologies',
                terminologySubtitle: liveTerm?.title || cosmic.terminologySubtitle,
                terminologyContent: liveTerm?.content || cosmic.terminologyContent
              };
            }
          }
        }
      }
    } catch {}
  }
  return DEFAULT_COSMIC_DATA;
}

const DEFAULT_ENTRIES: CosmicEntry[] = [
  {
    id: 'default-astronomy-1',
    type: 'astronomy',
    title: DEFAULT_COSMIC_DATA.astronomyTitle,
    subtitle: DEFAULT_COSMIC_DATA.astronomySubtitle,
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
    subtitle: DEFAULT_COSMIC_DATA.factSubtitle,
    content: DEFAULT_COSMIC_DATA.factContent,
    scheduledAt: null,
    status: 'live',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'default-terminology-1',
    type: 'terminology',
    title: 'Radiolysis',
    subtitle: 'General',
    content: '<p>The breaking apart of molecules by ionising radiation, which can create reactive products and chemical-energy opportunities. In icy environments, radiation can modify water and surface compounds. Whether those products support a habitable subsurface environment depends on transport and reaction pathways, since radiation can both supply useful chemistry and damage living systems.</p>',
    scheduledAt: null,
    status: 'live',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/* =========================================================================
   Midnight IST Rollover Helpers
   ========================================================================= */

export const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Parse a milestone date string like "September 6, 2014", "6 September", "2026-09-25", etc.
 * and return { month (1-12), day }.
 */
export function parseMilestoneDateForRollover(dateStr: string): { month: number; day: number } | null {
  if (!dateStr) return null;
  const str = dateStr.trim();
  
  // "September 6, 2014" or "September 6"
  const m1 = str.match(/^([A-Za-z]+)\s+(\d{1,2})/);
  if (m1) {
    const monthIdx = MONTHS_LIST.findIndex(m => m.toLowerCase().startsWith(m1[1].toLowerCase().slice(0, 3)));
    if (monthIdx !== -1) return { month: monthIdx + 1, day: parseInt(m1[2], 10) };
  }
  
  // "6 September 2014" or "06-September"
  const m2 = str.match(/^(\d{1,2})[\s\-]+([A-Za-z]+)/);
  if (m2) {
    const monthIdx = MONTHS_LIST.findIndex(m => m.toLowerCase().startsWith(m2[2].toLowerCase().slice(0, 3)));
    if (monthIdx !== -1) return { month: monthIdx + 1, day: parseInt(m2[1], 10) };
  }

  // "2026-09-25" or "2026/09/25"
  const m3 = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m3) {
    const mIdx = parseInt(m3[2], 10);
    if (mIdx >= 1 && mIdx <= 12) return { month: mIdx, day: parseInt(m3[3], 10) };
  }

  // "25-09-2026" or "25/09/2026"
  const m4 = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m4) {
    const mIdx = parseInt(m4[2], 10);
    if (mIdx >= 1 && mIdx <= 12) return { month: mIdx, day: parseInt(m4[1], 10) };
  }

  return null;
}

/** Return day-of-year index (1 to 366) */
export function getDayOfYearIndex(month: number, day: number): number {
  let days = 0;
  for (let i = 0; i < month - 1; i++) {
    days += MONTH_DAYS[i];
  }
  return days + day;
}

/**
 * Calculates how many days in the future a date is from today in IST.
 * 0 = Today (Live), 1 = Tomorrow, 2 = Day after tomorrow, etc.
 * Seamlessly handles the year rollover (e.g. Sept 25 -> Jan 1 is +98 days).
 */
export function getUpcomingSortDistance(dateStr: string, today: { month: number; day: number }): number {
  const parsed = parseMilestoneDateForRollover(dateStr);
  if (!parsed) return 9999;

  const entryDayIdx = getDayOfYearIndex(parsed.month, parsed.day);
  const todayDayIdx = getDayOfYearIndex(today.month, today.day);

  return (entryDayIdx - todayDayIdx + 366) % 366;
}

/** Return today's month and day in IST (UTC+5:30). */
export function getTodayIST(): { month: number; day: number; year: number } {
  const now = new Date();
  const istDate = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60 * 1000);
  return { month: istDate.getMonth() + 1, day: istDate.getDate(), year: istDate.getFullYear() };
}

export function getFormattedTodayIST(): string {
  const today = getTodayIST();
  const monthName = MONTHS_LIST[today.month - 1] || 'October';
  return `${monthName} ${today.day}, ${today.year}`;
}

/**
 * Returns integer count of calendar days since an epoch in IST (UTC+5:30).
 * Changes strictly at midnight 12:00:00 AM IST.
 */
export function getDaysSinceEpochIST(epochDateStr: string = '2026-01-01'): number {
  const now = new Date();
  const istOffsetMs = (330 + now.getTimezoneOffset()) * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);

  const istYear = istNow.getFullYear();
  const istMonth = istNow.getMonth();
  const istDay = istNow.getDate();

  const [ey, em, ed] = epochDateStr.split('-').map(Number);
  const epochDate = new Date(Date.UTC(ey, em - 1, ed));
  const currentDate = new Date(Date.UTC(istYear, istMonth, istDay));

  const diffMs = currentDate.getTime() - epochDate.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, diffDays);
}

/**
 * Deterministic pseudo-random number generator (Lehmer PRNG).
 */
function createPseudoRandom(seed: number) {
  let s = Math.abs(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates an ordered sequence of all fact entries for a specific cycle such that:
 * 1. Every fact is included exactly once before repeating.
 * 2. Consecutive items NEVER share the same topic/title (Title[k] != Title[k+1]).
 * 3. The first item of cycle C does not share the same title as the last item of cycle C - 1.
 */
export function getFactSequenceForCycle(
  entries: CosmicEntry[],
  cycleNumber: number = 0,
  prevCycleLastTitle: string = ''
): CosmicEntry[] {
  if (!entries || entries.length <= 1) return entries ? [...entries] : [];

  // Sort canonically so input order is 100% deterministic regardless of DB query order
  const sorted = [...entries].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '') ||
    (a.title || '').localeCompare(b.title || '') ||
    (a.content || '').localeCompare(b.content || '')
  );

  // If prevCycleLastTitle is empty and cycleNumber > 0, compute last title of previous cycle
  if (!prevCycleLastTitle && cycleNumber > 0) {
    const prevSeq = getFactSequenceForCycle(sorted, cycleNumber - 1, '');
    if (prevSeq.length > 0) {
      prevCycleLastTitle = (prevSeq[prevSeq.length - 1].title || '').trim();
    }
  }

  const cycleSeed = 104729 + cycleNumber * 7919;
  const rng = createPseudoRandom(cycleSeed);

  // Group items by normalized title
  const groups = new Map<string, CosmicEntry[]>();
  for (const item of sorted) {
    const t = (item.title || 'General').trim();
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t)!.push(item);
  }

  // Shuffle within each group bucket
  for (const [, list] of groups.entries()) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = list[i];
      list[i] = list[j];
      list[j] = temp;
    }
  }

  const result: CosmicEntry[] = [];
  let lastTitle = prevCycleLastTitle;
  const total = sorted.length;

  for (let step = 0; step < total; step++) {
    const remaining = total - step;
    const availableTitles: string[] = [];
    let maxOtherCount = 0;
    let maxOtherTitle = '';

    for (const [title, list] of groups.entries()) {
      if (list.length > 0) {
        if (title !== lastTitle) {
          availableTitles.push(title);
          if (list.length > maxOtherCount) {
            maxOtherCount = list.length;
            maxOtherTitle = title;
          }
        }
      }
    }

    let chosenTitle = '';
    if (availableTitles.length === 0) {
      // Emergency fallback if only one title remains
      for (const [title, list] of groups.entries()) {
        if (list.length > 0) {
          chosenTitle = title;
          break;
        }
      }
    } else {
      // If the largest available group has count >= ceil(remaining / 2),
      // pick from it to avoid consecutive title clustering at the end
      const threshold = Math.ceil(remaining / 2);
      if (maxOtherCount >= threshold && maxOtherTitle) {
        chosenTitle = maxOtherTitle;
      } else {
        const idx = Math.floor(rng() * availableTitles.length);
        chosenTitle = availableTitles[idx];
      }
    }

    const item = groups.get(chosenTitle)!.pop()!;
    result.push(item);
    lastTitle = chosenTitle;
  }

  return result;
}

const LOCAL_STORAGE_PAST_FACTS_KEY = 'zwosmos_past_fact_ids';
const LOCAL_STORAGE_PAST_TERMS_KEY = 'zwosmos_past_terminology_ids';

/**
 * Returns set of entry IDs that have actually appeared in the past on the frontend
 * in the current rotation cycle.
 */
export function getPastCosmicEntryIds(type: 'fact' | 'terminology', entries?: CosmicEntry[]): Set<string> {
  const set = new Set<string>();
  if (typeof window !== 'undefined') {
    try {
      const key = type === 'terminology' ? LOCAL_STORAGE_PAST_TERMS_KEY : LOCAL_STORAGE_PAST_FACTS_KEY;
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach((id: string) => set.add(id));
        }
      }
    } catch {}
  }
  if (entries) {
    entries.forEach(e => {
      if (e.type === type && e.status === 'archived') {
        set.add(e.id);
      }
    });
  }
  return set;
}

export function recordPastCosmicEntryId(type: 'fact' | 'terminology', id: string): void {
  if (!id || typeof window === 'undefined') return;
  try {
    const key = type === 'terminology' ? LOCAL_STORAGE_PAST_TERMS_KEY : LOCAL_STORAGE_PAST_FACTS_KEY;
    const raw = localStorage.getItem(key);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem(key, JSON.stringify(arr));
    }
  } catch {}
}

export function resetPastCosmicEntryIds(type: 'fact' | 'terminology'): void {
  if (typeof window === 'undefined') return;
  try {
    const key = type === 'terminology' ? LOCAL_STORAGE_PAST_TERMS_KEY : LOCAL_STORAGE_PAST_FACTS_KEY;
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Returns today's scheduled fact entry based on midnight IST rollover
 * and the non-repeating, non-consecutive shuffle sequence.
 */
export function getScheduledFactForToday(entries: CosmicEntry[]): {
  entry: CosmicEntry | null;
  dayIndex: number;
  cycleNumber: number;
  totalFacts: number;
  sequence: CosmicEntry[];
} {
  const factEntries = entries.filter(e => e.type === 'fact');
  if (factEntries.length === 0) {
    return { entry: null, dayIndex: 0, cycleNumber: 0, totalFacts: 0, sequence: [] };
  }

  const pastIds = getPastCosmicEntryIds('fact', factEntries);
  // If all fact entries have already been shown, reset cycle for next shuffle!
  if (pastIds.size >= factEntries.length && factEntries.length > 0) {
    resetPastCosmicEntryIds('fact');
    pastIds.clear();
  }

  const sequence = getFactSequenceForCycle(factEntries, 0);
  const liveEntry = factEntries.find(e => e.status === 'live');

  // If there's an active live entry, that is today's entry
  let todayEntry: CosmicEntry | null = liveEntry || null;
  if (!todayEntry) {
    // Pick first entry from sequence that has not been shown in past
    todayEntry = sequence.find(e => !pastIds.has(e.id)) || sequence[0];
  }

  return {
    entry: todayEntry,
    dayIndex: pastIds.size,
    cycleNumber: 0,
    totalFacts: factEntries.length,
    sequence
  };
}

/**
 * Returns today's scheduled terminology entry based on midnight IST rollover
 * and the non-repeating shuffle sequence.
 */
export function getScheduledTerminologyForToday(entries: CosmicEntry[]): {
  entry: CosmicEntry | null;
  dayIndex: number;
  cycleNumber: number;
  totalItems: number;
  sequence: CosmicEntry[];
} {
  const termEntries = entries.filter(e => e.type === 'terminology');
  if (termEntries.length === 0) {
    return { entry: null, dayIndex: 0, cycleNumber: 0, totalItems: 0, sequence: [] };
  }

  const pastIds = getPastCosmicEntryIds('terminology', termEntries);
  // If all terminology entries have already been shown, reset cycle for next shuffle!
  if (pastIds.size >= termEntries.length && termEntries.length > 0) {
    resetPastCosmicEntryIds('terminology');
    pastIds.clear();
  }

  const sequence = getFactSequenceForCycle(termEntries, 0);
  const liveEntry = termEntries.find(e => e.status === 'live');

  // If there's an active live entry, that is today's entry
  let todayEntry: CosmicEntry | null = liveEntry || null;
  if (!todayEntry) {
    // Pick first entry from sequence that has not been shown in past
    todayEntry = sequence.find(e => !pastIds.has(e.id)) || sequence[0];
  }

  return {
    entry: todayEntry,
    dayIndex: pastIds.size,
    cycleNumber: 0,
    totalItems: termEntries.length,
    sequence
  };
}

function mapRowToCosmic(row: any): DailyCosmicData {
  return {
    id: row.id || 'current',
    astronomyTitle: row.astronomy_title ?? row.astronomyTitle ?? DEFAULT_COSMIC_DATA.astronomyTitle,
    astronomySubtitle: row.astronomy_subtitle ?? row.astronomySubtitle ?? row.subtitle ?? DEFAULT_COSMIC_DATA.astronomySubtitle,
    astronomyDate: row.astronomy_date ?? row.astronomyDate ?? DEFAULT_COSMIC_DATA.astronomyDate,
    astronomyContent: row.astronomy_content ?? row.astronomyContent ?? DEFAULT_COSMIC_DATA.astronomyContent,
    factTitle: row.fact_title ?? row.factTitle ?? DEFAULT_COSMIC_DATA.factTitle,
    factSubtitle: row.fact_subtitle ?? row.factSubtitle ?? row.fact_title ?? row.subtitle ?? DEFAULT_COSMIC_DATA.factSubtitle,
    factDate: row.fact_date ?? row.factDate ?? row.astronomy_date ?? DEFAULT_COSMIC_DATA.factDate,
    factContent: row.fact_content ?? row.factContent ?? DEFAULT_COSMIC_DATA.factContent,
    terminologyTitle: row.terminology_title ?? row.terminologyTitle ?? DEFAULT_COSMIC_DATA.terminologyTitle,
    terminologySubtitle: row.terminology_subtitle ?? row.terminologySubtitle ?? DEFAULT_COSMIC_DATA.terminologySubtitle,
    terminologyContent: row.terminology_content ?? row.terminologyContent ?? DEFAULT_COSMIC_DATA.terminologyContent,
    updatedAt: row.updated_at ?? row.updatedAt
  };
}

function mapRowToEntry(row: any): CosmicEntry {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle ?? row.astronomy_subtitle ?? row.astronomySubtitle ?? '',
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

        // Purge dummy local fallback entries (default-*) only when remote entries of that type exist
        const hasRemoteAstronomy = remoteEntries.some(r => r.type === 'astronomy');
        const hasRemoteFacts = remoteEntries.some(r => r.type === 'fact');
        const hasRemoteTerminology = remoteEntries.some(r => r.type === 'terminology');

        const filteredLocal = entries.filter(e => {
          if (e.id.startsWith('default-astronomy') && hasRemoteAstronomy) return false;
          if (e.id.startsWith('default-fact') && hasRemoteFacts) return false;
          if (e.id.startsWith('default-terminology') && hasRemoteTerminology) return false;
          if (e.type === 'fact' && e.title === 'SPACE FACT OF THE DAY') return false;
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

  // 3. Ensure strictly ONLY ONE entry is 'live' per type (astronomy, fact, terminology)
  // If multiple entries have status === 'live', the newest one remains 'live' and older ones become 'archived'
  for (const t of ['astronomy', 'fact', 'terminology'] as CosmicEntryType[]) {
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
    } else if (liveEntries.length === 0 && entries.some(e => e.type === t)) {
      let liveTarget: CosmicEntry | undefined;

      if (t === 'astronomy') {
        // 1. Astronomy: match today's date in IST
        const today = getTodayIST();
        liveTarget = entries.find(e => {
          if (e.type !== t) return false;
          const parsed = parseMilestoneDateForRollover(e.astronomyDate || '');
          return parsed && parsed.month === today.month && parsed.day === today.day;
        });

        // 2. Astronomy: fallback to active daily_cosmic
        if (!liveTarget) {
          try {
            const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (cached) {
              const cosmic = JSON.parse(cached);
              const activeDate = cosmic.astronomyDate;
              liveTarget = entries.find(e => e.type === t && activeDate && e.astronomyDate === activeDate);
            }
          } catch {}
        }
      } else if (t === 'fact') {
        // Space Fact: use scheduled rotation entry for today
        const scheduled = getScheduledFactForToday(entries);
        if (scheduled.entry) {
          liveTarget = scheduled.entry;
        }
      } else {
        // Space Terminology: use scheduled rotation entry for today
        const scheduled = getScheduledTerminologyForToday(entries);
        if (scheduled.entry) {
          liveTarget = scheduled.entry;
        }
      }

      // 3. Fallback to any archived entry
      if (!liveTarget) {
        liveTarget = entries.find(e => e.type === t && e.status === 'archived') || entries.find(e => e.type === t);
      }

      if (liveTarget) {
        liveTarget.status = 'live';
        liveTarget.updatedAt = new Date().toISOString();
        if (supabase) {
          try {
            await supabase
              .from('cosmic_entries')
              .update({ status: 'live', updated_at: liveTarget.updatedAt })
              .eq('id', liveTarget.id);
          } catch {}
        }
      }
    }
  }

  // Strip default 'General' subtitle on terminologies
  entries = entries.map(e => {
    if (e.type === 'terminology' && e.subtitle && e.subtitle.trim().toLowerCase() === 'general') {
      return { ...e, subtitle: '' };
    }
    return e;
  });

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
        subtitle: entryData.subtitle !== undefined ? entryData.subtitle : existing?.subtitle || '',
        updatedAt: nowIso
      };
    } else {
      entry = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'entry_' + Date.now(),
        type: entryData.type,
        title: entryData.title,
        subtitle: entryData.subtitle || '',
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
          subtitle: entry.subtitle || null,
          astronomy_date: entry.astronomyDate || null,
          content: entry.content,
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

        const { error } = await supabase.from('cosmic_entries').upsert(payload, { onConflict: 'id' });
        if (error) {
          console.error('Supabase upsert error for cosmic_entries:', error);
          throw new Error('Supabase save error: ' + error.message);
        }
      } catch (err: any) {
        console.error('Supabase upsert error for cosmic_entries:', err);
        return { success: false, error: err.message || 'Database error' };
      }
    }

    // If live, update the active daily_cosmic immediately
    if (entry.status === 'live') {
      if (entry.type === 'astronomy') {
        const title = 'This Day in Astronomy';
        const subtitle = entry.subtitle || (entry.title !== 'This Day in Astronomy' ? entry.title : '');
        await updateCosmicData({
          astronomyTitle: title,
          astronomySubtitle: subtitle,
          astronomyDate: entry.astronomyDate || '',
          astronomyContent: entry.content
        });
      } else if (entry.type === 'fact') {
        await updateCosmicData({
          factTitle: entry.title,
          factSubtitle: entry.subtitle || entry.title,
          factContent: entry.content
        });
      } else if (entry.type === 'terminology') {
        await updateCosmicData({
          terminologyTitle: 'Space Terminologies',
          terminologySubtitle: entry.title,
          terminologyContent: entry.content
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
    subtitle?: string;
    astronomyDate?: string;
    content: string;
    status?: CosmicEntryStatus;
  }>,
  conflictAction: 'update' | 'skip' | 'duplicate' = 'update'
): Promise<{ success: boolean; count: number; updatedCount: number; insertedCount: number; error?: string }> {
  try {
    if (!entriesData || entriesData.length === 0) {
      return { success: true, count: 0, updatedCount: 0, insertedCount: 0 };
    }

    const nowIso = new Date().toISOString();
    const currentEntries = await getCosmicEntries();

    // Map existing astronomy entries by dateKey (e.g. "astronomy_1_1" for Jan 1)
    const existingByDateKey = new Map<string, CosmicEntry>();
    // Map existing fact entries by normalized content snippet
    const existingFactByContent = new Map<string, CosmicEntry>();

    currentEntries.forEach(e => {
      if (e.type === 'astronomy') {
        const p = parseMilestoneDateForRollover(e.astronomyDate || '');
        if (p) {
          const key = `astronomy_${p.month}_${p.day}`;
          if (!existingByDateKey.has(key) || e.status === 'live') {
            existingByDateKey.set(key, e);
          }
        }
      } else {
        const cleanContent = e.content.replace(/<[^>]*>?/gm, '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 100);
        if (cleanContent) {
          if (!existingFactByContent.has(cleanContent) || e.status === 'live') {
            existingFactByContent.set(cleanContent, e);
          }
        }
      }
    });

    const entriesToUpsert: CosmicEntry[] = [];
    let updatedCount = 0;
    let insertedCount = 0;

    for (let index = 0; index < entriesData.length; index++) {
      const item = entriesData[index];
      let existing: CosmicEntry | null = null;
      let dateKey: string | null = null;

      if (item.type === 'astronomy') {
        const p = parseMilestoneDateForRollover(item.astronomyDate || '');
        dateKey = p ? `astronomy_${p.month}_${p.day}` : null;
        existing = dateKey ? existingByDateKey.get(dateKey) || null : null;
      } else {
        const cleanContent = item.content.replace(/<[^>]*>?/gm, '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 100);
        existing = cleanContent ? existingFactByContent.get(cleanContent) || null : null;
      }

      if (existing && conflictAction === 'update') {
        // Update existing entry while preserving its id, status (e.g. 'live'), and createdAt
        const updated: CosmicEntry = {
          ...existing,
          title: item.title,
          subtitle: item.subtitle ?? existing.subtitle,
          astronomyDate: item.astronomyDate || existing.astronomyDate,
          content: item.content,
          updatedAt: nowIso
        };
        entriesToUpsert.push(updated);
        if (dateKey) existingByDateKey.set(dateKey, updated);
        updatedCount++;
      } else if (existing && conflictAction === 'skip') {
        // Skip entry
        continue;
      } else {
        // Create new entry
        const generatedId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `entry_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`;

        const newEntry: CosmicEntry = {
          id: generatedId,
          type: item.type,
          title: item.title,
          subtitle: item.subtitle || '',
          astronomyDate: item.astronomyDate || '',
          content: item.content,
          scheduledAt: null,
          status: item.status || 'draft',
          createdAt: nowIso,
          updatedAt: nowIso
        };
        entriesToUpsert.push(newEntry);
        if (dateKey) existingByDateKey.set(dateKey, newEntry);
        insertedCount++;
      }
    }

    // Merge entries with current list by id
    const upsertMap = new Map<string, CosmicEntry>();
    currentEntries.forEach(e => upsertMap.set(e.id, e));
    entriesToUpsert.forEach(e => upsertMap.set(e.id, e));
    const updatedList = Array.from(upsertMap.values());

    // Save to LocalStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // Persist to Supabase in batches of 50 using upsert
    if (supabase) {
      try {
        const rows = entriesToUpsert.map(entry => ({
          id: entry.id,
          type: entry.type,
          title: entry.title,
          subtitle: entry.subtitle || null,
          astronomy_date: entry.astronomyDate || null,
          content: entry.content,
          status: entry.status,
          created_at: entry.createdAt,
          updated_at: entry.updatedAt
        }));

        const CHUNK_SIZE = 50;
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE);
          const { error } = await supabase.from('cosmic_entries').upsert(chunk, { onConflict: 'id' });
          if (error) {
            console.warn('Supabase batch chunk upsert warning:', error.message);
          }
        }
      } catch (err) {
        console.warn('Supabase batch upsert error:', err);
      }
    }

    return {
      success: true,
      count: entriesToUpsert.length,
      updatedCount,
      insertedCount
    };
  } catch (err: any) {
    console.error('Failed to save batch cosmic entries:', err);
    return { success: false, count: 0, updatedCount: 0, insertedCount: 0, error: err.message || 'Unknown error' };
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
    const target = current.find(e => e.id === id);
    const wasLive = target?.status === 'live';
    const targetType = target?.type;

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

    // If the deleted entry was live, promote the top remaining entry to live immediately
    if (wasLive && targetType) {
      const remaining = updated.filter(e => e.type === targetType);
      if (remaining.length > 0) {
        await setEntryLive(remaining[0].id);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCosmicEntriesBatch(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!ids || ids.length === 0) return { success: true, count: 0 };
    const idSet = new Set(ids);
    const current = await getCosmicEntries();
    const deletedEntries = current.filter(e => idSet.has(e.id));
    const updated = current.filter(e => !idSet.has(e.id));

    try {
      localStorage.setItem(LOCAL_STORAGE_ENTRIES_KEY, JSON.stringify(updated));
    } catch {}

    if (supabase) {
      try {
        const CHUNK_SIZE = 100;
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
          const chunk = ids.slice(i, i + CHUNK_SIZE);
          const { error } = await supabase.from('cosmic_entries').delete().in('id', chunk);
          if (error) {
            console.warn('Supabase batch delete error:', error.message);
          }
        }
      } catch (err) {
        console.warn('Supabase delete warning for cosmic_entries:', err);
      }
    }

    // If any deleted entry was live, promote the first remaining entry of that type to live
    const typesToPromote = new Set<CosmicEntryType>();
    deletedEntries.forEach(e => {
      if (e.status === 'live') {
        typesToPromote.add(e.type);
      }
    });

    for (const t of typesToPromote) {
      const remaining = updated.filter(e => e.type === t);
      if (remaining.length > 0) {
        await setEntryLive(remaining[0].id);
      }
    }

    return { success: true, count: ids.length };
  } catch (err: any) {
    console.error('Failed to batch delete cosmic entries:', err);
    return { success: false, count: 0, error: err.message || 'Unknown error' };
  }
}

/* =========================================================================
   Active Cosmic Data — Midnight IST Date-Based Auto-Rollover
   =========================================================================
   Each night at 12:00 AM IST, when getActiveCosmicData() is called on the
   homepage, the system checks all draft entries whose astronomyDate
   matches today's calendar month+day (IST). The newest matching draft is
   promoted to 'live', automatically archiving the previous live entry.
   If no draft matches today, the active live entry from cosmic_entries is synced.
   ========================================================================= */

export async function getActiveCosmicData(): Promise<DailyCosmicData> {
  const today = getTodayIST();
  const entries = await getCosmicEntries();

  // 1. Astronomy Rollover (date-based: month + day in IST)
  const liveAstronomy = entries.find(e => e.type === 'astronomy' && e.status === 'live');
  const liveParsed = liveAstronomy ? parseMilestoneDateForRollover(liveAstronomy.astronomyDate || '') : null;
  const isLiveMatchingToday = !!(liveParsed && liveParsed.month === today.month && liveParsed.day === today.day);

  let activeAstronomyEntry = liveAstronomy;

  if (!isLiveMatchingToday) {
    // Current live entry is not today's milestone. Find entry matching today's calendar date
    const todayAstronomyMatches = entries
      .filter(e => {
        if (e.type !== 'astronomy') return false;
        const parsed = parseMilestoneDateForRollover(e.astronomyDate || '');
        if (!parsed) return false;
        return parsed.month === today.month && parsed.day === today.day;
      })
      .sort((a, b) => {
        // Prioritize draft over archived if both exist, then newest
        if (a.status === 'draft' && b.status !== 'draft') return -1;
        if (b.status === 'draft' && a.status !== 'draft') return 1;
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      });

    if (todayAstronomyMatches.length > 0) {
      activeAstronomyEntry = todayAstronomyMatches[0];
      await setEntryLive(todayAstronomyMatches[0].id);
    }
  }

  // Ensure daily_cosmic row is synchronized with the active astronomy entry
  if (activeAstronomyEntry) {
    const currentData = getCachedCosmicData();
    const expectedTitle = 'This Day in Astronomy';
    const expectedSubtitle = activeAstronomyEntry.subtitle || (activeAstronomyEntry.title !== 'This Day in Astronomy' ? activeAstronomyEntry.title : '');
    const isDifferent =
      currentData.astronomyTitle !== expectedTitle ||
      (currentData.astronomySubtitle || '') !== expectedSubtitle ||
      currentData.astronomyDate !== (activeAstronomyEntry.astronomyDate || '') ||
      currentData.astronomyContent !== activeAstronomyEntry.content;

    if (isDifferent) {
      await updateCosmicData({
        astronomyTitle: expectedTitle,
        astronomySubtitle: expectedSubtitle,
        astronomyDate: activeAstronomyEntry.astronomyDate || '',
        astronomyContent: activeAstronomyEntry.content
      });
    }
  }

  // 2. Space Fact of the Day (Non-repeating sequence rollover at midnight IST)
  //    Rollover only triggers when IST day changes. Between rollovers, admin manual
  //    selections (Set Live Today) are respected and synced to daily_cosmic.
  const factEntries = entries.filter(e => e.type === 'fact');
  let activeFactEntry: CosmicEntry | null = null;

  if (factEntries.length > 0) {
    const todayRolloverKey = `IST_${today.year}_${today.month}_${today.day}`;
    let lastRolloverKey = '';
    try {
      lastRolloverKey = localStorage.getItem('zwosmos_fact_rollover_key') || '';
    } catch {}

    const isNewDay = lastRolloverKey !== todayRolloverKey;
    const liveFact = factEntries.find(e => e.status === 'live');

    if (isNewDay) {
      // New IST day: record yesterday's fact into past history before switching
      if (liveFact) {
        recordPastCosmicEntryId('fact', liveFact.id);
        if (supabase) {
          supabase.from('cosmic_entries').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', liveFact.id).then(() => {}, () => {});
        }
      }
      const { entry: scheduledFact } = getScheduledFactForToday(factEntries);
      if (scheduledFact) {
        activeFactEntry = scheduledFact;
        try {
          localStorage.setItem('zwosmos_fact_rollover_key', todayRolloverKey);
        } catch {}
        if (!liveFact || liveFact.id !== scheduledFact.id) {
          await setEntryLive(scheduledFact.id);
        }
      }
    } else {
      activeFactEntry = liveFact || getScheduledFactForToday(factEntries).entry;
    }
  }

  // 3. Space Terminologies (Non-repeating sequence rollover at midnight IST)
  const termEntries = entries.filter(e => e.type === 'terminology');
  let activeTerminologyEntry: CosmicEntry | null = null;

  if (termEntries.length > 0) {
    const todayRolloverKey = `IST_${today.year}_${today.month}_${today.day}`;
    let lastRolloverKey = '';
    try {
      lastRolloverKey = localStorage.getItem('zwosmos_term_rollover_key') || '';
    } catch {}

    const isNewDay = lastRolloverKey !== todayRolloverKey;
    const liveTerm = termEntries.find(e => e.status === 'live');

    if (isNewDay) {
      // New IST day: record yesterday's terminology into past history before switching
      if (liveTerm) {
        recordPastCosmicEntryId('terminology', liveTerm.id);
        if (supabase) {
          supabase.from('cosmic_entries').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', liveTerm.id).then(() => {}, () => {});
        }
      }
      const { entry: scheduledTerm } = getScheduledTerminologyForToday(termEntries);
      if (scheduledTerm) {
        activeTerminologyEntry = scheduledTerm;
        try {
          localStorage.setItem('zwosmos_term_rollover_key', todayRolloverKey);
        } catch {}
        if (!liveTerm || liveTerm.id !== scheduledTerm.id) {
          await setEntryLive(scheduledTerm.id);
        }
      }
    } else {
      activeTerminologyEntry = liveTerm || getScheduledTerminologyForToday(termEntries).entry;
    }
  }

  const result = await getCosmicData();
  const todayFormatted = getFormattedTodayIST();

  if (activeAstronomyEntry) {
    result.astronomyTitle = 'This Day in Astronomy';
    result.astronomySubtitle = activeAstronomyEntry.subtitle || activeAstronomyEntry.title;
    result.astronomyDate = activeAstronomyEntry.astronomyDate || todayFormatted;
    result.astronomyContent = activeAstronomyEntry.content;
  }

  if (activeFactEntry) {
    result.factTitle = 'Space Fact of the Day';
    result.factSubtitle = activeFactEntry.subtitle || activeFactEntry.title;
    result.factDate = todayFormatted;
    result.factContent = activeFactEntry.content;
  }

  if (activeTerminologyEntry) {
    result.terminologyTitle = 'Space Terminologies';
    result.terminologySubtitle = activeTerminologyEntry.title;
    result.terminologyContent = activeTerminologyEntry.content;
  }

  // Persist guaranteed data to cache immediately
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result));
  } catch {}

  // Save to daily_cosmic in background if there are updates
  updateCosmicData(result).catch(() => {});

  return result;
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
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const localParsed = JSON.parse(cached);
          // Preserve local terminology if Supabase has default or missing columns
          if (
            (!data.terminology_subtitle || data.terminology_subtitle === 'Gravitational Lensing') &&
            localParsed.terminologySubtitle &&
            localParsed.terminologySubtitle !== 'Gravitational Lensing'
          ) {
            mapped.terminologyTitle = localParsed.terminologyTitle || mapped.terminologyTitle;
            mapped.terminologySubtitle = localParsed.terminologySubtitle;
            mapped.terminologyContent = localParsed.terminologyContent || mapped.terminologyContent;
          }
        }
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
      const payload: any = {
        id: 'current',
        astronomy_title: merged.astronomyTitle,
        astronomy_subtitle: merged.astronomySubtitle || null,
        astronomy_date: merged.astronomyDate,
        astronomy_content: merged.astronomyContent,
        fact_title: merged.factSubtitle || merged.factTitle || 'Space Fact of the Day',
        fact_content: merged.factContent,
        terminology_title: merged.terminologyTitle || 'Space Terminologies',
        terminology_subtitle: merged.terminologySubtitle || null,
        terminology_content: merged.terminologyContent || null,
        updated_at: merged.updatedAt
      };

      const { error } = await supabase
        .from('daily_cosmic')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase upsert warning for daily_cosmic:', error.message);
        // Fallback: If remote table does not yet have terminology columns, upsert without them
        if (error.message && (error.message.includes('terminology') || (error as any).code === '42703')) {
          delete payload.terminology_title;
          delete payload.terminology_subtitle;
          delete payload.terminology_content;
          await supabase.from('daily_cosmic').upsert(payload, { onConflict: 'id' });
        }
      }
    }

    return { success: true, data: merged };
  } catch (err: any) {
    console.error('Failed to update cosmic data:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}
