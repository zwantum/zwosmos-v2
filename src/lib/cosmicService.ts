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

export const DEFAULT_COSMIC_DATA: DailyCosmicData = {
  id: 'current',
  astronomyTitle: 'This Day in Astronomy',
  astronomyDate: 'September 18, 1977',
  astronomyContent: '<p>On this day in 1977, Voyager 1 looked back across millions of miles of deep space to capture the first-ever image of the Earth and Moon together in a single frame—a luminous blue jewel paired with its companion, poised against the silent cosmic abyss.</p>',
  factTitle: 'SPACE FACT OF THE DAY',
  factContent: '<p>If two pieces of the same type of metal touch in the vacuum of space, they will bond permanently into a single solid piece through cold welding. On Earth, a thin oxide film keeps metal atoms apart, but in the pure void, the atoms have no idea they belong to different pieces.</p>'
};

const LOCAL_STORAGE_KEY = 'zwosmos_daily_cosmic';

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

export async function getCosmicData(): Promise<DailyCosmicData> {
  // 1. Check localStorage first for instant rendering
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Start background fetch from Supabase if available
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
        // Even if supabase table is not created yet, localStorage succeeded!
      }
    }

    return { success: true, data: merged };
  } catch (err: any) {
    console.error('Failed to update cosmic data:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}
