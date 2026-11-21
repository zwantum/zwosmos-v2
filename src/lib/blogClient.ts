import { createClient } from '@supabase/supabase-js';
import { createBlogClient, SupabaseDatabaseAdapter } from '@zwantum/blog/core';
import { SupabaseStorageAdapter } from '@zwantum/blog/storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getDefaultFeaturedImage(): string {
  try {
    if (typeof window !== 'undefined') {
      const custom = localStorage.getItem('zw_default_featured_image');
      if (custom && custom.trim()) return custom.trim();
      const zw = localStorage.getItem('zwosmos_site_settings');
      if (zw) {
        const parsed = JSON.parse(zw);
        if (parsed.defaultFeaturedImageUrl && parsed.defaultFeaturedImageUrl.trim()) {
          return parsed.defaultFeaturedImageUrl.trim();
        }
      }
    }
  } catch {}
  return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop';
}

class EnhancedSupabaseDatabaseAdapter extends SupabaseDatabaseAdapter {
  private cachedDefaultFeaturedImageUrl?: string;

  private isUuid(val: unknown): val is string {
    return (
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
    );
  }

  private async sanitizePostInput(input: any): Promise<any> {
    const cleanInput = { ...input };
    const rawClient: any = (this as any).client;

    // 1. Resolve featured_image_id and prevent foreign key constraint violations
    const mediaObj = cleanInput.featured_image;
    const rawImageId = cleanInput.featured_image_id || mediaObj?.id;
    let resolvedImageId: string | null = null;

    if (this.isUuid(rawImageId)) {
      try {
        const { data } = await rawClient
          .from('blog_media')
          .select('id')
          .eq('id', rawImageId)
          .maybeSingle();

        if (data?.id) {
          resolvedImageId = data.id;
        }
      } catch (err) {
        console.warn('Error checking existing blog_media id:', err);
      }
    }

    // If ID was not found in blog_media, but we have a media URL, look up or insert into blog_media
    if (!resolvedImageId && mediaObj?.url && typeof mediaObj.url === 'string') {
      try {
        const { data: existingByUrl } = await rawClient
          .from('blog_media')
          .select('id')
          .eq('url', mediaObj.url)
          .maybeSingle();

        if (existingByUrl?.id) {
          resolvedImageId = existingByUrl.id;
        } else {
          const filename = mediaObj.filename || mediaObj.name || `image_${Date.now()}.jpg`;
          const { data: newMedia, error: insertErr } = await rawClient
            .from('blog_media')
            .insert({
              filename,
              original_name: mediaObj.original_name || filename,
              url: mediaObj.url,
              mime_type: mediaObj.mime_type || 'image/jpeg',
              file_size: mediaObj.file_size || mediaObj.size || 1024,
              alt_text: mediaObj.alt_text || '',
              title: mediaObj.title || filename,
              caption: mediaObj.caption || '',
              description: '',
              storage_provider: mediaObj.storage_provider || 'supabase',
              storage_path: mediaObj.storage_path || `uploads/${filename}`,
              metadata: {},
            })
            .select('id')
            .maybeSingle();

          if (!insertErr && newMedia?.id) {
            resolvedImageId = newMedia.id;
          }
        }
      } catch (err) {
        console.warn('Error upserting into blog_media:', err);
      }
    }

    // Set sanitized featured_image_id (null if no verified row exists in blog_media)
    cleanInput.featured_image_id = resolvedImageId;

    // Preserve media URL in custom_fields and seo so the article never loses its image
    if (mediaObj?.url) {
      cleanInput.custom_fields = {
        ...(cleanInput.custom_fields || {}),
        featured_image_url: mediaObj.url,
        featured_image_alt: mediaObj.alt_text || '',
      };
      if (cleanInput.seo) {
        cleanInput.seo.og_image_url = cleanInput.seo.og_image_url || mediaObj.url;
      }
    }

    // 2. Validate author_id to prevent author foreign key violations
    if (this.isUuid(cleanInput.author_id)) {
      try {
        const { data: author } = await rawClient
          .from('blog_authors')
          .select('id')
          .eq('id', cleanInput.author_id)
          .maybeSingle();

        if (!author?.id) {
          // Fallback to any active author
          const { data: fallbackAuthor } = await rawClient
            .from('blog_authors')
            .select('id')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          cleanInput.author_id = fallbackAuthor?.id || null;
        }
      } catch {
        cleanInput.author_id = null;
      }
    }

    // 3. Verify category_ids exist to prevent junction errors
    if (Array.isArray(cleanInput.category_ids) && cleanInput.category_ids.length > 0) {
      try {
        const validUuids = cleanInput.category_ids.filter((id: any) => this.isUuid(id));
        if (validUuids.length > 0) {
          const { data: existingCats } = await rawClient
            .from('blog_categories')
            .select('id')
            .in('id', validUuids);
          cleanInput.category_ids = (existingCats || []).map((c: any) => c.id);
        } else {
          cleanInput.category_ids = [];
        }
      } catch {
        cleanInput.category_ids = [];
      }
    }

    // 4. Verify tag_ids exist
    if (Array.isArray(cleanInput.tag_ids) && cleanInput.tag_ids.length > 0) {
      try {
        const validUuids = cleanInput.tag_ids.filter((id: any) => this.isUuid(id));
        if (validUuids.length > 0) {
          const { data: existingTags } = await rawClient
            .from('blog_tags')
            .select('id')
            .in('id', validUuids);
          cleanInput.tag_ids = (existingTags || []).map((t: any) => t.id);
        } else {
          cleanInput.tag_ids = [];
        }
      } catch {
        cleanInput.tag_ids = [];
      }
    }

    // 5. Clean title: strip any raw HTML tags (e.g. pasted <p dir="auto">...</p> from ChatGPT)
    if (typeof cleanInput.title === 'string') {
      cleanInput.title = this.cleanText(cleanInput.title);
    }

    // 6. Manage published_at timestamp
    if (cleanInput.status === 'published') {
      if (!cleanInput.published_at) {
        cleanInput.published_at = new Date().toISOString();
      }
    } else if (cleanInput.status === 'draft') {
      cleanInput.published_at = null;
    }

    return cleanInput;
  }

