export interface BookItem {
  id: string | number;
  category: string;
  title: string;
  author: string;
  year: number;
  pages?: number;
  rating?: number;
  reviewsCount?: number;
  price?: string;
  desc: string;
  longDesc: string;
  gradient: string;
  spineColor: string;
  accentColor: string;
  tags: string[];
  featured?: boolean;
  buyUrl?: string;
  coverImage?: string;
  createdAt?: string;
}

export const INITIAL_BOOKS: BookItem[] = [
  {
    id: 1,
    category: 'ASTROPHYSICS',
    title: 'Beyond the Horizon',
    author: 'J. A. Kerr',
    year: 2024,
    pages: 368,
    rating: 4.9,
    reviewsCount: 382,
    price: '$24.99',
    desc: 'On black holes, cosmic boundaries, and the fundamental limits of our scientific observation.',
    longDesc: 'An exhilarating dive into event horizons, Hawking radiation, and the latest telescope observations resolving the fiery accretion disks of supermassive singularities at galactic cores.',
    gradient: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
    spineColor: '#3f3f46',
    accentColor: '#a855f7',
    tags: ['Black Holes', 'Event Horizons', 'Singularity', 'Gravitational Waves'],
    featured: true,
    buyUrl: 'https://bookshop.org',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    category: 'COSMIC EXPLORATION',
    title: 'Orbital Paths',
    author: 'L. Morgan',
    year: 2023,
    pages: 412,
    rating: 4.8,
    reviewsCount: 294,
    price: '$22.50',
    desc: 'Journeys through space, gravitational slingshots, and the unyielding human drive to explore.',
    longDesc: 'Chronicles humankind’s boldest trajectories across the solar system—from the Voyager grand tours to modern ion-drive probes skimming the atmosphere of Jupiter’s Galilean moons.',
    gradient: 'linear-gradient(145deg, #1e1b4b 0%, #090514 100%)',
    spineColor: '#4338ca',
    accentColor: '#818cf8',
    tags: ['Orbital Mechanics', 'Deep Space', 'Voyager', 'Interplanetary'],
    buyUrl: 'https://bookshop.org',
    coverImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    category: 'COSMOLOGY',
    title: 'Silent Stars',
    author: 'M. Ilya',
    year: 2025,
    pages: 320,
    rating: 4.9,
    reviewsCount: 410,
    price: '$19.99',
    desc: 'A meditation on cosmic time, primordial light, and the vast acoustic quiet between galaxies.',
    longDesc: 'Tracing the cosmic timeline from the Big Bang’s initial quantum fluctuations to the ultimate heat death of the universe, painted with profound lyrical elegance and rigorous physical insight.',
    gradient: 'linear-gradient(145deg, #3b0764 0%, #150024 100%)',
    spineColor: '#7e22ce',
    accentColor: '#c084fc',
    tags: ['Cosmic Microwave Background', 'Dark Energy', 'Deep Time', 'Inflation'],
    buyUrl: 'https://bookshop.org',
    coverImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 4,
    category: 'COSMOLOGY',
    title: 'Cosmos',
    author: 'Carl Sagan',
    year: 1980,
    pages: 396,
    rating: 5.0,
    reviewsCount: 12450,
    price: '$21.99',
    desc: 'The landmark journey through fifteen billion years of cosmic evolution and civilization.',
    longDesc: 'Carl Sagan’s eternal opus intertwining science and civilization, exploring the universe from ancient Alexandrian libraries to interstellar futures, reminding us we are the cosmos knowing itself.',
    gradient: 'linear-gradient(145deg, #0c4a6e 0%, #031525 100%)',
    spineColor: '#0284c7',
    accentColor: '#38bdf8',
    tags: ['Evolution', 'Humanity', 'Planetary Astronomy', 'Philosophy'],
    featured: true,
    buyUrl: 'https://amazon.com',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1388620932i/55030.jpg'
  },
  {
    id: 5,
    category: 'ASTROPHYSICS',
    title: 'Astrophysics for People in a Hurry',
    author: 'Neil deGrasse Tyson',
    year: 2017,
    pages: 224,
    rating: 4.7,
    reviewsCount: 8930,
    price: '$16.95',
    desc: 'Quick, witty, and illuminating answers to the greatest questions in astrophysics.',
    longDesc: 'What is the nature of space and time? How do we fit within the cosmos? Tyson breaks down complex cosmic mechanics into pocket-sized mind-expanding chapters.',
    gradient: 'linear-gradient(145deg, #451a03 0%, #1a0800 100%)',
    spineColor: '#b45309',
    accentColor: '#fbbf24',
    tags: ['Quantum Realm', 'Dark Matter', 'Stellar Evolution', 'General Relativity'],
    buyUrl: 'https://amazon.com',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1562761669i/33413909.jpg'
  },
  {
    id: 6,
    category: 'QUANTUM & SPACETIME',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    year: 1988,
    pages: 256,
    rating: 4.9,
    reviewsCount: 15300,
    price: '$18.99',
    desc: 'From the Big Bang to black holes: the definitive primer on modern theoretical cosmology.',
    longDesc: 'Stephen Hawking explores the boundaries of space and time, the possibility of time travel, black hole thermodynamics, and the unified theory that could explain everything in our universe.',
    gradient: 'linear-gradient(145deg, #022c22 0%, #01140f 100%)',
    spineColor: '#059669',
    accentColor: '#34d399',
    tags: ['Spacetime', 'Light Cones', 'Thermodynamics', 'Unified Theory'],
    buyUrl: 'https://amazon.com',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1384403886i/3869.jpg'
  },
  {
    id: 7,
    category: 'COSMIC EXPLORATION',
    title: 'Pale Blue Dot',
    author: 'Carl Sagan',
    year: 1994,
    pages: 384,
    rating: 4.9,
    reviewsCount: 6200,
    price: '$20.50',
    desc: 'A vision of the human future in space, anchored by the iconic Voyager retrospective image.',
    longDesc: 'Inspired by Voyager 1’s photograph of Earth as a lonely mote of dust suspended in a sunbeam, Sagan paints an unforgettable manifesto on human fragility and cosmic responsibility.',
    gradient: 'linear-gradient(145deg, #172554 0%, #080f24 100%)',
    spineColor: '#2563eb',
    accentColor: '#60a5fa',
    tags: ['Earth', 'Voyager 1', 'Future Colonization', 'Cosmic Perspective'],
    buyUrl: 'https://amazon.com',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1392791656i/61663.jpg'
  },
  {
    id: 8,
    category: 'QUANTUM & SPACETIME',
    title: 'The Elegant Universe',
    author: 'Brian Greene',
    year: 1999,
    pages: 464,
    rating: 4.8,
    reviewsCount: 4500,
    price: '$23.00',
    desc: 'Superstrings, hidden dimensions, and the quest for the ultimate theory of everything.',
    longDesc: 'Brian Greene elucidates string theory, where particles are vibrating microscopic strings and reality unfolds across 11 dimensions, bridging quantum mechanics and Einstein’s general relativity.',
    gradient: 'linear-gradient(145deg, #312e81 0%, #100e38 100%)',
    spineColor: '#4f46e5',
    accentColor: '#a5b4fc',
    tags: ['String Theory', 'Dimensions', 'Calabi-Yau', 'Quantum Mechanics'],
    buyUrl: 'https://amazon.com',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1388180424i/8049273.jpg'
  },
  {
    id: 9,
    category: 'PLANETARY SCIENCE',
    title: 'The Planets',
    author: 'Dava Sobel',
    year: 2005,
    pages: 288,
    rating: 4.6,
    reviewsCount: 1840,
    price: '$17.50',
    desc: 'A poetic, mythic, and scientific tour through the extraordinary worlds in our solar system.',
    longDesc: 'Each chapter celebrates a planetary neighbor—from the scorched canyons of Mercury to the cryogenic storms of Neptune—uniting cutting-edge planetary astronomy with myth and music.',
    gradient: 'linear-gradient(145deg, #701a75 0%, #29042b 100%)',
    spineColor: '#a21caf',
    accentColor: '#f472b6',
    tags: ['Solar System', 'Planetary Geology', 'Moons', 'Planetary Science'],
    buyUrl: 'https://bookshop.org',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1388274154i/3133.jpg'
  },
  {
    id: 10,
    category: 'COSMOLOGY',
    title: 'Until the End of Time',
    author: 'Brian Greene',
    year: 2020,
    pages: 448,
    rating: 4.8,
    reviewsCount: 2900,
    price: '$25.00',
    desc: 'Mind, matter, and our search for meaning in an ever-evolving, entropic cosmos.',
    longDesc: 'A sweeping narrative exploring how life and mind emerged from primordial chaos, and how conscious creatures formulate purpose while hurtling toward entropy’s inevitable silence.',
    gradient: 'linear-gradient(145deg, #4c0519 0%, #1e0108 100%)',
    spineColor: '#be123c',
    accentColor: '#fb7185',
    tags: ['Entropy', 'Consciousness', 'Deep Future', 'Meaning'],
    buyUrl: 'https://amazon.com',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1563223053i/43886331.jpg'
  },
  {
    id: 11,
    category: 'COSMIC EXPLORATION',
    title: 'Packing for Mars',
    author: 'Mary Roach',
    year: 2010,
    pages: 334,
    rating: 4.7,
    reviewsCount: 3410,
    price: '$17.95',
    desc: 'The curious science of life in the cosmic void—from zero-gravity bodily quirks to isolation.',
    longDesc: 'An uproarious yet deeply researched probe into the unglamorous realities of space flight, simulation modules, astronaut hygiene, and the strange biology required to cross 50 million miles of void.',
    gradient: 'linear-gradient(145deg, #78350f 0%, #2c1202 100%)',
    spineColor: '#d97706',
    accentColor: '#fde047',
    tags: ['Human Spaceflight', 'Mars', 'Microgravity', 'Astronautics'],
    buyUrl: 'https://bookshop.org',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320473957i/7237456.jpg'
  },
  {
    id: 12,
    category: 'ASTROPHYSICS',
    title: 'Death by Black Hole',
    author: 'Neil deGrasse Tyson',
    year: 2007,
    pages: 384,
    rating: 4.8,
    reviewsCount: 4200,
    price: '$19.50',
    desc: 'And other cosmic quandaries: playful, profound explorations of the violent universe.',
    longDesc: 'From spaghettification near gravitational singularities to the spectra of solar eclipses and planetary demotions, Tyson guides readers through the most energetic spectacles in astrophysics.',
    gradient: 'linear-gradient(145deg, #1c1917 0%, #0a0908 100%)',
    spineColor: '#57534e',
    accentColor: '#e0e7ff',
    tags: ['Spaghettification', 'Astrophysics', 'Cosmic Hazards', 'Tidal Forces'],
    buyUrl: 'https://amazon.com',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320499692i/206637.jpg'
  }
];

