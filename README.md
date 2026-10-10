# ZWOSMOS - Look Up. Think Beyond.

A premium cosmic-themed blog and space exploration platform built with React, Three.js, and Supabase. Featuring immersive 3D visuals, a full CMS-powered blog, and a modern admin dashboard.

**Live:** [zwosmos.com](https://zwosmos.com)

---
## ✨ Features

### 🚀 Blog Platform
- **Dynamic Blog Engine** — Powered by `@zwantum/blog` CMS with full Supabase backend
- **Rich Blog Posts** — Full-featured article pages with author profiles, tags, categories, reading time, and table of contents
- **Live Search** — Instant search-as-you-type with post and category suggestions
- **Category & Tag Pages** — Filterable content by topic categories and tags
- **Author Pages** — Dedicated author profile pages with published works
- **RSS Feed** — Auto-generated RSS feed for subscribers

### 🎨 Design & UX
- **Cosmic Theme** — Dark/light mode with a space-inspired purple aesthetic
- **Glassmorphism UI** — Frosted glass panels, glowing accents, and smooth gradients
- **Responsive Design** — Optimized for desktop, tablet, and mobile viewports
- **Mega Menu** — Hover-activated dropdown with category navigation and imagery
- **Micro-Animations** — Smooth transitions, hover effects, and interactive elements
- **Share Widget** — Social sharing (X, Facebook, LinkedIn, Copy Link) on every blog post

### 🌍 Interactive 3D Experience
- **Aurora Background** — WebGL-powered animated cosmic aurora
- **3D Hero Section** — Immersive space visuals with Three.js and React Three Fiber
- **Scroll-to-Top** — Animated navigation with cosmic styling

### 📚 Content Sections
- **Daily Cosmic Facts** — A new space fact every day
- **Books Page** — Curated space and science book recommendations
- **Content Sections** — Rich editorial layouts for featured stories

### 🔧 Admin Dashboard (`/admin`)
- **Blog Management** — Create, edit, and publish blog posts with TipTap rich text editor
- **Facts Manager** — CRUD for daily cosmic facts
- **Books Manager** — Manage book recommendations
- **Settings Manager** — Site-wide configuration and SEO settings
- **Push Notifications** — Send notifications to subscribers
- **Auth** — Secure Supabase authentication

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **3D Graphics** | Three.js, React Three Fiber, Drei |
| **Routing** | React Router v7 |
| **Animations** | GSAP |
| **Backend** | Supabase (Auth, Database, Storage) |
| **CMS** | `@zwantum/blog` |
| **Rich Text Editor** | TipTap |
| **State** | Zustand |
| **Build** | Vite |
| **Analytics** | Vercel Analytics |
| **Fonts** | Orbitron, Playfair Display, Lora |

---

## 📁 Project Structure

```
src/
├── admin/              # Admin dashboard (CMS)
│   ├── AdminApp.tsx        # Admin router
│   ├── AdminDashboard.tsx  # Dashboard home
│   ├── BlogsManager.tsx    # Blog CRUD
│   ├── BooksManager.tsx    # Books CRUD
│   ├── FactsManager.tsx    # Daily facts CRUD
│   ├── SettingsManager.tsx # Site settings
│   ├── TiptapEditor.tsx    # Rich text editor
│   └── Auth.tsx            # Authentication
├── data/               # Static data & blog data
├── lib/                # Service layer
│   ├── blogClient.ts       # Blog API client
│   ├── booksService.ts     # Books service
│   ├── cosmicService.ts    # Daily cosmic facts
│   ├── rssService.ts       # RSS generation
│   ├── seoService.ts       # SEO utilities
│   └── settingsService.ts  # Settings service
├── ui/                 # Frontend components
│   ├── Header.tsx          # Navigation + search
│   ├── MegaMenu.tsx        # Category mega menu
│   ├── HeroSection.tsx     # 3D hero
│   ├── BlogIndexPage.tsx   # Blog listing
│   ├── BlogPostPage.tsx    # Single blog post
│   ├── CategoryPage.tsx    # Category filter
│   ├── TagPage.tsx         # Tag filter
│   ├── AuthorPage.tsx      # Author profile
│   ├── BooksPage.tsx       # Books section
│   ├── Footer.tsx          # Site footer
│   └── Aurora.tsx          # WebGL aurora
├── contexts/           # Theme context
└── App.tsx             # Root app + routing
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18.0.0
- npm ≥ 9.0.0

### Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment** — Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Run development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

---

## 📄 Database Migrations

Supabase migrations are in `supabase/migrations/`:
- `00003_create_books.sql` — Books table
- `00004_create_site_settings.sql` — Site settings
- `00005_create_daily_cosmic.sql` — Daily cosmic facts

---
## 📝 License

MIT

