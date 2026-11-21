import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
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

export interface ArticleBulkUploadModalProps {
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

export const ArticleBulkUploadModal: React.FC<ArticleBulkUploadModalProps> = ({
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* =========================================================================
     1. Download Pre-Formatted Excel Template (.xlsx) with Sample Articles
     ========================================================================= */
  const downloadSampleTemplate = () => {
    const wb = XLSX.utils.book_new();

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
        featured_image: '', // Left blank on purpose to demonstrate default image fallback!
        featured_image_caption: 'Cecilia Payne analyzing photographic glass plates at Harvard Observatory in 1925 (Credit: Harvard Archive)',
        featured_image_alt: 'Cecilia Payne examining stellar spectral plates',
        category: 'Space Exploration',
        tags: 'Astronomy, NASA, Astrophysics, History',
        author: 'Zwosmos (Editor)',
        status: 'draft',
        is_featured: false,
        meta_title: 'Cecilia Payne: Pioneer of Stellar Chemistry | Zwosmos',
        meta_description: 'Discover how Cecilia Payne overturned 1920s astronomy dogma to prove stars are overwhelmingly made of hydrogen and helium.',
        focus_keyword: 'Cecilia Payne stellar composition'
      },
      {
        title: 'Gravitational Lensing: How Massive Galaxies Bend Spacetime Like Cosmic Magnifiers',
        slug: 'gravitational-lensing-cosmic-magnifiers',
        content_html: `<p>Albert Einstein's General Theory of Relativity predicted that massive cosmic structures warp the fabric of spacetime itself <a href="https://hubblesite.org" class="zw-blog-citation" data-citation="true">[2] Hubble Telescope Science Brief</a>.</p>
<h2>How Cosmic Lenses Function</h2>
<p>When light from an ultra-distant galaxy travels past a foreground galaxy cluster, its trajectory bends along the curved spacetime, magnifying and distorting the background object into arcs or Einstein rings.</p>
<h2>Unlocking the Earliest Epochs</h2>
<p>Using natural gravitational lenses, instruments like the James Webb Space Telescope can observe infant galaxies that formed just 300 million years after the Big Bang.</p>`,
        excerpt: 'Albert Einstein predicted that heavy masses curve spacetime. Today, astronomers use massive galaxy clusters as cosmic magnifying glasses.',
        featured_image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop',
        featured_image_caption: 'Deep space galaxy cluster acting as a strong gravitational lens (ESA/Hubble & NASA)',
        featured_image_alt: 'Gravitational lens warping distant starlight into luminous rings',
        category: 'Universe',
        tags: 'Black Holes, Cosmology, Gravitational Waves, James Webb',
        author: 'Zwosmos (Editor)',
        status: 'published',
        is_featured: true,
        meta_title: 'Gravitational Lensing Explained: Nature\'s Cosmic Telescopes',
        meta_description: 'Learn how galaxy clusters bend spacetime and act as natural magnifying lenses to reveal the most distant corners of the cosmos.',
        focus_keyword: 'gravitational lensing cosmic telescope'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleArticles);

    // Set custom column widths for easy editing in Microsoft Excel / Google Sheets
    ws['!cols'] = [
      { wch: 40 }, // title
      { wch: 32 }, // slug
      { wch: 80 }, // content_html
      { wch: 45 }, // excerpt
      { wch: 40 }, // featured_image
      { wch: 40 }, // featured_image_caption
      { wch: 30 }, // featured_image_alt
      { wch: 22 }, // category
      { wch: 32 }, // tags
      { wch: 22 }, // author
      { wch: 14 }, // status
      { wch: 14 }, // is_featured
      { wch: 35 }, // meta_title
      { wch: 45 }, // meta_description
      { wch: 30 }, // focus_keyword
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Articles');
    XLSX.writeFile(wb, 'Zwosmos_Articles_Bulk_Import_Template.xlsx');
  };

  /* =========================================================================
     2. File Processing & Parsing (.xlsx, .xls, .csv)
     ========================================================================= */
  const processUploadedFile = (uploadedFile: File) => {
    setUploadError(null);
    setParsedRows([]);
    setFile(uploadedFile);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) throw new Error('File could not be read.');

        const wb = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) throw new Error('Excel workbook contains no sheets.');

        const worksheet = wb.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('No article rows found in the uploaded file.');
        }

