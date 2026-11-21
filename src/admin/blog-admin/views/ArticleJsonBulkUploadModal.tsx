import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  X,
  FileCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { BlogClient } from '@zwantum/blog-core';
import { Post, PostCreateInput, Category, Author } from '@zwantum/blog-types';
import { getDefaultFeaturedImage } from '../utils/defaultImage';

interface ParsedArticleRow {
  rowNumber: number;
  title: string;
  slug: string;
  content_html: string;
  excerpt: string;
  featured_image: string;
  featured_image_caption: string;
  featured_image_alt: string;
  category: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published';
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  published_at?: string;
  wordCount: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ArticleJsonBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: BlogClient;
  existingPosts?: Post[];
  categories?: Category[];
  authors?: Author[];
  onSuccess: (count: number) => void;
}

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const ArticleJsonBulkUploadModal: React.FC<ArticleJsonBulkUploadModalProps> = ({
  isOpen,
  onClose,
  client,
  existingPosts = [],
  categories = [],
  authors = [],
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedArticleRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedPreviewRow, setSelectedPreviewRow] = useState<ParsedArticleRow | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [rawJsonInput, setRawJsonInput] = useState<string>('');
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* =========================================================================
     1. Download Pre-Formatted JSON Template with Sample Articles
     ========================================================================= */
  const downloadSampleTemplate = () => {
    const sampleArticles = [
      {
        title: 'Cecilia Payne: The Astronomer Who Discovered What Stars Are Made Of',
        slug: 'cecilia-payne-stellar-composition',
        content_html: `<p>Rich text editors have long been reliable building blocks of modern content platforms <a href="https://nasa.gov" class="zw-blog-citation" data-citation="true">[1] NASA student explainer</a>.</p>
<h2>Chapter 1: The Revolutionary 1925 Discovery</h2>
<p>In 1925, astronomer Cecilia Payne proposed that the Sun and other stars are composed primarily of hydrogen and helium, directly contradicting the scientific consensus of her era.</p>
<div class="zw-blog-callout" data-type="info"><p><strong>Key Fact:</strong> Payne's PhD thesis was described by Otto Struve as 'the most brilliant Ph.D. thesis ever written in astronomy.'</p></div>
<h3>Impact on Modern Astrophysics</h3>
<p>Today, stellar spectroscopy forms the foundation of observational cosmology, allowing astronomers to deduce the chemical compositions, temperatures, and ages of distant stars.</p>`,
        excerpt: "How Cecilia Payne's 1925 doctoral thesis proved that stars are primarily hydrogen and helium, reshaping our understanding of the universe.",
        featured_image: '',
        featured_image_caption: 'Cecilia Payne analyzing photographic glass plates at Harvard Observatory in 1925 (Credit: Harvard Archive)',
        featured_image_alt: 'Cecilia Payne examining stellar spectral plates',
        category: 'Space Exploration',
        tags: ['Astronomy', 'NASA', 'Astrophysics', 'History'],
        author: 'Zwosmos (Editor)',
        status: 'published',
        is_featured: true,
        meta_title: 'Cecilia Payne: Stellar Composition & 1925 Hydrogen Discovery | Zwosmos',
        meta_description: 'Discover how Cecilia Payne discovered that stars are mostly hydrogen and helium in 1925, transforming astronomy.',
        focus_keyword: 'Cecilia Payne stellar composition',
        published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        title: 'Voyager 1 and 2: Humanity’s Ongoing Journey Beyond the Heliosphere',
        slug: 'voyager-mission-interstellar-space',
        content_html: `<p>Launched in 1977, NASA's twin Voyager spacecraft have traveled further from Earth than any other human-made objects <a href="https://jpl.nasa.gov" class="zw-blog-citation" data-citation="true">[2] NASA JPL Mission Record</a>.</p>
<h2>The Grand Tour of the Outer Planets</h2>
<p>Taking advantage of a rare planetary alignment that occurs only once every 175 years, the Voyagers visited Jupiter, Saturn, Uranus, and Neptune, transmitting unprecedented photographs of volcanic moons and complex ring systems.</p>
<div class="zw-blog-callout" data-type="tip"><p><strong>Did You Know?</strong> Voyager 1 crossed into interstellar space in August 2012, followed by Voyager 2 in November 2018.</p></div>
<h2>The Golden Record</h2>
<p>Each spacecraft carries a gold-plated copper phonograph record containing sounds and images selected to portray the diversity of life and culture on Earth.</p>`,
        excerpt: 'NASA twin Voyager probes are cruising through interstellar space, continuing to transmit scientific data after nearly five decades.',
        featured_image: '',
        featured_image_caption: "Artist's impression of Voyager spacecraft traversing the interstellar medium beyond the heliopause.",
        featured_image_alt: 'Voyager probe in deep space',
        category: 'Universe',
        tags: ['Voyager', 'Deep Space', 'Interstellar', 'JPL'],
        author: 'Zwosmos (Editor)',
        status: 'published',
        is_featured: false,
        meta_title: 'Voyager 1 and 2 Missions in Interstellar Space | Zwosmos',
        meta_description: 'Explore the journey of Voyagers 1 and 2 through interstellar space and their message on the Golden Record.',
        focus_keyword: 'Voyager interstellar mission',
        published_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ];

    const jsonString = JSON.stringify(sampleArticles, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-articles.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* =========================================================================
     2. Parse Raw JSON Articles Array
     ========================================================================= */
  const parseJsonData = (rawJson: any) => {
    let items: any[] = [];

    if (Array.isArray(rawJson)) {
      items = rawJson;
    } else if (rawJson && typeof rawJson === 'object') {
      if (Array.isArray(rawJson.articles)) {
        items = rawJson.articles;
      } else if (Array.isArray(rawJson.posts)) {
        items = rawJson.posts;
      } else if (Array.isArray(rawJson.data)) {
        items = rawJson.data;
      } else {
        throw new Error('Invalid JSON format: Expected a top-level array of article objects or an object with an "articles" array.');
      }
    } else {
      throw new Error('Invalid JSON input: must be an array of articles or an object with an "articles" property.');
    }

    if (items.length === 0) {
      throw new Error('The JSON file contains an empty list of articles.');
    }

    const existingSlugs = new Set((existingPosts || []).map((p) => p.slug.toLowerCase()));
    const seenFileSlugs = new Set<string>();

    const parsed: ParsedArticleRow[] = items.map((row: any, idx: number) => {
      const rowNumber = idx + 1;
      const errors: string[] = [];
      const warnings: string[] = [];

      // 1. Title
      const title = String(row.title || row.Title || '').trim();
      if (!title) {
        errors.push('Article title is required');
      }

      // 2. Slug
      let slug = String(row.slug || row.Slug || '').trim();
      if (!slug && title) {
        slug = slugify(title);
      } else if (slug) {
        slug = slugify(slug);
      }

      if (slug) {
        if (existingSlugs.has(slug.toLowerCase())) {
          warnings.push(`Slug "${slug}" already exists on the site. A unique suffix will be added.`);
        }
        if (seenFileSlugs.has(slug.toLowerCase())) {
          warnings.push(`Duplicate slug "${slug}" found within this import.`);
        }
        seenFileSlugs.add(slug.toLowerCase());
      }

      // 3. Content HTML
      const rawContent = String(
        row.content_html || row.content || row.Content || row.Body || row.body || ''
      ).trim();
      if (!rawContent) {
        errors.push('Article content (content_html) is required');
      }

      // Word count estimation
      const cleanText = rawContent.replace(/<[^>]*>?/gm, ' ').trim();
      const wordCount = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;

      if (wordCount < 30 && rawContent) {
        warnings.push('Article content appears very short (< 30 words)');
      }

      // 4. Excerpt
      const excerpt = String(row.excerpt || row.Excerpt || '').trim();

      // 5. Featured Image & Captions
      const featured_image = String(
        row.featured_image || row.Featured_Image || row.image_url || ''
      ).trim();
      const featured_image_caption = String(
        row.featured_image_caption || row.caption || row.Caption || ''
      ).trim();
      const featured_image_alt = String(
        row.featured_image_alt || row.alt || row.alt_text || ''
      ).trim();

      if (!featured_image) {
        warnings.push('Featured image is blank; default image from settings will be used');
      }

      // 6. Category
      const category = String(row.category || row.Category || '').trim();

      // 7. Tags
      let tags: string[] = [];
      if (Array.isArray(row.tags)) {
        tags = row.tags.map((t: any) => String(t).trim()).filter(Boolean);
      } else if (typeof row.tags === 'string' && row.tags.trim()) {
        tags = row.tags
          .split(/[,;|]/)
          .map((t: string) => t.trim())
          .filter(Boolean);
      }

      // 8. Author
      const author = String(row.author || row.Author || '').trim();

      // 9. Status
      const rawStatus = String(row.status || row.Status || 'draft').toLowerCase().trim();
      const status: 'draft' | 'published' = rawStatus === 'published' ? 'published' : 'draft';

      // 10. Is Featured
      const rawIsFeatured = String(row.is_featured || row.Is_Featured || row.featured || '').toLowerCase().trim();
      const is_featured = row.is_featured === true || rawIsFeatured === 'true' || rawIsFeatured === '1' || rawIsFeatured === 'yes';

      // 11. SEO Fields
      const meta_title = String(row.meta_title || row.seo_title || '').trim();
      const meta_description = String(row.meta_description || row.seo_description || '').trim();
      const focus_keyword = String(row.focus_keyword || row.keyword || '').trim();

      // 12. Optional Custom / Backdated Publish Date
      const rawDate = String(row.published_at || row.publish_date || row.published_date || row.date || row.Date || '').trim();
      let parsedPublishedAt: string | undefined = undefined;
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          parsedPublishedAt = parsed.toISOString();
        }
      }

      return {
        rowNumber,
        title,
        slug,
        content_html: rawContent,
        excerpt,
        featured_image,
        featured_image_caption,
        featured_image_alt,
        category,
        tags,
        author,
        status,
        is_featured,
        meta_title,
        meta_description,
        focus_keyword,
        published_at: parsedPublishedAt,
        wordCount,
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    });

    setParsedRows(parsed);
  };

  const processUploadedFile = (uploadedFile: File) => {
    setUploadError(null);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedJson = JSON.parse(text);
        parseJsonData(parsedJson);
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse JSON file. Please ensure it is valid JSON.');
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read the selected file.');
    };
    reader.readAsText(uploadedFile);
  };

  const handleParseRawText = () => {
    setUploadError(null);
    if (!rawJsonInput.trim()) {
      setUploadError('Please paste your JSON text before parsing.');
      return;
    }
    try {
      const parsedJson = JSON.parse(rawJsonInput);
      parseJsonData(parsedJson);
    } catch (err: any) {
      setUploadError(`Invalid JSON syntax: ${err.message}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processUploadedFile(droppedFile);
  };

  /* =========================================================================
     3. Batch Import Execution
     ========================================================================= */
  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows found to import. Please resolve the errors indicated in the preview.');
      return;
    }

    setIsSaving(true);
    setProgress({ current: 0, total: validRows.length });

    let currentCategories = [...categories];
    let currentAuthors = [...authors];

    try {
      const liveCats = await client.categories.getAll();
      if (liveCats && liveCats.length > 0) currentCategories = liveCats;
    } catch {}

    try {
      const liveAuthors = await client.authors.getAll();
      if (liveAuthors && liveAuthors.length > 0) currentAuthors = liveAuthors;
    } catch {}

    const defaultAuthor = currentAuthors[0] || null;
    let successCount = 0;
    const defaultImage = getDefaultFeaturedImage();

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setProgress({ current: i + 1, total: validRows.length });

      try {
        // 1. Resolve or auto-create Category
        const categoryIds: string[] = [];
        if (row.category) {
          const matchedCat = currentCategories.find(
            (c) => c.name.toLowerCase() === row.category.toLowerCase() || c.slug.toLowerCase() === slugify(row.category)
          );
          if (matchedCat) {
            categoryIds.push(matchedCat.id);
          } else {
            try {
              const newCat = await client.categories.create({
                name: row.category,
                slug: slugify(row.category),
                robots: 'index,follow',
                no_index: false,
              });
              if (newCat?.id) {
                categoryIds.push(newCat.id);
                currentCategories.push(newCat);
              }
            } catch (catErr) {
              console.warn('Failed to auto-create category for row', row.title, catErr);
            }
          }
        }

        // 2. Resolve or auto-create Tags (Strictly indexable)
        const tagIds: string[] = [];
        for (const tagName of row.tags) {
          try {
            const allTags = await client.tags.getAll();
            const foundTag = allTags.find(
              (t) => t.name.toLowerCase() === tagName.toLowerCase() || t.slug.toLowerCase() === slugify(tagName)
            );
            if (foundTag) {
              tagIds.push(foundTag.id);
              if (foundTag.no_index || (foundTag.robots?.includes('noindex') ?? false)) {
                await client.tags.update(foundTag.id, { robots: 'index,follow', no_index: false }).catch(() => {});
              }
            } else {
              const created = await client.tags.create({
                name: tagName,
                slug: slugify(tagName),
                robots: 'index,follow',
                no_index: false,
              });
              if (created?.id) tagIds.push(created.id);
            }
          } catch (tagErr) {
            console.warn('Failed to resolve tag', tagName, tagErr);
          }
        }

        // 3. Resolve Author
        let authorId = defaultAuthor?.id || undefined;
        if (row.author) {
          const matchedAuthor = currentAuthors.find(
            (a) => a.name.toLowerCase() === row.author.toLowerCase()
          );
          if (matchedAuthor) authorId = matchedAuthor.id;
        }

        // 4. Featured Image Assignment
        const activeImageUrl = row.featured_image || defaultImage;
        const featured_image = {
          id: `featured-${Date.now()}-${i}`,
          url: activeImageUrl,
          filename: 'featured-image.jpg',
          original_name: 'featured-image.jpg',
          mime_type: 'image/jpeg',
          file_size: 0,
          alt_text: row.featured_image_alt || row.title,
          caption: row.featured_image_caption || '',
          storage_provider: 'external',
          storage_path: activeImageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // 5. Construct Post Input Payload
        const finalSlug = row.slug || slugify(row.title);
        const postInput: PostCreateInput & { featured_image?: any } = {
          title: row.title,
          slug: finalSlug,
          excerpt: row.excerpt || undefined,
          content: { type: 'doc', content: [] },
          content_html: row.content_html,
          status: row.status,
          published_at: row.status === 'published' ? (row.published_at || new Date().toISOString()) : null,
          category_ids: categoryIds.length > 0 ? categoryIds : undefined,
          tag_ids: tagIds.length > 0 ? tagIds : undefined,
          author_id: authorId,
          featured_image,
          seo: {
            meta_title: row.meta_title || row.title,
            meta_description: row.meta_description || row.excerpt || undefined,
            focus_keyword: row.focus_keyword || undefined,
            robots: 'index,follow',
          },
          custom_fields: {
            featured_image_url: activeImageUrl,
            featured_image_caption: row.featured_image_caption || '',
            seo_title: row.meta_title || row.title,
            seo_description: row.meta_description || row.excerpt || '',
            focus_keyword: row.focus_keyword || '',
          },
        };

        await client.posts.create(postInput);
        successCount++;
      } catch (err) {
        console.error('Failed to import row:', row.title, err);
      }
    }

    setIsSaving(false);
    setProgress(null);
    onSuccess(successCount);
    onClose();
  };

  const validCount = useMemo(() => parsedRows.filter((r) => r.isValid).length, [parsedRows]);
  const errorCount = useMemo(() => parsedRows.filter((r) => !r.isValid).length, [parsedRows]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileCode size={19} strokeWidth={2.2} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#0f172a' }}>
                Bulk JSON Import Articles
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Upload multiple blog posts from a JSON file (.json) or paste structured JSON articles.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Download pre-formatted sample JSON template"
            >
              <Download size={14} />
              <span>Download JSON Template (.json)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Method Selector Tabs: Upload File vs Paste JSON */}
          {parsedRows.length === 0 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setMode('upload')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: mode === 'upload' ? '#0284c7' : '#e2e8f0',
                  background: mode === 'upload' ? '#e0f2fe' : '#ffffff',
                  color: mode === 'upload' ? '#0369a1' : '#64748b',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Upload .json File
              </button>
              <button
                type="button"
                onClick={() => setMode('paste')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: mode === 'paste' ? '#0284c7' : '#e2e8f0',
                  background: mode === 'paste' ? '#e0f2fe' : '#ffffff',
                  color: mode === 'paste' ? '#0369a1' : '#64748b',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Paste JSON Text
              </button>
            </div>
          )}

          {/* 1. File Upload Dropzone (if in upload mode and no rows parsed) */}
          {parsedRows.length === 0 && mode === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed #0284c7' : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '44px 20px',
                textAlign: 'center',
                background: isDragging ? '#f0f9ff' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) processUploadedFile(selected);
                }}
              />
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto',
                }}
              >
                <FileCode size={26} strokeWidth={2} />
              </div>
              <p style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                Click to browse or drag & drop your JSON file
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Supports standard <code style={{ color: '#0284c7' }}>.json</code> article arrays matching the template schema
              </p>
            </div>
          )}

          {/* 2. Direct JSON Paste Textarea (if in paste mode and no rows parsed) */}
          {parsedRows.length === 0 && mode === 'paste' && (
            <div>
              <textarea
                rows={10}
                value={rawJsonInput}
                onChange={(e) => setRawJsonInput(e.target.value)}
                placeholder='Paste an array of articles, e.g. [{"title": "My Post", "content_html": "<p>Content</p>", "category": "Space", "status": "published"}]'
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '12.5px',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#f8fafc',
                }}
              />
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleParseRawText}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Parse JSON Articles
                </button>
              </div>
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Parsed Articles Summary & Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              {/* Top Stats Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Total Articles:</span>
                    <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '12px' }}>
                      {parsedRows.length}
                    </span>
                    {file && (
                      <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: 600 }}>
                        ({file.name})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#166534' }}>
                    <CheckCircle2 size={16} />
                    <span>{validCount} ready to import</span>
                  </div>
                  {errorCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#dc2626' }}>
                      <AlertCircle size={16} />
                      <span>{errorCount} need corrections</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFile(null);
                    setRawJsonInput('');
                    setUploadError(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Choose Another File / JSON</span>
                </button>
              </div>

              {/* Articles Table Preview */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#ffffff',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
                      <th style={{ padding: '10px 14px', width: '45px' }}>#</th>
                      <th style={{ padding: '10px 14px', width: '70px' }}>Status</th>
                      <th style={{ padding: '10px 14px' }}>Article Title & Slug</th>
                      <th style={{ padding: '10px 14px', width: '130px' }}>Category</th>
                      <th style={{ padding: '10px 14px', width: '120px' }}>Author</th>
                      <th style={{ padding: '10px 14px', width: '90px' }}>Post State</th>
                      <th style={{ padding: '10px 14px', width: '120px' }}>Publish Date</th>
                      <th style={{ padding: '10px 14px', width: '80px' }}>Words</th>
                      <th style={{ padding: '10px 14px', width: '70px', textAlign: 'center' }}>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: row.isValid ? '#ffffff' : '#fef2f2',
                        }}
                      >
                        <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>
                          {row.rowNumber}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {row.isValid ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#dcfce7',
                                color: '#15803d',
                              }}
                            >
                              Valid
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#fee2e2',
                                color: '#b91c1c',
                              }}
                              title={row.errors.join('; ')}
                            >
                              Error
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.title || <em>(Missing Title)</em>}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>/{row.slug}</div>
                          {row.errors.length > 0 && (
                            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>
                              ⚠️ {row.errors.join(', ')}
                            </div>
                          )}
                          {row.warnings.length > 0 && row.errors.length === 0 && (
                            <div style={{ fontSize: '11px', color: '#d97706', marginTop: '3px' }}>
                              ℹ️ {row.warnings.join(', ')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>
                          {row.category ? (
                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', fontSize: '11.5px' }}>
                              {row.category}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#475569', fontSize: '12.5px' }}>
                          {row.author || <span style={{ color: '#94a3b8' }}>Default</span>}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              background: row.status === 'published' ? '#ecfdf5' : '#f8fafc',
                              color: row.status === 'published' ? '#047857' : '#64748b',
                              border: `1px solid ${row.status === 'published' ? '#a7f3d0' : '#e2e8f0'}`,
                            }}
                          >
                            {row.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#475569' }}>
                          {row.published_at ? (
                            <span>
                              {new Date(row.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Now</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px' }}>
                          {row.wordCount}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedPreviewRow(row)}
                            title="Preview Rendered Content"
                            style={{
                              background: 'transparent',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '4px 7px',
                              cursor: 'pointer',
                              color: '#334155',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {progress ? (
              <span>Importing article {progress.current} of {progress.total}...</span>
            ) : parsedRows.length > 0 ? (
              <span>
                {validCount} of {parsedRows.length} articles will be imported into the blog database.
              </span>
            ) : (
              <span>Select or drop a JSON file with articles to begin.</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isSaving || validCount === 0}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                background: validCount > 0 ? '#0284c7' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: isSaving || validCount === 0 ? 'not-allowed' : 'pointer',
                boxShadow: validCount > 0 ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Importing ({progress?.current || 0}/{progress?.total || 0})...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Import {validCount} Articles</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Rendered Single Article Content Preview Modal */}
      {selectedPreviewRow && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setSelectedPreviewRow(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                  {selectedPreviewRow.title}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Slug: /{selectedPreviewRow.slug} • {selectedPreviewRow.wordCount} words
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewRow(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                fontSize: '15px',
                lineHeight: 1.7,
                color: '#334155',
              }}
              dangerouslySetInnerHTML={{ __html: selectedPreviewRow.content_html }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