const LOCAL_STORAGE_KEY = 'zwosmos_books_catalog';

import { supabase } from './supabase';

function mapRowToBook(row: any): BookItem {
  return {
    id: row.id,
    title: row.title || '',
    author: row.author || '',
    category: row.category || 'COSMOLOGY',
    year: Number(row.year) || 2024,
    pages: row.pages !== undefined && row.pages !== null && row.pages !== '' ? Number(row.pages) : 0,
    rating: row.rating !== undefined && row.rating !== null && row.rating !== '' ? Number(row.rating) : 0,
    reviewsCount: (row.reviews_count ?? row.reviewsCount) !== undefined && (row.reviews_count ?? row.reviewsCount) !== null && (row.reviews_count ?? row.reviewsCount) !== ''
      ? Number(row.reviews_count ?? row.reviewsCount)
      : 0,
    price: row.price || '',
    desc: row.desc || '',
    longDesc: row.long_desc ?? row.longDesc ?? '',
    gradient: row.gradient || 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
    spineColor: row.spine_color ?? row.spineColor ?? '#3f3f46',
    accentColor: row.accent_color ?? row.accentColor ?? '#a855f7',
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
    featured: Boolean(row.featured),
    buyUrl: row.buy_url ?? row.buyUrl ?? '',
    coverImage: row.cover_image ?? row.coverImage ?? '',
    createdAt: row.created_at ?? row.createdAt
  };
}

