export interface BlogPost {
  id: number;
  category: string;
  categorySlug: string;
  title: string;
  desc: string;
  authorName: string;
  authorImg: string;
  date: string;
  img: string;
  readTime?: string;
  featured?: boolean;
}

export interface CategoryInfo {
  name: string;
  slug: string;
  desc: string;
  heroImg: string;
  icon?: string;
}

export const CATEGORY_MAP: Record<string, CategoryInfo> = {
  'space-news': {
    name: 'Space News',
    slug: 'space-news',
    desc: 'Latest space news, astronomical breakthroughs, and real-time dispatches from telescopes and space agencies worldwide.',
    heroImg: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop'
  },
  'solar-system': {
    name: 'Solar System',
    slug: 'solar-system',
    desc: 'Planets, moons, asteroids, and comets: explorations of our celestial neighborhood and the physics of interplanetary space.',
    heroImg: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=1600&auto=format&fit=crop'
  },
  'telescopes-technology': {
    name: 'Telescopes & Technology',
    slug: 'telescopes-technology',
    desc: 'Cutting-edge optical arrays, space telescopes, quantum sensors, and propulsion technologies driving human cosmic discovery.',
    heroImg: 'https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=1600&auto=format&fit=crop'
  },
  'universe': {
    name: 'Universe',
    slug: 'universe',
    desc: 'Stars, deep galaxies, black holes, dark matter, and cosmological mysteries illuminating the origins and fate of spacetime.',
    heroImg: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1600&auto=format&fit=crop'
  },
  'space-exploration': {
    name: 'Space Exploration',
    slug: 'space-exploration',
    desc: 'Missions, astronauts, robotic rovers, and interstellar spacecraft charting the uncharted frontiers beyond Earth.',
    heroImg: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1600&auto=format&fit=crop'
  },
  'skywatching': {
    name: 'Skywatching',
    slug: 'skywatching',
    desc: 'Eclipses, meteor showers, planetary conjunctions, auroras, and practical stargazing guides for night sky observers.',
    heroImg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop'
  },
  'space-culture': {
    name: 'Space Culture',
    slug: 'space-culture',
    desc: 'Space books, cinema, philosophy, art, and the cultural reverberations of our quest to understand humanity’s place in the cosmos.',
    heroImg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop'
  },
  'explainers': {
    name: 'Explainers',
    slug: 'explainers',
    desc: 'Astronomy guides & science primers',
    heroImg: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1600&auto=format&fit=crop'
  },
  'learn': {
    name: 'Explainers',
    slug: 'explainers',
    desc: 'Astronomy guides & science primers',
    heroImg: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1600&auto=format&fit=crop'
  },
  'people-history': {
    name: 'People & History',
    slug: 'people-history',
    desc: 'Pioneering astronomers, historic space race breakthroughs, and the enduring legacy of thinkers who expanded human perspective.',
    heroImg: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop'
  }
};

export const ALL_CATEGORIES_LIST = [
  CATEGORY_MAP['space-news'],
  CATEGORY_MAP['solar-system'],
  CATEGORY_MAP['telescopes-technology'],
  CATEGORY_MAP['universe'],
  CATEGORY_MAP['space-exploration'],
  CATEGORY_MAP['skywatching'],
  CATEGORY_MAP['space-culture'],
  CATEGORY_MAP['explainers'],
  CATEGORY_MAP['people-history']
];

