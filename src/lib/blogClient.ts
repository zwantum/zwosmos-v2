import { createClient } from '@supabase/supabase-js';
import { createBlogClient, SupabaseDatabaseAdapter } from '@zwantum/blog/core';
import { SupabaseStorageAdapter } from '@zwantum/blog/storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class EnhancedSupabaseDatabaseAdapter extends SupabaseDatabaseAdapter {
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

  async createTag(input: any) {
    const { no_index, ...cleanInput } = input;
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
    const result = await super.getPosts(params);
    if (result?.data) {
      result.data = result.data.map((p: any) => this.enrichPost(p));
    }
    return result;
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