function mapBookToRow(book: Partial<BookItem>): any {
  return {
    title: book.title,
    author: book.author,
    category: book.category,
    year: book.year,
    pages: book.pages !== undefined && book.pages !== null ? Number(book.pages) : 0,
    rating: book.rating !== undefined && book.rating !== null ? Number(book.rating) : 0,
    reviews_count: book.reviewsCount !== undefined && book.reviewsCount !== null ? Number(book.reviewsCount) : 0,
    price: book.price || '',
    desc: book.desc,
    long_desc: book.longDesc,
    gradient: book.gradient || 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
    spine_color: book.spineColor || '#3f3f46',
    accent_color: book.accentColor || '#a855f7',
    tags: book.tags || [],
    featured: !!book.featured,
    buy_url: book.buyUrl || '',
    cover_image: book.coverImage || ''
  };
}

function getLocalBooks(): BookItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const updated = parsed.map(b => {
          if (!b.coverImage) {
            const initial = INITIAL_BOOKS.find(
              init => String(init.id) === String(b.id) || init.title.toLowerCase() === b.title.toLowerCase()
            );
            if (initial?.coverImage) {
              return { ...b, coverImage: initial.coverImage };
            }
          }
          return b;
        });
        return updated;
      }
    }
  } catch (e) {
    console.error('Error reading books from localStorage:', e);
  }
  // Initialize with default books
  saveLocalBooks(INITIAL_BOOKS);
  return INITIAL_BOOKS;
}