  private cleanText(str: unknown): string {
    if (typeof str !== 'string') return '';
    return str
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private enrichPost(post: any): any {
    if (!post) return post;

    // Clean any residual HTML from title
    if (typeof post.title === 'string' && post.title.includes('<')) {
      post.title = this.cleanText(post.title);
    }

    // Ensure published articles always have a valid published_at date
    if (post.status === 'published' && !post.published_at) {
      post.published_at = post.created_at || post.updated_at || new Date().toISOString();
    }

    if (!post.featured_image && (post.custom_fields?.featured_image_url || post.seo?.og_image_url)) {
      const url = post.custom_fields?.featured_image_url || post.seo?.og_image_url;
      post.featured_image = {
        id: post.featured_image_id || `custom-${post.id}`,
        url,
        filename: url.split('/').pop() || 'featured-image.jpg',
        original_name: 'featured-image.jpg',
        mime_type: 'image/jpeg',
        file_size: 0,
        alt_text: post.custom_fields?.featured_image_alt || post.title || '',
        storage_provider: 'external',
        storage_path: url,
        created_at: post.created_at || new Date().toISOString(),
        updated_at: post.updated_at || new Date().toISOString(),
      };
    } else if (!post.featured_image) {
      const fallbackUrl = this.cachedDefaultFeaturedImageUrl || getDefaultFeaturedImage();
      if (fallbackUrl) {
        post.featured_image = {
          id: `default-${post.id}`,
          url: fallbackUrl,
          filename: 'default-featured-image.jpg',
          original_name: 'default-featured-image.jpg',
          mime_type: 'image/jpeg',
          file_size: 0,
          alt_text: post.title || 'Featured Image',
          storage_provider: 'external',
          storage_path: fallbackUrl,
          created_at: post.created_at || new Date().toISOString(),
          updated_at: post.updated_at || new Date().toISOString(),
        };
      }
    }
    return post;
  }

  async createCategory(input: any) {
    // Strip client-only fields like `no_index` if not present in DB schema
    const { no_index, ...cleanInput } = input;
    try {
      return await super.createCategory(cleanInput);
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      throw new Error(msg);
    }
  }

  async updateCategory(id: string, input: any) {
    const { no_index, ...cleanInput } = input;
    try {
      return await super.updateCategory(id, cleanInput);
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      throw new Error(msg);
    }
  }

  async getAllCategories(): Promise<any[]> {
    const rawClient: any = (this as any).client;
    try {
      const { data: categories, error } = await rawClient
        .from('blog_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (!categories || categories.length === 0) return [];

      try {
        const { data: relations } = await rawClient
          .from('blog_post_categories')
          .select('category_id');

        if (relations && relations.length > 0) {
          const counts: Record<string, number> = {};
          for (const rel of relations) {
            if (rel.category_id) {
              counts[rel.category_id] = (counts[rel.category_id] || 0) + 1;
            }
          }
          return categories.map((c: any) => ({
            ...c,
            post_count: counts[c.id] || 0,
          }));
        }
      } catch (countErr) {
        console.warn('Could not load category counts from blog_post_categories:', countErr);
      }

      return categories.map((c: any) => ({ ...c, post_count: c.post_count || 0 }));
    } catch {
      return await super.getAllCategories();
    }
  }

  async getAllTags(): Promise<any[]> {
    const rawClient: any = (this as any).client;
    try {
      const { data: tags, error } = await rawClient
        .from('blog_tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      if (!tags || tags.length === 0) return [];

      try {
        const { data: relations } = await rawClient
          .from('blog_post_tags')
          .select('tag_id');

        if (relations && relations.length > 0) {
          const counts: Record<string, number> = {};
          for (const rel of relations) {
            if (rel.tag_id) {
              counts[rel.tag_id] = (counts[rel.tag_id] || 0) + 1;
            }
          }
          return tags.map((t: any) => ({
            ...t,
            post_count: counts[t.id] || 0,
          }));
        }
      } catch (countErr) {
        console.warn('Could not load tag counts from blog_post_tags:', countErr);
      }

      return tags.map((t: any) => ({ ...t, post_count: t.post_count || 0 }));
    } catch {
      return await super.getAllTags();
    }
  }

  async createTag(input: any) {
    const { no_index, ...cleanInput } = input;
    if (!cleanInput.robots) {
      cleanInput.robots = 'index,follow';
    }
    try {
      return await super.createTag(cleanInput);
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      throw new Error(msg);
    }
  }

  async updateTag(id: string, input: any) {
    const { no_index, ...cleanInput } = input;
    try {
      return await super.updateTag(id, cleanInput);
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      throw new Error(msg);
    }
  }

  private async ensureSingleFeaturedPost(excludeId?: string) {
    const rawClient: any = (this as any).client;
    try {
      let query = rawClient
        .from('blog_posts')
        .update({ is_featured: false })
        .eq('is_featured', true);

      if (excludeId && this.isUuid(excludeId)) {
        query = query.neq('id', excludeId);
      }
      await query;
    } catch (err) {
      console.warn('Could not reset previous featured posts:', err);
    }
  }

  async createPost(input: any) {
    try {
      const sanitized = await this.sanitizePostInput(input);
      if (sanitized.is_featured) {
        await this.ensureSingleFeaturedPost();
      }
      const post = await super.createPost(sanitized);
      return this.enrichPost(post);
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      throw new Error(msg);
    }
  }

  async updatePost(id: string, input: any) {
    try {
      const sanitized = await this.sanitizePostInput(input);
      if (sanitized.is_featured) {
        await this.ensureSingleFeaturedPost(id);
      }
      const post = await super.updatePost(id, sanitized);
      return this.enrichPost(post);
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      throw new Error(msg);
    }
  }

  async getPosts(params?: any) {
    const rawClient: any = (this as any).client || supabase;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = rawClient.from('blog_posts').select(
      '*, author:blog_authors(*), featured_image:blog_media(*), categories:blog_categories(*), tags:blog_tags(*), seo:blog_post_seo(*)',
      { count: 'exact' }
    );

    // 1. Trashed and status handling
    if (!params?.includeTrashed) {
      query = query.is('deleted_at', null).neq('status', 'trash');
    }
    if (params?.status && params.status !== 'all') {
      if (Array.isArray(params.status)) {
        query = query.in('status', params.status);
      } else {
        query = query.eq('status', params.status);
      }
    }

    if (params?.isFeatured !== undefined) {
      query = query.eq('is_featured', params.isFeatured);
    }

    // 2. Author Filter (handles both UUID and Author Name)
    if (params?.authorId && params.authorId !== 'all') {
      let authorId = params.authorId;
      if (!this.isUuid(authorId)) {
        try {
          const { data: authors } = await rawClient
            .from('blog_authors')
            .select('id')
            .ilike('name', authorId)
            .limit(1);
          if (authors && authors[0]?.id) {
            authorId = authors[0].id;
          }
        } catch {}
      }
      if (this.isUuid(authorId)) {
        query = query.eq('author_id', authorId);
      }
    }

    // 3. Category Filter (handles Category ID, Name, or Slug via junction table)
    if (params?.categoryId && params.categoryId !== 'all') {
      let catId = params.categoryId;
      if (!this.isUuid(catId)) {
        try {
          const { data: cat } = await rawClient
            .from('blog_categories')
            .select('id')
            .ilike('name', catId)
            .limit(1);
          if (cat && cat[0]?.id) {
            catId = cat[0].id;
          }
        } catch {}
      }

      if (this.isUuid(catId)) {
        try {
          const { data: rels } = await rawClient
            .from('blog_post_categories')
            .select('post_id')
            .eq('category_id', catId);
          const postIds = (rels || []).map((r: any) => r.post_id).filter(Boolean);
          if (postIds.length === 0) {
            return {
              data: [],
              page,
              limit,
              total: 0,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            };
          }
          query = query.in('id', postIds);
        } catch (catRelErr) {
          console.warn('Could not query category post relations:', catRelErr);
        }
      }
    }

    // 4. Search Filter (searches both title and slug)
    if (params?.search && typeof params.search === 'string' && params.search.trim()) {
      const term = params.search.trim().replace(/['"]/g, '');
      query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
    }

    // 5. Date Range Filter
    if (params?.startDate) {
      query = query.gte('published_at', params.startDate);
    }
    if (params?.endDate) {
      query = query.lte('published_at', params.endDate);
    }

    // 6. Ordering & Pagination
    const sortField = params?.sortBy || 'published_at';
    const ascending = params?.sortOrder === 'asc';
    query = query.order(sortField, { ascending, nullsFirst: false });
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error in enhanced getPosts:', error);
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const enrichedData = (data || []).map((p: any) => this.enrichPost(p));

    return {
      data: enrichedData,
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async updateSettings(settings: any, key = 'general') {
    if (settings && typeof settings === 'object' && settings.defaultFeaturedImageUrl !== undefined) {
      this.cachedDefaultFeaturedImageUrl = settings.defaultFeaturedImageUrl;
    }
    return await super.updateSettings(settings, key);
  }

  async getSettings(key = 'general') {
    const data: any = await super.getSettings(key);
    if (data?.defaultFeaturedImageUrl) {
      this.cachedDefaultFeaturedImageUrl = data.defaultFeaturedImageUrl;
    }
    return data;
  }

  async getPostById(id: string) {
    const post = await super.getPostById(id);
    return this.enrichPost(post);
  }

  async getPostBySlug(slug: string) {
    const post = await super.getPostBySlug(slug);
    return this.enrichPost(post);
  }
}

export const blogClient = createBlogClient({
  db: new EnhancedSupabaseDatabaseAdapter(supabase as any),
  storage: new SupabaseStorageAdapter(supabase as any, { defaultBucket: 'blog-media' }),
});
