import React, { useState, useEffect, useRef } from 'react';
import { Post, PostCreateInput, PostStatus, Category, Tag, Author, Media, PostSEO } from '@zwantum/blog-types';
import { BlogClient, stripHtml } from '@zwantum/blog-core';
import { BlogEditor } from '@zwantum/blog-editor';
import { SEOHealthBadge } from '../components/SEOHealthBadge';
import { RevisionHistoryModal } from '../components/RevisionHistoryModal';

export interface PostEditorProps {
  client: BlogClient;
  postId?: string; // If undefined, creates a new post
  onSaveSuccess?: (post: Post) => void;
  onBack?: () => void;
  onOpenMediaLibrary?: (onSelect: (media: Media) => void) => void;
  className?: string;
}

export const PostEditor: React.FC<PostEditorProps> = ({
  client,
  postId,
  onSaveSuccess,
  onBack,
  onOpenMediaLibrary,
  className = '',
}) => {
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugCustomized, setSlugCustomized] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  const [contentHtml, setContentHtml] = useState<string>('');
  const editorRef = useRef<any>(null);
  const contentJsonRef = useRef<Record<string, unknown>>({ type: 'doc', content: [{ type: 'paragraph' }] });
  const contentHtmlRef = useRef<string>('');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [tagInputValue, setTagInputValue] = useState('');
  const [featuredMedia, setFeaturedMedia] = useState<Media | null>(null);

  // SEO State
  const [seo, setSeo] = useState<Partial<PostSEO>>({
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    canonical_url: '',
    robots: 'index,follow',
    schema_type: 'Article',
  });

  // Reference Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  // Load Reference Data
  useEffect(() => {
    Promise.all([
      client.categories.getAll(),
      client.tags.getAll(),
      client.authors.getAll(),
    ]).then(([cats, tgs, auths]) => {
      setCategories(cats);
      setTags(tgs);
      setAuthors(auths);
      if (auths && auths.length > 0) {
        setSelectedAuthorId((prev) => prev || auths[0].id);
      }
    });
  }, [client]);

  // Load Existing Post
  useEffect(() => {
    if (postId) {
      setLoading(true);
      client.posts
        .getById(postId)
        .then((post) => {
          if (post) {
            setTitle(post.title || '');
            setSlug(post.slug || '');
            setSlugCustomized(true);
            setExcerpt(post.excerpt || '');
            const contentHasCit = JSON.stringify(post.content || '').includes('citation');
            const htmlHasCit = Boolean(post.content_html && (post.content_html.includes('zw-blog-citation') || post.content_html.includes('data-citation')));
            if (htmlHasCit && !contentHasCit && post.content_html) {
              setContentJson(post.content_html as any);
            } else {
              setContentJson(post.content || { type: 'doc', content: [] });
            }
            if (post.content_html) {
              setContentHtml(post.content_html);
              contentHtmlRef.current = post.content_html;
            }
            setStatus(post.status);
            setIsFeatured(post.is_featured);
            setScheduledAt(post.scheduled_at ? post.scheduled_at.slice(0, 16) : '');
            const postAuthorId = post.author_id || (post as any).author?.id;
            if (postAuthorId) {
              setSelectedAuthorId(postAuthorId);
            }
            setSelectedCategoryIds(post.categories?.map((c) => c.id) || []);
            setTagNames(post.tags?.map((t: any) => t.name || '').filter(Boolean) || []);
            if (post.featured_image) {
              const customCap = (post.custom_fields as any)?.featured_image_caption ?? (post.custom_fields as any)?.image_caption ?? (post.custom_fields as any)?.caption;
              const cap = customCap !== undefined && customCap !== null ? String(customCap) : (post.featured_image.caption || '');
              setFeaturedMedia({ ...post.featured_image, caption: cap });
            } else if ((post.custom_fields as any)?.featured_image_url) {
              const customCap = (post.custom_fields as any)?.featured_image_caption ?? (post.custom_fields as any)?.image_caption ?? (post.custom_fields as any)?.caption;
              const cap = customCap !== undefined && customCap !== null ? String(customCap) : '';
              setFeaturedMedia({
                id: (post.custom_fields as any)?.featured_image_id || '',
                url: (post.custom_fields as any).featured_image_url,
                caption: cap,
                alt_text: (post.custom_fields as any)?.featured_image_alt || '',
                filename: 'featured-image',
                original_name: 'featured-image',
                mime_type: 'image/jpeg',
                file_size: 0,
                storage_provider: 'supabase',
                storage_path: '',
                created_at: '',
                updated_at: '',
              } as any);
            } else {
              setFeaturedMedia(null);
            }
            if (post.seo) {
              setSeo(post.seo);
              if (post.seo.meta_title) setMetaTitleCustomized(true);
              if (post.seo.meta_description) setMetaDescCustomized(true);
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [postId, client]);

  const [copiedSlug, setCopiedSlug] = useState(false);
  const [metaTitleCustomized, setMetaTitleCustomized] = useState(false);
  const [metaDescCustomized, setMetaDescCustomized] = useState(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit title content smoothly without clipping
  useEffect(() => {
    const el = titleTextareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
    }
  }, [title]);

  const generateSlug = (text: string) =>
    stripHtml(text)
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const extractContentText = (json: Record<string, unknown> | undefined): string => {
    if (!json) return '';
    const walk = (node: any): string => {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (node.text) return node.text;
      if (Array.isArray(node.content)) {
        return node.content.map(walk).filter(Boolean).join(' ');
      }
      return '';
    };
    return walk(json).replace(/\s+/g, ' ').trim();
  };

  // Auto-slug generation and auto-SEO title from title until user edits them manually
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const plain = stripHtml(val).trim();
    if (!slugCustomized) {
      setSlug(generateSlug(plain));
    }
    if (!metaTitleCustomized) {
      setSeo((prev) => ({ ...prev, meta_title: plain }));
    }
  };

  // Auto-sync SEO description from excerpt or content
  const handleExcerptChange = (val: string) => {
    setExcerpt(val);
    if (!metaDescCustomized) {
      const fallback = val.trim() || extractContentText(contentJson).slice(0, 160);
      setSeo((prev) => ({ ...prev, meta_description: fallback }));
    }
  };

  const handleContentChange = (json: Record<string, unknown>, html?: string) => {
    contentJsonRef.current = json;
    setContentJson(json);
    if (html !== undefined) {
      contentHtmlRef.current = html;
      setContentHtml(html);
    }
    if (!metaDescCustomized && !excerpt.trim()) {
      const extracted = extractContentText(json).slice(0, 160);
      if (extracted) {
        setSeo((prev) => ({ ...prev, meta_description: extracted }));
      }
    }
  };

  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleAddTagsFromText = (text: string) => {
    const parts = text.split(',');
    const newNames = [...tagNames];
    for (const p of parts) {
      const trimmed = p.trim();
      if (trimmed && !newNames.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        newNames.push(trimmed);
      }
    }
    setTagNames(newNames);
  };

  const handleTagInputChange = (val: string) => {
    if (val.includes(',')) {
      handleAddTagsFromText(val);
      setTagInputValue('');
    } else {
      setTagInputValue(val);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInputValue.trim()) {
        handleAddTagsFromText(tagInputValue);
        setTagInputValue('');
      }
    } else if (e.key === 'Backspace' && !tagInputValue && tagNames.length > 0) {
      setTagNames(tagNames.slice(0, -1));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagNames(tagNames.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const featuredImageInputRef = useRef<HTMLInputElement | null>(null);

  const handleFeaturedFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFeaturedMedia({
          id: 'manual-img-' + Date.now(),
          filename: file.name,
          original_name: file.name,
          url: reader.result,
          mime_type: file.type,
          file_size: file.size,
          alt_text: title || file.name,
          storage_provider: 'memory',
          storage_path: reader.result,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (publishNow?: boolean) => {
    const plainTitle = stripHtml(title);
    if (!plainTitle.trim()) {
      alert('Article title is required');
      return;
    }

    setSaving(true);
    try {
      const targetStatus = publishNow === true ? 'published' : (publishNow === false ? 'draft' : status);
      const flushed = editorRef.current?.flush();
      const activeContent = flushed?.json || contentJsonRef.current || contentJson;
      const activeHtml = flushed?.html || contentHtmlRef.current || contentHtml;

      const finalMetaTitle = seo.meta_title?.trim() || stripHtml(title).trim();
      const finalMetaDesc =
        seo.meta_description?.trim() ||
        excerpt.trim() ||
        extractContentText(activeContent).slice(0, 160);

      let existingCustom = {};
      let existingPublishedAt: string | null = null;
      if (postId) {
        try {
          const ep = await client.posts.getById(postId);
          if (ep?.custom_fields) existingCustom = ep.custom_fields;
          if (ep?.published_at) existingPublishedAt = ep.published_at;
        } catch { }
      }

      // Commit any pending tag text from input
      const combinedTagNames = [...tagNames];
      if (tagInputValue.trim() && !combinedTagNames.some((t) => t.toLowerCase() === tagInputValue.trim().toLowerCase())) {
        combinedTagNames.push(tagInputValue.trim());
        setTagNames(combinedTagNames);
        setTagInputValue('');
      }

      // Synchronize and auto-create tags on-the-fly in database
      const finalTagIds: string[] = [];
      let latestTags = tags;
      try {
        const fetched = await client.tags.getAll();
        if (fetched && fetched.length > 0) latestTags = fetched;
      } catch { }

      for (const name of combinedTagNames) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        const found = latestTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
        if (found) {
          if (!finalTagIds.includes(found.id)) finalTagIds.push(found.id);
        } else {
          try {
            const createdTag = await client.tags.create({
              name: trimmed,
              slug: generateSlug(trimmed) || trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            });
            if (createdTag?.id && !finalTagIds.includes(createdTag.id)) {
              finalTagIds.push(createdTag.id);
              latestTags = [...latestTags, createdTag];
            }
          } catch (e) {
            console.warn('Failed to auto-create tag', trimmed, e);
          }
        }
      }
      setTags(latestTags);

      const payload: PostCreateInput & { featured_image?: any } = {
        title: plainTitle || title,
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        content: activeContent,
        content_html: activeHtml || undefined,
        status: targetStatus,
        published_at: targetStatus === 'published' ? (existingPublishedAt || new Date().toISOString()) : null,
        is_featured: isFeatured,
        scheduled_at: targetStatus === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        author_id: selectedAuthorId || null,
        category_ids: selectedCategoryIds,
        tag_ids: finalTagIds,
        featured_image_id: featuredMedia?.id || null,
        featured_image: featuredMedia ? {
          ...featuredMedia,
          caption: featuredMedia.caption?.trim() || '',
          alt_text: featuredMedia.alt_text?.trim() || '',
        } : undefined,
        custom_fields: {
          ...existingCustom,
          featured_image_caption: featuredMedia?.caption?.trim() || '',
          featured_image_url: featuredMedia?.url || '',
          featured_image_alt: featuredMedia?.alt_text?.trim() || '',
        },
        seo: {
          ...seo,
          meta_title: finalMetaTitle,
          meta_description: finalMetaDesc,
        },
      };

      let savedPost: Post;
      if (postId) {
        savedPost = await client.posts.update(postId, payload);
      } else {
        savedPost = await client.posts.create(payload);
      }

      // Clear any cached frontend post so updates show immediately
      try {
        if (savedPost?.id) sessionStorage.removeItem(`zw_post_${savedPost.id}`);
        if (savedPost?.slug) sessionStorage.removeItem(`zw_post_${savedPost.slug}`);
        sessionStorage.removeItem('zw_cached_all_posts');
        localStorage.removeItem('zwosmos_featured_post');
      } catch { }

      if (savedPost?.content) {
        setContentJson(savedPost.content);
        contentJsonRef.current = savedPost.content;
      }
      if (savedPost?.content_html) {
        setContentHtml(savedPost.content_html);
        contentHtmlRef.current = savedPost.content_html;
      }
      if (savedPost?.tags) {
        setTagNames(savedPost.tags.map((t: any) => t.name || '').filter(Boolean) || []);
      }

      setStatus(savedPost.status);
      if (onSaveSuccess) onSaveSuccess(savedPost);
      alert(postId ? 'Article updated successfully!' : (targetStatus === 'published' ? 'Article published successfully!' : 'Draft saved successfully!'));
    } catch (err) {
      alert(`Save failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const plainTitle = stripHtml(title);
    const flushed = editorRef.current?.flush();
    const activeContent = flushed?.json || contentJsonRef.current || contentJson;
    const activeHtml = flushed?.html || contentHtmlRef.current || contentHtml;

    const currentAuthor = authors.find((a) => a.id === selectedAuthorId) || {
      id: selectedAuthorId || 'preview-author',
      name: 'Editorial Team',
      slug: 'editorial-team',
    };

    const currentCategories = categories.filter((c) => selectedCategoryIds.includes(c.id));

    const allActiveTagNames = [...tagNames];
    if (tagInputValue.trim() && !allActiveTagNames.some((t) => t.toLowerCase() === tagInputValue.trim().toLowerCase())) {
      allActiveTagNames.push(tagInputValue.trim());
    }
    const currentTags = allActiveTagNames.map((name) => {
      const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
      return existing || {
        id: 'preview-' + name.toLowerCase(),
        name: name,
        slug: generateSlug(name) || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
    });

    const finalSlug = slug.trim()
      || (plainTitle ? plainTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '')
      || (postId || 'draft-preview');

    const previewPost = {
      id: postId || 'draft-preview',
      slug: finalSlug,
      title: plainTitle || title || 'Untitled Article',
      excerpt: excerpt.trim(),
      content: activeContent,
      content_html: activeHtml,
      status: status || 'draft',
      is_featured: isFeatured,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: currentAuthor,
      author_id: selectedAuthorId,
      categories: currentCategories,
      tags: currentTags,
      featured_image: featuredMedia ? {
        id: featuredMedia.id,
        url: featuredMedia.url,
        alt_text: featuredMedia.alt_text?.trim() || '',
        caption: featuredMedia.caption?.trim() || '',
      } : null,
      custom_fields: {
        featured_image_url: featuredMedia?.url || '',
        featured_image_caption: featuredMedia?.caption?.trim() || '',
        featured_image_alt: featuredMedia?.alt_text?.trim() || '',
      },
      seo: {
        ...seo,
        meta_title: seo.meta_title?.trim() || plainTitle,
        meta_description: seo.meta_description?.trim() || excerpt.trim(),
      },
      reading_time: Math.max(1, Math.ceil(stripHtml(activeHtml || '').split(/\s+/).filter(Boolean).length / 200)),
    };

    try {
      localStorage.setItem(`zw_preview_${finalSlug}`, JSON.stringify(previewPost));
      if (postId) {
        localStorage.setItem(`zw_preview_${postId}`, JSON.stringify(previewPost));
      }
      localStorage.setItem('zw_preview_latest', JSON.stringify(previewPost));
      sessionStorage.setItem(`zw_post_${finalSlug}`, JSON.stringify(previewPost));
      if (postId) {
        sessionStorage.setItem(`zw_post_${postId}`, JSON.stringify(previewPost));
      }
    } catch (e) {
      console.warn('Failed to store preview data in storage', e);
    }

    const previewUrl = `/blog/${finalSlug}?preview=true`;
    window.open(previewUrl, '_blank');
  };

  const handleAutosave = async (newContent: Record<string, unknown>) => {
    if (!newContent) return;
    const isActuallyEmpty = newContent.content && Array.isArray(newContent.content) && newContent.content.length === 1 && !(newContent.content[0] as any).content;
    if (isActuallyEmpty && contentJsonRef.current && Array.isArray((contentJsonRef.current as any).content) && (contentJsonRef.current as any).content.some((c: any) => c.content && c.content.length > 0)) {
      return;
    }
    contentJsonRef.current = newContent;
    setContentJson(newContent);
    if (postId && title.trim()) {
      await client.posts.update(postId, { content: newContent });
    }
  };

  // Live SEO Health Evaluation
  const liveHealth = client.seo.evaluateHealth({
    title,
    slug,
    excerpt,
    word_count: JSON.stringify(contentJson).length > 20 ? 350 : 0,
    author_id: selectedAuthorId,
    featured_image_id: featuredMedia?.id,
    featured_image: featuredMedia,
    seo: {
      ...seo,
      meta_title: seo.meta_title || title,
      meta_description: seo.meta_description || excerpt,
    },
  });

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading post editor...</div>;
  }

  const blogBaseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/blog/`
    : 'https://zwosmos.com/blog/';

  return (
    <div className={`zw-admin-container ${className}`}>
      {/* Top Bar Navigation & Actions */}
      <div className="zw-admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button type="button" className="zw-admin-btn zw-admin-btn-secondary" onClick={onBack}>
              ← Back
            </button>
          )}
          <div>
            <h2 className="zw-admin-title">{postId ? 'Edit Article' : 'Write New Article'}</h2>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Status:{' '}
              <span className={`zw-admin-badge zw-admin-badge-${status}`}>{status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="zw-admin-actions">
          {postId && (
            <button
              type="button"
              className="zw-admin-btn zw-admin-btn-secondary"
              onClick={() => setShowRevisionModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Revisions</span>
            </button>
          )}

          <button
            type="button"
            className="zw-admin-btn zw-admin-btn-secondary"
            onClick={handlePreview}
            title="Preview how this article looks on the live website"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 7 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Preview</span>
          </button>

          <button
            type="button"
            className="zw-admin-btn zw-admin-btn-secondary"
            disabled={saving}
            onClick={() => handleSave(false)}
          >
            Save Draft
          </button>

          <button
            type="button"
            className="zw-admin-btn zw-admin-btn-primary"
            disabled={saving}
            onClick={() => handleSave(postId ? undefined : true)}
          >
            {saving
              ? (postId ? 'Updating...' : 'Publishing...')
              : (postId ? 'Update Article' : 'Publish Article')}
          </button>
        </div>
      </div>

      {/* Main Split Layout: Editor (Left) & Sidebar (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Title, Slug, Tiptap Editor */}
        <div>
          {/* Post Title & URL Card */}
          <div className="zw-admin-card" style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Article Title & Permalink
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: title.trim().length === 0 ? '#94a3b8' : '#64748b',
                  }}
                >
                  {title.trim().length} chars
                </span>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Native Auto-Growing Title Textarea */}
              <textarea
                ref={titleTextareaRef}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter article headline or post title..."
                rows={1}
                style={{
                  width: '100%',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  border: 'none',
                  outline: 'none',
                  color: '#0f172a',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  padding: '2px 0 10px 0',
                  borderBottom: '2px solid #f1f5f9',
                  transition: 'border-color 0.2s ease',
                  minHeight: '4.75rem',
                  lineHeight: 1.35,
                  resize: 'none',
                  overflow: 'hidden',
                  background: 'transparent',
                  boxSizing: 'border-box',
                  display: 'block',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderBottomColor = '#ffcc00';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderBottomColor = '#f1f5f9';
                }}
              />

              {/* Dynamic URL Slug / Permalink Bar */}
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>Permalink:</span>
                  <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>{blogBaseUrl}</span>
                </div>

                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(generateSlug(e.target.value));
                    setSlugCustomized(true);
                  }}
                  placeholder="article-slug"
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#0f172a',
                    background: '#ffffff',
                    flex: 1,
                    minWidth: '180px',
                    maxWidth: '380px',
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                  {slugCustomized && (
                    <button
                      type="button"
                      onClick={() => {
                        setSlug(generateSlug(title));
                        setSlugCustomized(false);
                      }}
                      title="Reset slug to auto-generate from title"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      <span>Reset</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(`${blogBaseUrl}${slug}`);
                        setCopiedSlug(true);
                        setTimeout(() => setCopiedSlug(false), 2000);
                      }
                    }}
                    title="Copy full URL"
                    style={{
                      background: copiedSlug ? '#ecfdf5' : '#ffffff',
                      borderColor: copiedSlug ? '#a7f3d0' : '#e2e8f0',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: copiedSlug ? '#059669' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {copiedSlug ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Body Editor Card with Section Heading */}
          <div className="zw-admin-card" style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Article Content
                </span>
              </div>

            </div>

            {/* Tiptap Rich Text Editor */}
            <BlogEditor
              ref={editorRef}
              content={contentJson}
              onChange={(json: Record<string, unknown>, html: string) => handleContentChange(json, html)}
              onAutosave={handleAutosave}
              onOpenMediaLibrary={() => {
                if (onOpenMediaLibrary) {
                  onOpenMediaLibrary((m) => {
                    if (m && m.url) {
                      editorRef.current?.insertImage?.(m.url, m.alt_text || m.title || '', m.caption || '');
                    }
                  });
                }
              }}
            />
          </div>

          {/* Excerpt Card */}
          <div className="zw-admin-card" style={{ marginTop: '20px' }}>
            <div className="zw-admin-card-header">Article Summary / Excerpt</div>
            <div className="zw-admin-card-body">
              <textarea
                rows={3}
                className="zw-admin-textarea"
                placeholder="Write a concise excerpt to display in cards and search result snippets..."
                value={excerpt}
                onChange={(e) => handleExcerptChange(e.target.value)}
              />
            </div>
          </div>

          {/* SEO & Metadata Card (Moved to Main Panel) */}
          <div className="zw-admin-card" style={{ marginTop: '20px', borderRadius: '16px', overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fffdf5',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#d97706' }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                  SEO & Metadata
                </h3>
              </div>
              <div>
                <SEOHealthBadge report={liveHealth} />
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Focus Keyword */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Focus Keyword
                </label>
                <input
                  type="text"
                  className="zw-admin-input"
                  placeholder="e.g. workspace alignment"
                  value={seo.focus_keyword || ''}
                  onChange={(e) => setSeo({ ...seo, focus_keyword: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* SEO Meta Title */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    SEO Meta Title
                  </label>
                  <span style={{ fontSize: '11.5px', color: (seo.meta_title || '').length > 60 ? '#ef4444' : '#64748b' }}>
                    {(seo.meta_title || '').length}/60 chars
                  </span>
                </div>
                <input
                  type="text"
                  className="zw-admin-input"
                  placeholder="Enter SEO meta title..."
                  value={seo.meta_title || ''}
                  onChange={(e) => {
                    setSeo({ ...seo, meta_title: e.target.value });
                    setMetaTitleCustomized(true);
                  }}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Meta Description */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    Meta Description
                  </label>
                  <span style={{ fontSize: '11.5px', color: (seo.meta_description || '').length > 160 ? '#ef4444' : '#64748b' }}>
                    {(seo.meta_description || '').length}/160 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  className="zw-admin-textarea"
                  placeholder="Enter SEO meta description..."
                  value={seo.meta_description || ''}
                  onChange={(e) => {
                    setSeo({ ...seo, meta_description: e.target.value });
                    setMetaDescCustomized(true);
                  }}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Grid 2 Columns: Canonical URL & Robots Indexing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Canonical URL (Optional Override)
                  </label>
                  <input
                    type="text"
                    className="zw-admin-input"
                    placeholder="Leave blank to use default article URL"
                    value={seo.canonical_url || ''}
                    onChange={(e) => setSeo({ ...seo, canonical_url: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Robots Indexing
                  </label>
                  <select
                    className="zw-admin-select"
                    value={seo.robots || 'index,follow'}
                    onChange={(e) => setSeo({ ...seo, robots: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="index,follow">Index, Follow (Recommended)</option>
                    <option value="noindex,follow">Noindex, Follow</option>
                    <option value="noindex,nofollow">Noindex, Nofollow</option>
                  </select>
                </div>
              </div>

              {/* Google SERP Live Snippet Preview */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginTop: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Google SERP Preview
                  </span>
                  <span style={{ fontSize: '11px', color: (seo.robots || '').includes('noindex') ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                    {(seo.robots || '').includes('noindex') ? '⊘ Noindex' : '✓ Indexable'}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  https://example.com › blog › {slug || 'post-slug'}
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    color: '#1a0dab',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {seo.meta_title || title || 'Untitled Article'}
                </div>
                <div
                  style={{
                    fontSize: '12.5px',
                    color: '#4d5156',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {seo.meta_description || excerpt || 'Article excerpt summary will appear here in search engine results.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Status, Categories, Featured Image */}
        <div>
          {/* Publishing Card */}
          <div className="zw-admin-card">
            <div className="zw-admin-card-header">Publishing & Status</div>
            <div className="zw-admin-card-body">
              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PostStatus)}
                  className="zw-admin-select"
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {status === 'scheduled' && (
                <div className="zw-admin-form-group">
                  <label className="zw-admin-label">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="zw-admin-input"
                  />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Post will automatically publish once this timestamp is reached.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <input
                  type="checkbox"
                  id="feat-checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <label htmlFor="feat-checkbox" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Highlight as Featured Article
                </label>
              </div>
            </div>
          </div>

          {/* Author Card */}
          <div className="zw-admin-card">
            <div className="zw-admin-card-header">Author (E-E-A-T)</div>
            <div className="zw-admin-card-body">
              <select
                value={selectedAuthorId}
                onChange={(e) => setSelectedAuthorId(e.target.value)}
                className="zw-admin-select"
              >
                <option value="">Select Author...</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.designation ? `(${a.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categories & Tags */}
          <div className="zw-admin-card">
            <div className="zw-admin-card-header">Categories & Tags</div>
            <div className="zw-admin-card-body">
              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Categories</label>
                <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}>
                  {categories.map((c) => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', margin: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategoryIds([...selectedCategoryIds, c.id]);
                          } else {
                            setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== c.id));
                          }
                        }}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="zw-admin-form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="zw-admin-label" style={{ margin: 0 }}>Tags</label>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Separate with comma</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#ffffff',
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    cursor: 'text',
                  }}
                  onClick={() => tagInputRef.current?.focus()}
                >
                  {tagNames.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#0f172a',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(tag);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#64748b',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#64748b';
                        }}
                        title={`Remove tag ${tag}`}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </span>
                  ))}

                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInputValue}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    onBlur={() => {
                      if (tagInputValue.trim()) {
                        handleAddTagsFromText(tagInputValue);
                        setTagInputValue('');
                      }
                    }}
                    placeholder={tagNames.length === 0 ? 'Type tags and press comma...' : 'Add tag...'}
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '12.5px',
                      flex: 1,
                      minWidth: '110px',
                      padding: '2px 4px',
                      background: 'transparent',
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="zw-admin-card">
            <div className="zw-admin-card-header">Featured Image</div>
            <div className="zw-admin-card-body">
              <input
                type="file"
                ref={featuredImageInputRef}
                accept="image/*"
                onChange={handleFeaturedFileSelect}
                style={{ display: 'none' }}
              />

              {featuredMedia ? (
                <div>
                  <img
                    src={featuredMedia.url}
                    alt={featuredMedia.alt_text || 'Featured image'}
                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                  />
                  <div className="zw-admin-form-group">
                    <label className="zw-admin-label">Image Alt Text (Crucial for SEO)</label>
                    <input
                      type="text"
                      className="zw-admin-input"
                      value={featuredMedia.alt_text || ''}
                      onChange={(e) => setFeaturedMedia({ ...featuredMedia, alt_text: e.target.value })}
                      placeholder="Descriptive alt text for screen readers & search engines"
                    />
                  </div>

                  <div className="zw-admin-form-group" style={{ marginTop: '10px' }}>
                    <label className="zw-admin-label">Image Caption (Optional)</label>
                    <input
                      type="text"
                      className="zw-admin-input"
                      value={featuredMedia.caption || ''}
                      onChange={(e) => setFeaturedMedia({ ...featuredMedia, caption: e.target.value })}
                      placeholder="Add an editorial caption to display under the image"
                    />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Shows on the blog single page below the image. Leave blank to hide.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="zw-admin-btn zw-admin-btn-primary zw-admin-btn-sm"
                      onClick={() => {
                        if (onOpenMediaLibrary) {
                          onOpenMediaLibrary((selected) => setFeaturedMedia(selected));
                        } else {
                          featuredImageInputRef.current?.click();
                        }
                      }}
                    >
                      🖼️ Media Library
                    </button>
                    <button
                      type="button"
                      className="zw-admin-btn zw-admin-btn-danger zw-admin-btn-sm"
                      onClick={() => setFeaturedMedia(null)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '18px 12px', border: '2px dashed #cbd5e1', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>No featured image set</p>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="zw-admin-btn zw-admin-btn-primary zw-admin-btn-sm"
                      onClick={() => {
                        if (onOpenMediaLibrary) {
                          onOpenMediaLibrary((selected) => setFeaturedMedia(selected));
                        } else {
                          featuredImageInputRef.current?.click();
                        }
                      }}
                    >
                      🖼️ Media Library
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revision History Modal */}
      {postId && (
        <RevisionHistoryModal
          postId={postId}
          client={client}
          isOpen={showRevisionModal}
          onClose={() => setShowRevisionModal(false)}
          onRestored={(restored) => {
            setTitle(restored.title);
            setExcerpt(restored.excerpt || '');
            setContentJson(restored.content);
            alert('Revision restored into editor!');
          }}
        />
      )}
    </div>
  );
};