function saveLocalBooks(books: BookItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(books));
    // Trigger custom event so other components or tabs can react
    window.dispatchEvent(new CustomEvent('zwosmos_books_updated', { detail: books }));
  } catch (e) {
    console.error('Error saving books to localStorage:', e);
  }
}

export const booksService = {
  async getBooks(): Promise<BookItem[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapRowToBook);
          // Keep local storage in sync as cache
          saveLocalBooks(mapped);
          return mapped;
        }

        // If table exists but is empty, or table doesn't exist yet, fallback to local
        if (data && data.length === 0) {
          // Table exists but has 0 records, return empty or local
          const local = getLocalBooks();
          return local;
        }
      } catch (err) {
        console.warn('Supabase books query failed, falling back to localStorage:', err);
      }
    }

    return getLocalBooks();
  },

  async createBook(book: Omit<BookItem, 'id'>): Promise<BookItem> {
    if (supabase) {
      try {
        const row = mapBookToRow(book);
        const { data, error } = await supabase
          .from('books')
          .insert([row])
          .select()
          .single();

        if (!error && data) {
          const newBook = mapRowToBook(data);
          const current = getLocalBooks();
          saveLocalBooks([newBook, ...current]);
          return newBook;
        } else if (error) {
          console.warn('Supabase insert failed, saving locally:', error);
        }
      } catch (err) {
        console.warn('Supabase insert failed, saving locally:', err);
      }
    }

    const newBook: BookItem = {
      ...book,
      id: 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString()
    };
    const current = getLocalBooks();
    saveLocalBooks([newBook, ...current]);
    return newBook;
  },

  async updateBook(id: string | number, book: Partial<BookItem>): Promise<BookItem> {
    if (supabase && typeof id === 'string' && id.includes('-')) {
      // UUID format
      try {
        const row = mapBookToRow(book);
        const { data, error } = await supabase
          .from('books')
          .update(row)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          const updated = mapRowToBook(data);
          const current = getLocalBooks();
          const next = current.map(b => (b.id === id ? updated : b));
          saveLocalBooks(next);
          return updated;
        }
      } catch (err) {
        console.warn('Supabase update failed, updating locally:', err);
      }
    }

    const current = getLocalBooks();
    let updatedBook: BookItem | null = null;
    const next = current.map(b => {
      if (String(b.id) === String(id)) {
        updatedBook = { ...b, ...book };
        return updatedBook;
      }
      return b;
    });

    if (updatedBook) {
      saveLocalBooks(next);
      return updatedBook;
    }
    throw new Error('Book not found');
  },

  async deleteBook(id: string | number): Promise<void> {
    if (supabase && typeof id === 'string' && id.includes('-')) {
      try {
        await supabase.from('books').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }

    const current = getLocalBooks();
    const next = current.filter(b => String(b.id) !== String(id));
    saveLocalBooks(next);
  },

  async seedDefaultBooks(): Promise<BookItem[]> {
    if (supabase) {
      try {
        const rows = INITIAL_BOOKS.map(b => mapBookToRow(b));
        const { data, error } = await supabase.from('books').insert(rows).select();
        if (!error && data && data.length > 0) {
          const mapped = data.map(mapRowToBook);
          saveLocalBooks(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('Supabase seed error:', e);
      }
    }

    saveLocalBooks(INITIAL_BOOKS);
    return INITIAL_BOOKS;
  }
};

/**
 * Deterministic daily shuffle algorithm:
 * Given a list of books and a target slot count (default 3):
 * 1. Prioritizes featured books.
 * 2. If featured books count >= count:
 *    - If more featured books than slots (e.g. 5 featured for 3 slots),
 *      rotates/shuffles the featured books daily so all featured get exposure!
 *    - Otherwise shows all featured books.
 * 3. If featured books count < count (e.g. 1 featured book):
 *    - Puts the featured book(s) in the first slot(s).
 *    - Fills remaining slots with a deterministic daily shuffle of the non-featured books.
 * 4. If 0 featured books:
 *    - Fills all slots with a deterministic daily shuffle of all books.
 *
 * Deterministic seeding ensures that:
 * - On the same day, page reloads or navigation keep the same 3 books consistent (no random flickering).
 * - Every new calendar day at 00:00, the seed advances and a fresh shuffle of books is automatically featured!
 */
export function getDailyOrbitBooks(books: BookItem[], count: number = 3): BookItem[] {
  if (!books || books.length === 0) return [];
  if (books.length <= count) return books;

  // Calendar day integer seed (e.g. 20260918 for Sept 18, 2026)
  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

  // Mulberry32 32-bit deterministic PRNG
  function mulberry32(seed: number) {
    return function() {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededShuffle<T>(arr: T[], seed: number): T[] {
    const rng = mulberry32(seed);
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  const featured = books.filter(b => !!b.featured);
  const nonFeatured = books.filter(b => !b.featured);

  let selected: BookItem[] = [];

  if (featured.length >= count) {
    // If there are more featured books than slots (e.g. 5 featured books for 3 slots),
    // rotate between featured books daily so each featured book gets spotlight!
    selected = seededShuffle(featured, daySeed).slice(0, count);
  } else {
    // Take all featured books first (could be 1 or 2)
    selected = [...featured];
    const remainingSlots = count - selected.length;

    // Fill remaining slots from non-featured books using the daily shuffle
    const shuffledNonFeatured = seededShuffle(nonFeatured, daySeed + 1337);
    selected = [...selected, ...shuffledNonFeatured.slice(0, remainingSlots)];
  }

  return selected;
}

