-- Create the Books table
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    year INTEGER DEFAULT 2024,
    pages INTEGER DEFAULT 300,
    rating NUMERIC(3, 1) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 100,
    price TEXT DEFAULT '',
    "desc" TEXT NOT NULL,
    long_desc TEXT,
    gradient TEXT DEFAULT 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
    spine_color TEXT DEFAULT '#3f3f46',
    accent_color TEXT DEFAULT '#a855f7',
    tags TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT FALSE,
    buy_url TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Enable read access for all users" ON public.books FOR SELECT USING (true);

-- Admin modifying policies
CREATE POLICY "Enable insert for authenticated users only" ON public.books FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.books FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.books FOR DELETE TO authenticated USING (true);
