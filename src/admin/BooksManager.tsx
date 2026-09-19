import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw,
  Star,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { MediaLibrary } from '@zwantum/blog/admin';
import { blogClient } from '../lib/blogClient';
import { BookItem, booksService } from '../lib/booksService';

const CATEGORY_OPTIONS = [
  'ASTROPHYSICS',
  'COSMOLOGY',
  'COSMIC EXPLORATION',
  'QUANTUM & SPACETIME',
  'PLANETARY SCIENCE'
];

export default function BooksManager() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState('COSMOLOGY');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formPages, setFormPages] = useState<number | string>('');
  const [formRating, setFormRating] = useState<number | string>('');
  const [formReviewsCount, setFormReviewsCount] = useState<number | string>('');
  const [formBuyUrl, setFormBuyUrl] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLongDesc, setFormLongDesc] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await booksService.getBooks();
      setBooks(data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setFormTitle('');
    setFormAuthor('');
    setFormCategory('COSMOLOGY');
    setFormCustomCategory('');
    setFormYear(new Date().getFullYear());
    setFormPages('');
    setFormRating('');
    setFormReviewsCount('');
    setFormBuyUrl('');
    setFormCoverImage('');
    setFormDesc('');
    setFormLongDesc('');
    setFormTags('Astronomy, Space');
    setFormFeatured(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: BookItem) => {
    setEditingBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author);

    if (CATEGORY_OPTIONS.includes(book.category)) {
      setFormCategory(book.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('CUSTOM');
      setFormCustomCategory(book.category);
    }

    setFormYear(book.year || new Date().getFullYear());
    setFormPages(book.pages !== undefined && book.pages !== null ? book.pages : '');
    setFormRating(book.rating !== undefined && book.rating !== null ? book.rating : '');
    setFormReviewsCount(book.reviewsCount !== undefined && book.reviewsCount !== null ? book.reviewsCount : '');
    setFormBuyUrl(book.buyUrl || '');
    setFormCoverImage(book.coverImage || '');
    setFormDesc(book.desc || '');
    setFormLongDesc(book.longDesc || '');
    setFormTags(book.tags ? book.tags.join(', ') : '');
    setFormFeatured(!!book.featured);
    setIsModalOpen(true);
  };

  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCover(true);
      const res = await (blogClient.storage as any).upload(file, file.name, { folder: 'book-covers' });
      if (res?.url) {
        setFormCoverImage(res.url);
        showToast('success', 'Cover image uploaded');
      }
    } catch (err) {
      // Fallback to local FileReader data URL
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setFormCoverImage(reader.result as string);
          showToast('success', 'Cover image loaded');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('error', 'Book title is required');
      return;
    }
    if (!formAuthor.trim()) {
      showToast('error', 'Author name is required');
      return;
    }

    const finalCategory = formCategory === 'CUSTOM' ? (formCustomCategory.trim().toUpperCase() || 'COSMOLOGY') : formCategory;
    const parsedTags = formTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const parsedPages = formPages === '' || formPages === null ? 0 : Number(formPages);
    const parsedRating = formRating === '' || formRating === null ? 0 : Number(formRating);
    const parsedReviewsCount = formReviewsCount === '' || formReviewsCount === null ? 0 : Number(formReviewsCount);

    const bookPayload = {
      title: formTitle.trim(),
      author: formAuthor.trim(),
      category: finalCategory,
      year: Number(formYear) || new Date().getFullYear(),
      pages: isNaN(parsedPages) ? 0 : parsedPages,
      rating: isNaN(parsedRating) ? 0 : parsedRating,
      reviewsCount: isNaN(parsedReviewsCount) ? 0 : parsedReviewsCount,
      buyUrl: formBuyUrl.trim(),
      coverImage: formCoverImage.trim(),
      desc: formDesc.trim(),
      longDesc: formLongDesc.trim() || formDesc.trim(),
      tags: parsedTags,
      featured: formFeatured,
      gradient: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
      spineColor: '#3f3f46',
      accentColor: '#a855f7'
    };

    try {
      if (editingBook) {
        await booksService.updateBook(editingBook.id, bookPayload);
        showToast('success', `Updated "${formTitle}" successfully`);
      } else {
        await booksService.createBook(bookPayload);
        showToast('success', `Created "${formTitle}" successfully`);
      }
      setIsModalOpen(false);
      loadBooks();
    } catch (err: any) {
      console.error(err);
      showToast('error', err?.message || 'Failed to save book');
    }
  };

  const handleDeleteBook = async (book: BookItem) => {
    if (window.confirm(`Are you sure you want to remove "${book.title}"?`)) {
      try {
        await booksService.deleteBook(book.id);
        showToast('success', `Deleted "${book.title}"`);
        loadBooks();
      } catch (err: any) {
        console.error(err);
        showToast('error', 'Failed to delete book');
      }
    }
  };

  const handleSeedDefaults = async () => {
    if (window.confirm('Reset/Seed books catalog with standard curated publications?')) {
      try {
        await booksService.seedDefaultBooks();
        showToast('success', 'Default books catalog restored');
        loadBooks();
      } catch (err) {
        console.error(err);
        showToast('error', 'Failed to restore default books');
      }
    }
  };

  const filteredBooks = books.filter(b => {
    const matchesCat = filterCategory === 'ALL' || b.category === filterCategory;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCat;
    return (
      matchesCat &&
      (b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(query))))
    );
  });

  return (
    <div style={{ width: '100%', margin: 0, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Toast Notification */}
      {statusMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            padding: '12px 20px',
            borderRadius: '10px',
            background: statusMessage.type === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {statusMessage.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 600, color: '#0f172a', margin: 0, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", letterSpacing: '-0.01em' }}>
              Cosmic Books Manager
            </h1>
            
          </div>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '6px 0 0 0' }}>
            Add and manage books, upload real book covers via media gallery, and set external Buy Now links.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSeedDefaults}
            title="Restore/Seed standard books"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#475569',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={15} />
            <span>Restore Defaults</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffcc00',
              color: '#0f172a',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(255, 204, 0, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={18} />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Category Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by title, author, tag, or topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '14px',
              color: '#0f172a',
              background: 'transparent'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Category:</span>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '13px',
              color: '#0f172a',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Categories</option>
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books List Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px', fontSize: '14px' }}>Loading dynamic books...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}
        >
          <BookOpen size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#0f172a', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>No books found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0' }}>
            {searchQuery ? 'Try changing your search query or category filter.' : 'Click "Add Book" to get started.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            style={{
              background: '#ffcc00',
              color: '#0f172a',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Add New Book
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '18px'
          }}
        >
          {filteredBooks.map(book => (
            <div
              key={book.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  {/* Real Book Cover Image Thumbnail */}
                  <div
                    style={{
                      width: '74px',
                      height: '108px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      border: '1px solid #e2e8f0',
                      flexShrink: 0,
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          color: '#94a3b8',
                          textAlign: 'center'
                        }}
                      >
                        <BookOpen size={20} style={{ opacity: 0.6, marginBottom: '4px' }} />
                        <span style={{ fontSize: '8px', lineHeight: 1.1, fontWeight: 600 }}>No Cover</span>
                      </div>
                    )}
                  </div>

                  {/* Book Primary Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#7c3aed',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {book.category}
                      </span>
                      {book.featured && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '6px'
                          }}
                        >
                          <Star size={10} fill="#92400e" />
                          Featured
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 3px 0',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                      }}
                      title={book.title}
                    >
                      {book.title}
                    </h3>

                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      By <strong style={{ color: '#334155' }}>{book.author}</strong>
                      {book.year ? ` • ${book.year}` : ''}
                      {book.pages && Number(book.pages) > 0 ? ` (${book.pages} pages)` : ''}
                      {book.rating && Number(book.rating) > 0 ? ` • ★ ${book.rating}` : ' • (No rating)'}
                    </div>

                    <p
                      style={{
                        fontSize: '12px',
                        color: '#475569',
                        margin: 0,
                        lineHeight: 1.45,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {book.desc}
                    </p>
                  </div>
                </div>

                {/* External Buy Link Tag */}
                <div
                  style={{
                    background: book.buyUrl ? '#f0fdf4' : '#f8fafc',
                    border: book.buyUrl ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 600, color: book.buyUrl ? '#166534' : '#94a3b8' }}>
                      Buy Now Link:
                    </span>
                    {book.buyUrl ? (
                      <span
                        style={{
                          color: '#15803d',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                        title={book.buyUrl}
                      >
                        {book.buyUrl}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None configured</span>
                    )}
                  </div>

                  {book.buyUrl && (
                    <a
                      href={book.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Test buy link"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: '#16a34a',
                        textDecoration: 'none',
                        marginLeft: '8px'
                      }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  {book.tags &&
                    book.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenEditModal(book)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#0f172a',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteBook(book)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      color: '#e11d48',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.15s ease'
                    }}
                    title="Delete book"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT BOOK MODAL                                                     */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99990,
            padding: '20px'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                background: '#ffffff',
                zIndex: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#ffcc00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <BookOpen size={18} color="#0f172a" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                    {editingBook ? 'Edit Book Publication' : 'Add New Book Publication'}
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Configure book metadata, real cover image & external purchase destination
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBook} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Row 1: Title & Author */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Book Title <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Beyond the Horizon"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Author Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Carl Sagan or J. A. Kerr"
                    value={formAuthor}
                    onChange={e => setFormAuthor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Category & External Buy Now URL */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Custom Category...</option>
                  </select>

                  {formCategory === 'CUSTOM' && (
                    <input
                      type="text"
                      placeholder="Enter custom category name"
                      value={formCustomCategory}
                      onChange={e => setFormCustomCategory(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  )}
                </div>

                {/* External Buy Link */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>
                      Buy Now External Link (URL)
                    </label>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                      External Store / Amazon / Bookshop
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="url"
                      placeholder="https://amazon.com/... or https://bookshop.org/..."
                      value={formBuyUrl}
                      onChange={e => setFormBuyUrl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 36px',
                        borderRadius: '8px',
                        border: '1px solid #86efac',
                        background: '#f0fdf4',
                        fontSize: '14px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                    <ExternalLink
                      size={16}
                      color="#16a34a"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    No ecommerce system needed: clicking Buy Now redirects visitors directly to this purchase link.
                  </div>
                </div>
              </div>

              {/* Row 3: Year, Pages, Rating, Reviews */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    Year
                  </label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={e => setFormYear(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    Pages
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 to hide"
                    value={formPages}
                    onChange={e => setFormPages(e.target.value === '' ? '' : e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    Rating (out of 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="0 to hide"
                    value={formRating}
                    onChange={e => setFormRating(e.target.value === '' ? '' : e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    Reviews Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 to hide"
                    value={formReviewsCount}
                    onChange={e => setFormReviewsCount(e.target.value === '' ? '' : e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Row 4: Short Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Short Summary / Subtitle (Card preview)
                </label>
                <textarea
                  rows={2}
                  placeholder="A concise summary shown on book cards..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Row 5: Detailed Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Detailed Book Synopsis (Opened in Details modal)
                </label>
                <textarea
                  rows={3}
                  placeholder="Full narrative description and overview..."
                  value={formLongDesc}
                  onChange={e => setFormLongDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Row 6: Tags & Featured Flag */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Black Holes, Singularity, Hawking"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '22px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={e => setFormFeatured(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ffcc00' }}
                    />
                    <span>Highlight as Featured Book</span>
                  </label>
                  <p style={{ margin: '2px 0 0 28px', fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                    Featured books take priority in 'The Reading Orbit' on the homepage. Remaining slots (3 total) automatically shuffle daily from all books.
                  </p>
                </div>
              </div>

              {/* Book Cover Upload & Blog Media Gallery Section */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '18px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={18} color="#2563eb" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      Real Book Cover Image
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Upload or reuse book images from your Blog Media Gallery
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Image Preview Box */}
                  <div
                    style={{
                      width: '105px',
                      height: '150px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                      position: 'relative'
                    }}
                  >
                    {formCoverImage ? (
                      <img
                        src={formCoverImage}
                        alt="Book cover preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '12px', color: '#94a3b8' }}>
                        <ImageIcon size={30} style={{ margin: '0 auto 6px auto', display: 'block', opacity: 0.6 }} />
                        <span style={{ fontSize: '11px', lineHeight: 1.2, display: 'block' }}>No image chosen</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Inputs */}
                  <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setIsMediaModalOpen(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#ffcc00',
                          color: '#0f172a',
                          border: 'none',
                          padding: '9px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(255, 204, 0, 0.35)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ImageIcon size={15} />
                        <span>Open in Blog Media Gallery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingCover}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          padding: '9px 14px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Upload size={14} />
                        <span>{uploadingCover ? 'Uploading...' : 'Direct Upload'}</span>
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleDirectFileUpload}
                      />

                      {formCoverImage && (
                        <button
                          type="button"
                          onClick={() => setFormCoverImage('')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#fee2e2',
                            border: '1px solid #fecdd3',
                            color: '#dc2626',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <X size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {/* Manual Image URL Input */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                        Or paste direct Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://... direct image URL"
                        value={formCoverImage}
                        onChange={e => setFormCoverImage(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#0f172a',
                          background: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#64748b',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    background: '#ffcc00',
                    color: '#0f172a',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: '0 2px 10px rgba(255, 204, 0, 0.4)'
                  }}
                >
                  {editingBook ? 'Save Changes' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BLOG MEDIA GALLERY MODAL                                                  */}
      {/* ========================================================================= */}
      {isMediaModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setIsMediaModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '980px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
            }}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ffcc00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ImageIcon size={16} color="#0f172a" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                    Blog Media Gallery
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Select an existing uploaded image or upload a new book cover
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <MediaLibrary
                client={blogClient}
                onSelectMedia={(media: any) => {
                  const url = typeof media === 'string' ? media : (media?.url || '');
                  if (url) {
                    setFormCoverImage(url);
                    showToast('success', 'Book cover selected from media gallery');
                    setIsMediaModalOpen(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