export const ALL_BLOG_POSTS: BlogPost[] = [
  // 1. Space News
  {
    id: 1,
    category: 'Space News',
    categorySlug: 'space-news',
    title: 'James Webb Resolves First Atmosphere on Rocky Exoplanet',
    desc: 'Spectroscopic analysis reveals traces of carbon dioxide and water vapor on a super-Earth located just 40 light-years from our solar system.',
    authorName: 'Dr. Elena Vance',
    authorImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 26, 2026',
    img: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop',
    readTime: '5 min read',
    featured: true
  },
  {
    id: 2,
    category: 'Space News',
    categorySlug: 'space-news',
    title: 'Laser Communications Relay Breaks Deep-Space Data Record',
    desc: 'Interplanetary laser pulses transmit ultra-high-definition video across 140 million miles, ushering in the era of interplanetary broadband.',
    authorName: 'Marcus Reed',
    authorImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 22, 2026',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
    readTime: '4 min read'
  },
  {
    id: 19,
    category: 'Space News',
    categorySlug: 'space-news',
    title: 'Solar Orbiter Captures Unprecedented Polar Corona Dynamics',
    desc: 'ESA-NASA probe swoops over the sun’s unmapped polar magnetic vortices, uncovering turbulent dynamo plasma currents.',
    authorName: 'Dr. Elena Vance',
    authorImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 18, 2026',
    img: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=1000&auto=format&fit=crop',
    readTime: '6 min read'
  },

  // 2. Solar System
  {
    id: 3,
    category: 'Solar System',
    categorySlug: 'solar-system',
    title: 'When the Sun Disappears: Physics of Solar Eclipses',
    desc: 'A scientific journey into the celestial mechanics of total solar eclipses and how they continue to unlock the mysteries of the solar corona.',
    authorName: 'Alan Turing',
    authorImg: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 15, 2026',
    img: 'https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=1000&auto=format&fit=crop',
    readTime: '7 min read',
    featured: true
  },
  {
    id: 4,
    category: 'Solar System',
    categorySlug: 'solar-system',
    title: 'Subsurface Oceans of Europa: Plumes Detected by Clipper',
    desc: 'Fresh spectroscopic readings confirm vapor geysers erupting through the icy crust of Jupiter’s moon, pointing to hydrothermal ocean vents.',
    authorName: 'Dr. Elena Vance',
    authorImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 12, 2026',
    img: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=1000&auto=format&fit=crop',
    readTime: '5 min read'
  },
  {
    id: 20,
    category: 'Solar System',
    categorySlug: 'solar-system',
    title: 'Saturn’s Vanishing Rings: Cosmic Clock Ticking on Ring Rain',
    desc: 'Water ice is raining down into Saturn at Olympic swimming pool rates per half-hour. Here is how long the rings have left.',
    authorName: 'Jane Smith',
    authorImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    date: 'Aug 29, 2026',
    img: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop',
    readTime: '4 min read'
  },

  // 3. Telescopes & Technology
  {
    id: 5,
    category: 'Telescopes & Technology',
    categorySlug: 'telescopes-technology',
    title: 'Nancy Grace Roman Telescope: Unfolding the Cosmic Dawn',
    desc: 'NASA’s revolutionary wide-field infrared observatory will map dark energy and survey billions of galaxies 100 times faster than Hubble.',
    authorName: 'Jane Smith',
    authorImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 20, 2026',
    img: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop',
    readTime: '6 min read',
    featured: true
  },
  {
    id: 6,
    category: 'Telescopes & Technology',
    categorySlug: 'telescopes-technology',
    title: 'Next-Gen Quantum Gravimeters in Low Earth Orbit',
    desc: 'Cold-atom quantum sensors detect micro-gravitational anomalies from orbit, providing real-time maps of planetary mass shifts.',
    authorName: 'David Chen',
    authorImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    date: 'Aug 18, 2026',
    img: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1000&auto=format&fit=crop',
    readTime: '5 min read'
  },

  // 4. Universe
  {
    id: 7,
    category: 'Universe',
    categorySlug: 'universe',
    title: 'The Nursery of New Stars: Inside the Pillars of Creation',
    desc: 'Deep within clouds of interstellar dust, gravitational whispers give birth to newborn suns in the fiery crucibles of deep space.',
    authorName: 'Dr. Elena Vance',
    authorImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 24, 2026',
    img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop',
    readTime: '6 min read',
    featured: true
  },
  {
    id: 8,
    category: 'Universe',
    categorySlug: 'universe',
    title: 'Echoes of the Big Bang: Acoustic Horizons in Cosmic Light',
    desc: 'The cosmic microwave background radiation still bears the imprint of primordial sound waves that seeded the galactic cosmic web.',
    authorName: 'Ada Lovelace',
    authorImg: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    date: 'Aug 28, 2026',
    img: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop',
    readTime: '8 min read'
  },

  // 5. Space Exploration
  {
    id: 9,
    category: 'Space Exploration',
    categorySlug: 'space-exploration',
    title: 'Mapping the Unknown: Interstellar Probes Beyond the Heliopause',
    desc: 'How the next generation of ion-drive probes will cross the boundary between our sun’s solar wind and the pristine galactic medium.',
    authorName: 'Carl Sagan',
    authorImg: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 05, 2026',
    img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1000&auto=format&fit=crop',
    readTime: '6 min read',
    featured: true
  },
  {
    id: 10,
    category: 'Space Exploration',
    categorySlug: 'space-exploration',
    title: 'Artemis III: Setting Foot on the Lunar South Pole',
    desc: 'Astronauts prepare to land inside permanently shadowed craters at the Moon’s south pole to harvest primordial water ice.',
    authorName: 'Sarah Jenkins',
    authorImg: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
    date: 'Aug 15, 2026',
    img: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1000&auto=format&fit=crop',
    readTime: '5 min read'
  },

  // 6. Skywatching
  {
    id: 11,
    category: 'Skywatching',
    categorySlug: 'skywatching',
    title: 'Perseid Meteor Shower Guide: Catching Cosmic Dust',
    desc: 'A comprehensive field guide to observing Earth’s annual plunge through the cometary dust trail of 109P/Swift-Tuttle.',
    authorName: 'Aria Thorne',
    authorImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 08, 2026',
    img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop',
    readTime: '4 min read',
    featured: true
  },
  {
    id: 12,
    category: 'Skywatching',
    categorySlug: 'skywatching',
    title: 'Auroral Storms: Solar Maximum Lights the High Latitudes',
    desc: 'Powerful coronal mass ejections unleash geomagnetic storms that ignite curtains of emerald and violet luminescence across the upper atmosphere.',
    authorName: 'Alan Turing',
    authorImg: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
    date: 'Aug 20, 2026',
    img: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?q=80&w=1000&auto=format&fit=crop',
    readTime: '5 min read'
  },

  // 7. Space Culture
  {
    id: 13,
    category: 'Space Culture',
    categorySlug: 'space-culture',
    title: 'Carl Sagan’s Pale Blue Dot at 35: A Modern Reflection',
    desc: 'Reflecting on Voyager 1’s iconic backward glance, and why planetary humility remains humanity’s most vital philosophical anchor.',
    authorName: 'Carl Sagan',
    authorImg: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 02, 2026',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
    readTime: '7 min read',
    featured: true
  },
  {
    id: 14,
    category: 'Space Culture',
    categorySlug: 'space-culture',
    title: 'The Architecture of Sci-Fi: From 2001 to Interstellar',
    desc: 'How cinema’s boldest storytellers teamed with astrophysicists to envision rotating toroidal habitats and mathematically exact black holes.',
    authorName: 'Maya Lin',
    authorImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    date: 'Jul 25, 2026',
    img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1000&auto=format&fit=crop',
    readTime: '6 min read'
  },

  // 8. Explainers
  {
    id: 15,
    category: 'Explainers',
    categorySlug: 'explainers',
    title: 'Gravitational Lensing: Nature’s Cosmic Magnifying Glass',
    desc: 'Explore how General Relativity predicts the bending of light by massive galaxies, revealing ancient protogalaxies at the edge of time.',
    authorName: 'Marie Curie',
    authorImg: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
    date: 'Sep 10, 2026',
    img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop',
    readTime: '5 min read',
    featured: true
  },
  {
    id: 16,
    category: 'Explainers',
    categorySlug: 'explainers',
    title: 'Stellar Nucleosynthesis: How Dying Stars Forged Us',
    desc: 'From core hydrogen fusion to the violent nucleosynthesis of supernovae, discover how the periodic table was minted in stellar furnaces.',
    authorName: 'Dr. Elena Vance',
    authorImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    date: 'Aug 10, 2026',
    img: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop',
    readTime: '6 min read'
  },

  // 9. People & History
  {
    id: 17,
    category: 'People & History',
    categorySlug: 'people-history',
    title: 'The Women Who Calculated the Stars: Harvard Computers',
    desc: 'How Henrietta Leavitt, Annie Jump Cannon, and Williamina Fleming decoded stellar spectra and unlocked the true scale of the universe.',
    authorName: 'Ada Lovelace',
    authorImg: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    date: 'Aug 02, 2026',
    img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
    readTime: '7 min read',
    featured: true
  },
  {
    id: 18,
    category: 'People & History',
    categorySlug: 'people-history',
    title: 'Voyager’s Golden Record: Humankind’s Time Capsule in Deep Space',
    desc: 'A message in an interstellar bottle: the story behind the gold-plated copper disc carrying sounds of Earth across the galactic silence.',
    authorName: 'Carl Sagan',
    authorImg: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
    date: 'Jul 15, 2026',
    img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    readTime: '8 min read'
  }
];

export const getCategoryBySlug = (slug?: string): CategoryInfo => {
  if (!slug) return CATEGORY_MAP['space-news'];
  const s = slug.toLowerCase();
  if (s === 'learn' || s === 'explainers') {
    return CATEGORY_MAP['explainers'];
  }
  return CATEGORY_MAP[s] || {
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    slug,
    desc: 'Explore curated articles and observational dispatches in this astronomical topic.',
    heroImg: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop'
  };
};

export const getPostsByCategorySlug = (slug?: string): BlogPost[] => {
  if (!slug) return ALL_BLOG_POSTS;
  const s = slug.toLowerCase();
  return ALL_BLOG_POSTS.filter(p => {
    const pSlug = p.categorySlug.toLowerCase();
    return pSlug === s || ((s === 'explainers' || s === 'learn') && (pSlug === 'explainers' || pSlug === 'learn'));
  });
};