        const existingSlugs = new Set(existingPosts.map((p) => (p.slug || '').toLowerCase().trim()));
        const seenFileSlugs = new Set<string>();

        const parsed: ParsedArticleRow[] = rawJson.map((row, index) => {
          const rowNumber = index + 2; // Row 1 is header
          const errors: string[] = [];
          const warnings: string[] = [];

          // 1. Title
          const title = String(row.title || row.Title || '').trim();
          if (!title) {
            errors.push('Title is required');
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
              warnings.push(`Duplicate slug "${slug}" found within this spreadsheet.`);
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
          const rawTags = String(row.tags || row.Tags || '').trim();
          const tags = rawTags
            ? rawTags
                .split(/[,;|]/)
                .map((t) => t.trim())
                .filter(Boolean)
            : [];

          // 8. Author
          const author = String(row.author || row.Author || '').trim();

          // 9. Status
          const rawStatus = String(row.status || row.Status || 'draft').toLowerCase().trim();
          const status: 'draft' | 'published' = rawStatus === 'published' ? 'published' : 'draft';

          // 10. Is Featured
          const rawIsFeatured = String(row.is_featured || row.Is_Featured || row.featured || '').toLowerCase().trim();
          const is_featured = rawIsFeatured === 'true' || rawIsFeatured === '1' || rawIsFeatured === 'yes';

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
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse Excel file. Please ensure it follows the template format.');
      }
    };

    reader.readAsBinaryString(uploadedFile);
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

    // Cache existing categories & authors for fast matching
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

    // Fallback default author
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

        // 2. Resolve or auto-create Tags (Strictly marked as Indexable!)
        const tagIds: string[] = [];
        for (const tagName of row.tags) {
          try {
            const allTags = await client.tags.getAll();
            const foundTag = allTags.find(
              (t) => t.name.toLowerCase() === tagName.toLowerCase() || t.slug.toLowerCase() === slugify(tagName)
            );
            if (foundTag) {
              tagIds.push(foundTag.id);
              // If legacy tag had noindex, upgrade it
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
          content: { type: 'doc', content: [] }, // Tiptap JSON fallback
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
          maxWidth: '1020px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#ffcc00',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size={17} strokeWidth={2.2} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#0f172a' }}>
                Bulk Excel Import Articles
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Upload multiple blog posts from a single Excel spreadsheet (.xlsx, .xls) or CSV.
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
              title="Download pre-formatted Excel template with sample articles"
            >
              <Download size={14} />
              <span>Download Excel Template (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging ? '2px dashed #ffcc00' : '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '24px 20px',
              textAlign: 'center',
              background: isDragging ? '#fffdf0' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) processUploadedFile(picked);
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#fffae5',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                  {file ? file.name : 'Click to browse or drag and drop your Excel file here'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Supports Microsoft Excel (.xlsx, .xls) and CSV. Maximum recommended batch: 100 articles.
                </div>
              </div>
            </div>
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#b91c1c',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Summary Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f1f5f9',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  color: '#334155',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span>
                    <strong>Total Detected:</strong> {parsedRows.length} articles
                  </span>
                  <span style={{ color: '#16a34a' }}>
                    <strong>Valid:</strong> {validCount}
                  </span>
                  {errorCount > 0 && (
                    <span style={{ color: '#dc2626' }}>
                      <strong>Errors:</strong> {errorCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Click on any row to preview full HTML content & citations
                </div>
              </div>

              {/* Table of Parsed Articles */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  maxHeight: '320px',
                  overflowY: 'auto',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11.5px' }}>
                      <th style={{ padding: '8px 12px', width: '40px' }}>Row</th>
                      <th style={{ padding: '8px 12px' }}>Title & Slug</th>
                      <th style={{ padding: '8px 12px' }}>Category & Tags</th>
                      <th style={{ padding: '8px 12px' }}>Words</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                      <th style={{ padding: '8px 12px' }}>Validation</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        onClick={() => setSelectedPreviewRow(row)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          background:
                            selectedPreviewRow?.rowNumber === row.rowNumber
                              ? '#fffdf0'
                              : row.isValid
                              ? '#ffffff'
                              : '#fef2f2',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '10px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          #{row.rowNumber}
                        </td>
                        <td style={{ padding: '10px 12px', maxWidth: '300px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.title || <span style={{ color: '#ef4444' }}>[Missing Title]</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                            /{row.slug}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', maxWidth: '200px' }}>
                          <div style={{ fontSize: '12px', color: '#0f172a' }}>
                            {row.category || <span style={{ color: '#94a3b8' }}>—</span>}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.tags.length > 0 ? row.tags.map((t) => `#${t}`).join(', ') : 'No tags'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>
                          {row.wordCount} words
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 7px',
                              borderRadius: '10px',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              background: row.status === 'published' ? '#dcfce7' : '#f1f5f9',
                              color: row.status === 'published' ? '#15803d' : '#475569',
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {row.isValid ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '11.5px' }}>
                              <CheckCircle2 size={13} />
                              <span>Ready</span>
                            </div>
                          ) : (
                            <div style={{ color: '#dc2626', fontSize: '11px' }}>
                              {row.errors.join(', ')}
                            </div>
                          )}
                          {row.warnings.length > 0 && row.isValid && (
                            <div style={{ color: '#d97706', fontSize: '10.5px' }}>
                              {row.warnings[0]}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPreviewRow(row);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#64748b',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Row Detail Drawer (if selected) */}
          {selectedPreviewRow && (
            <div
              style={{
                border: '1px solid #fed7aa',
                borderRadius: '10px',
                background: '#fffdfa',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#9a3412' }}>
                  Previewing Row #{selectedPreviewRow.rowNumber}: {selectedPreviewRow.title}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewRow(null)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#9a3412',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 500,
                  }}
                >
                  <X size={13} />
                  <span>Close Preview</span>
                </button>
              </div>

              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span><strong>Slug:</strong> /{selectedPreviewRow.slug}</span>
                <span><strong>Author:</strong> {selectedPreviewRow.author || 'Default'}</span>
                <span><strong>Image:</strong> {selectedPreviewRow.featured_image ? 'Custom URL' : 'Default from Settings'}</span>
                {selectedPreviewRow.featured_image_caption && (
                  <span><strong>Caption:</strong> {selectedPreviewRow.featured_image_caption}</span>
                )}
                {selectedPreviewRow.focus_keyword && (
                  <span><strong>Keyword:</strong> {selectedPreviewRow.focus_keyword}</span>
                )}
              </div>

              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
                HTML Body Content Preview:
              </div>
              <div
                style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: '#334155',
                }}
                dangerouslySetInnerHTML={{ __html: selectedPreviewRow.content_html }}
              />
            </div>
          )}

          {/* Progress Indicator */}
          {progress && (
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: '#fffdf0',
                border: '1px solid #fef08a',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, color: '#854d0e' }}>
                <span>Importing articles into database...</span>
                <span>
                  {progress.current} of {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: '#fef9c3', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(progress.current / progress.total) * 100}%`,
                    background: '#ffcc00',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {validCount > 0
              ? `${validCount} article${validCount === 1 ? '' : 's'} ready for import`
              : 'Select or drop an Excel spreadsheet above to begin'}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={validCount === 0 || isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '8px',
                background: validCount > 0 && !isSaving ? '#ffcc00' : '#f1f5f9',
                color: validCount > 0 && !isSaving ? '#0f172a' : '#94a3b8',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: validCount > 0 && !isSaving ? 'pointer' : 'not-allowed',
                boxShadow: validCount > 0 && !isSaving ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload size={14} strokeWidth={2.2} />
                  <span>Import {validCount} Article{validCount === 1 ? '' : 's'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
