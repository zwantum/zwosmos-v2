import { useState, useEffect } from 'react';
import {
  Pencil,
  Check,
  Lock,
  Save,
  Rocket,
  Calendar,
  Eye,
  CheckCircle2,
  FileText,
  Plus,
  ArrowLeft,
  Trash2,
  Zap,
  Layers,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload
} from 'lucide-react';
import {
  getCosmicEntries,
  saveCosmicEntry,
  saveCosmicEntriesBatch,
  setEntryLive,
  deleteCosmicEntry,
  getActiveCosmicData,
  DailyCosmicData,
  DEFAULT_COSMIC_DATA,
  CosmicEntry,
  CosmicEntryType
} from '../lib/cosmicService';
import TiptapEditor from './TiptapEditor';
import FactsBulkUploadModal from './FactsBulkUploadModal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

function parseDateParts(dateStr: string) {
  if (!dateStr) return { month: '', day: '', year: '' };

  const m1 = dateStr.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})?$/);
  if (m1) {
    return { month: m1[1] || '', day: m1[2] || '', year: m1[3] || '' };
  }
  const m2 = dateStr.trim().match(/^(\d{1,2})\s+([A-Za-z]+),?\s*(\d{4})?$/);
  if (m2) {
    return { month: m2[2] || '', day: m2[1] || '', year: m2[3] || '' };
  }
  const parts = dateStr.split(/[\s,]+/).filter(Boolean);
  let month = '';
  let day = '';
  let year = '';
  for (const p of parts) {
    if (MONTHS.some(m => m.toLowerCase() === p.toLowerCase())) {
      month = MONTHS.find(m => m.toLowerCase() === p.toLowerCase()) || p;
    } else if (!isNaN(Number(p)) && Number(p) >= 1 && Number(p) <= 31 && !day) {
      day = p;
    } else if (!isNaN(Number(p)) && Number(p) > 1000) {
      year = p;
    }
  }
  return { month, day, year };
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

const ITEMS_PER_PAGE = 8;

export default function FactsManager() {
  const getInitialSubTab = (): 'astronomy' | 'fact' | 'preview' => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subtab');
      if (sub === 'astronomy' || sub === 'fact' || sub === 'preview') return sub;
      const stored = localStorage.getItem('zwosmos_admin_facts_subtab');
      if (stored === 'astronomy' || stored === 'fact' || stored === 'preview') return stored;
    } catch { }
    return 'astronomy';
  };

  const [activeSubTab, setActiveSubTabState] = useState<'astronomy' | 'fact' | 'preview'>(getInitialSubTab);

  const setActiveSubTab = (tab: 'astronomy' | 'fact' | 'preview') => {
    setActiveSubTabState(tab);
    try {
      localStorage.setItem('zwosmos_admin_facts_subtab', tab);
      const url = new URL(window.location.href);
      url.searchParams.set('subtab', tab);
      window.history.replaceState({}, '', url.toString());
    } catch { }
  };

  // List vs Form view mode for both astronomy & fact tabs (defaults to 'list')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'draft' | 'archived'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Cosmic Entries list
  const [entries, setEntries] = useState<CosmicEntry[]>([]);
  const [currentLiveCosmic, setCurrentLiveCosmic] = useState<DailyCosmicData>(DEFAULT_COSMIC_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Form State (for Create or Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [formContent, setFormContent] = useState('');

  // Date fields — used by both Astronomy & Space Fact for midnight IST rollover
  const [monthPart, setMonthPart] = useState('');
  const [dayPart, setDayPart] = useState('');
  const [yearPart, setYearPart] = useState('');
  const [astronomyDateStr, setAstronomyDateStr] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  // When changing sub-tab, reset view to list and pagination
  useEffect(() => {
    setViewMode('list');
    setFilterStatus('all');
    setCurrentPage(1);
    setEditingId(null);
  }, [activeSubTab]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [liveData, allEntries] = await Promise.all([
        getActiveCosmicData(),
        getCosmicEntries()
      ]);
      setCurrentLiveCosmic(liveData);
      setEntries(allEntries);
    } catch (err) {
      console.error('Failed to load facts data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  /* =========================================================================
     Action Handlers: Create / Edit / Make Live / Delete
     ========================================================================= */

  const handleStartCreate = (type: CosmicEntryType) => {
    setEditingId(null);
    setIsEditingTitle(false);
    setMonthPart('');
    setDayPart('');
    setYearPart('');
    setAstronomyDateStr('');
    if (type === 'astronomy') {
      setFormTitle('This Day in Astronomy');
      setFormContent('<p>On this day in space history...</p>');
    } else {
      setFormTitle('SPACE FACT OF THE DAY');
      setFormContent('<p>Did you know...</p>');
    }
    setViewMode('form');
  };

  const handleStartEdit = (entry: CosmicEntry) => {
    setEditingId(entry.id);
    setIsEditingTitle(false);
    setFormTitle(entry.title);
    setFormContent(entry.content);

    // Populate date parts for both astronomy and fact entries
    const parsed = parseDateParts(entry.astronomyDate || '');
    setMonthPart(parsed.month);
    setDayPart(parsed.day);
    setYearPart(parsed.year);
    setAstronomyDateStr(entry.astronomyDate || '');

    setViewMode('form');
  };

  const handleDatePartChange = (m: string, d: string, y: string) => {
    setMonthPart(m);
    setDayPart(d);
    setYearPart(y);

    const parts: string[] = [];
    if (m) parts.push(m);
    if (d) {
      if (y) parts.push(`${d},`);
      else parts.push(d);
    }
    if (y) parts.push(y);

    setAstronomyDateStr(parts.join(' '));
  };

  const handleSaveEntry = async (asDraft = false) => {
    if (!formTitle.trim()) {
      alert('Please enter a module title');
      return;
    }
    if (!stripHtml(formContent).trim()) {
      alert('Please enter content for this fact');
      return;
    }

    setSaving(true);
    try {
      const finalStatus = asDraft ? 'draft' : 'live';

      const res = await saveCosmicEntry({
        id: editingId || undefined,
        type: activeSubTab as CosmicEntryType,
        title: formTitle,
        astronomyDate: astronomyDateStr || undefined,
        content: formContent,
        scheduledAt: null,
        status: finalStatus
      });

      if (res.success && res.data) {
        showNotification(
          finalStatus === 'live'
            ? 'Fact published live to homepage!'
            : 'Fact saved as draft!'
        );
        await loadAllData();
        setViewMode('list');
      } else {
        alert('Failed to save entry: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error saving entry: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMakeLive = async (entry: CosmicEntry) => {
    if (entry.status === 'live') return;
    setSaving(true);
    try {
      const res = await setEntryLive(entry.id);
      if (res.success) {
        showNotification(`"${entry.title}" is now live on the homepage!`);
        await loadAllData();
      } else {
        alert('Failed to make live: ' + res.error);
      }
    } catch (err: any) {
      alert('Error making live: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: CosmicEntry) => {
    if (entry.status === 'live') {
      alert('Cannot delete the currently live fact. Please set another fact live first.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${entry.title}"?`)) {
      return;
    }
    setSaving(true);
    try {
      const res = await deleteCosmicEntry(entry.id);
      if (res.success) {
        showNotification('Entry deleted successfully');
        await loadAllData();
      } else {
        alert('Failed to delete entry: ' + res.error);
      }
    } catch (err: any) {
      alert('Error deleting entry: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filtered & sorted entries for active tab
  const allTabEntries = entries
    .filter(e => e.type === activeSubTab)
    .filter(e => {
      if (filterStatus === 'all') return true;
      return e.status === filterStatus;
    })
    .sort((a, b) => {
      // 1. Live entries first
      if (a.status === 'live') return -1;
      if (b.status === 'live') return 1;
      // 2. Drafts by milestone date then updated date
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(allTabEntries.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const currentTabEntries = allTabEntries.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const liveEntryCount = entries.filter(e => e.type === activeSubTab && e.status === 'live').length;
  const draftEntryCount = entries.filter(e => e.type === activeSubTab && e.status === 'draft').length;
  const pastEntryCount = entries.filter(e => e.type === activeSubTab && e.status === 'archived').length;

  if (loading) {
    return (
      <div style={{ background: '#ffffff', padding: '36px', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
        Loading cosmic facts and astronomy modules...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Notification Banner */}
      {notification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            background: notification.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: notification.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
            borderRadius: '10px',
            color: notification.type === 'success' ? '#065f46' : '#991b1b',
            fontSize: '14px',
            fontWeight: 500,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <AlertCircle size={18} color="#ef4444" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs with Yellow Branding */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          background: '#ffffff',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('astronomy')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeSubTab === 'astronomy' ? '#ffcc00' : 'transparent',
              color: activeSubTab === 'astronomy' ? '#0f172a' : '#64748b',
              boxShadow: activeSubTab === 'astronomy' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar size={15} />
            <span>This Day in Astronomy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('fact')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeSubTab === 'fact' ? '#ffcc00' : 'transparent',
              color: activeSubTab === 'fact' ? '#0f172a' : '#64748b',
              boxShadow: activeSubTab === 'fact' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Rocket size={15} />
            <span>Space Fact of the Day</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeSubTab === 'preview' ? '#ffcc00' : 'transparent',
              color: activeSubTab === 'preview' ? '#0f172a' : '#64748b',
              boxShadow: activeSubTab === 'preview' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Eye size={15} />
            <span>Homepage Live Preview</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TABS 1 & 2: ASTRONOMY OR SPACE FACT (LIST VIEW & FORM VIEW)         */}
      {/* =================================================================== */}
      {(activeSubTab === 'astronomy' || activeSubTab === 'fact') && (
        <div
          style={{
            background: '#ffffff',
            padding: '28px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {/* ================================================================= */}
          {/* VIEW MODE: LIST (DEFAULT)                                         */}
          {/* ================================================================= */}
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Title + Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                    {activeSubTab === 'astronomy' ? 'This Day in Astronomy - Entries & Schedule' : 'Space Fact of the Day - Entries & Schedule'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                    Manage previously uploaded facts, currently active content, and future scheduled rollouts with exact time slots.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsBulkUploadOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#ffffff',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Upload size={16} color="#d97706" />
                    <span>Bulk Upload (Excel)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartCreate(activeSubTab)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#ffcc00',
                      color: '#0f172a',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      boxShadow: '0 2px 8px rgba(255, 204, 0, 0.35)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus size={16} />
                    <span>{activeSubTab === 'astronomy' ? 'Add New Milestone' : 'Add New Fact'}</span>
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                {[
                  { key: 'all', label: `All (${entries.filter(e => e.type === activeSubTab).length})` },
                  { key: 'live', label: `Live Now (${liveEntryCount})`, color: '#10b981' },
                  { key: 'draft', label: `Drafts (${draftEntryCount})`, color: '#64748b' },
                  { key: 'archived', label: `Past Till Date (${pastEntryCount})`, color: '#94a3b8' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterStatus(tab.key as any)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: filterStatus === tab.key ? '#0f172a' : '#e2e8f0',
                      background: filterStatus === tab.key ? '#0f172a' : '#f8fafc',
                      color: filterStatus === tab.key ? '#ffffff' : '#475569',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Entries Table / Cards */}
              {currentTabEntries.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Layers size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                    No facts found in this filter
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                    Click "Add New" to create and schedule your first cosmic fact.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setIsBulkUploadOpen(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        background: '#ffffff',
                        color: '#0f172a',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={14} color="#d97706" />
                      <span>Bulk Upload (Excel)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartCreate(activeSubTab)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        background: '#ffcc00',
                        color: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} />
                      <span>{activeSubTab === 'astronomy' ? 'Add New Milestone' : 'Add New Fact'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentTabEntries.map(entry => {
                    const isLive = entry.status === 'live';
                    const isDraft = entry.status === 'draft';

                    return (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          padding: '16px 20px',
                          borderRadius: '12px',
                          border: isLive ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                          background: isLive ? '#f0fdf4' : '#ffffff',
                          boxShadow: isLive ? '0 4px 14px rgba(16, 185, 129, 0.1)' : '0 1px 3px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Left Info */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            {/* Status Badge */}
                            {isLive && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '3px 10px',
                                  background: '#10b981',
                                  color: '#ffffff',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', display: 'inline-block' }} />
                                Live Now
                              </span>
                            )}

                            {isDraft && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '3px 9px',
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                              >
                                Draft
                              </span>
                            )}

                            {entry.status === 'archived' && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '3px 9px',
                                  background: '#f8f0ff',
                                  color: '#6d28d9',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                              >
                                Past Entry
                              </span>
                            )}

                            {/* Milestone Date Badge — always show if present */}
                            {entry.astronomyDate && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  background: '#e0e7ff',
                                  color: '#3730a3',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                              >
                                <Calendar size={11} />
                                <span>{entry.astronomyDate}</span>
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                            {entry.title}
                          </h4>

                          {/* Content Snippet */}
                          <p
                            style={{
                              margin: 0,
                              fontSize: '13px',
                              color: '#64748b',
                              lineHeight: 1.45,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {stripHtml(entry.content)}
                          </p>
                        </div>

                        {/* Right Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {/* Make Live Now Button (if not already live) */}
                          {!isLive && (
                            <button
                              type="button"
                              onClick={() => handleMakeLive(entry)}
                              disabled={saving}
                              title="Make this fact live on the homepage right now"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 12px',
                                borderRadius: '7px',
                                border: '1px solid #10b981',
                                background: '#ecfdf5',
                                color: '#047857',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Zap size={13} />
                              <span>Make Live</span>
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(entry)}
                            disabled={saving}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              borderRadius: '7px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Pencil size={13} />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button (Only for non-live) */}
                          {!isLive && (
                            <button
                              type="button"
                              onClick={() => handleDelete(entry)}
                              disabled={saving}
                              title="Delete entry"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '7px',
                                border: '1px solid #fee2e2',
                                background: '#fff5f5',
                                color: '#dc2626',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #f1f5f9',
                        marginTop: '4px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '32px', height: '32px', borderRadius: '7px',
                          border: '1px solid #e2e8f0', background: safePage <= 1 ? '#f8fafc' : '#ffffff',
                          color: safePage <= 1 ? '#cbd5e1' : '#334155',
                          cursor: safePage <= 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <ChevronLeft size={15} />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          style={{
                            minWidth: '32px', height: '32px', borderRadius: '7px',
                            border: '1px solid',
                            borderColor: page === safePage ? '#0f172a' : '#e2e8f0',
                            background: page === safePage ? '#0f172a' : '#ffffff',
                            color: page === safePage ? '#ffffff' : '#475569',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '32px', height: '32px', borderRadius: '7px',
                          border: '1px solid #e2e8f0', background: safePage >= totalPages ? '#f8fafc' : '#ffffff',
                          color: safePage >= totalPages ? '#cbd5e1' : '#334155',
                          cursor: safePage >= totalPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <ChevronRight size={15} />
                      </button>

                      <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>
                        {allTabEntries.length} total
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW MODE: FORM (CREATE / EDIT WITH SCHEDULE CONTROLS)            */}
          {/* ================================================================= */}
          {viewMode === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Back to List Navigation Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Entries List</span>
                </button>

                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                  {editingId ? 'Editing Fact' : 'Creating New Fact'}
                </span>
              </div>

              {/* Title Field with Lock & Edit Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Module Title
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(!isEditingTitle)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: isEditingTitle ? '1px solid #10b981' : '1px solid #cbd5e1',
                      background: isEditingTitle ? '#ecfdf5' : '#f8fafc',
                      color: isEditingTitle ? '#047857' : '#334155',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isEditingTitle ? (
                      <>
                        <Check size={13} />
                        <span>Done Editing</span>
                      </>
                    ) : (
                      <>
                        <Pencil size={13} />
                        <span>Edit Title</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={formTitle}
                    readOnly={!isEditingTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={activeSubTab === 'astronomy' ? 'This Day in Astronomy' : 'SPACE FACT OF THE DAY'}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      paddingRight: !isEditingTitle ? '36px' : '14px',
                      borderRadius: '8px',
                      border: isEditingTitle ? '1.5px solid #ffcc00' : '1px solid #e2e8f0',
                      background: isEditingTitle ? '#ffffff' : '#f8fafc',
                      color: '#0f172a',
                      fontSize: '14px',
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: isEditingTitle ? 'text' : 'default',
                      transition: 'all 0.15s ease'
                    }}
                  />
                  {!isEditingTitle && (
                    <Lock
                      size={15}
                      color="#94a3b8"
                      style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }}
                    />
                  )}
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {isEditingTitle
                    ? 'Title unlocked: edit text and click "Done Editing" when finished.'
                    : 'Title is locked by default. Click "Edit Title" to modify it.'}
                </span>
              </div>

              {/* Milestone Date Pickers — Astronomy shows label; Fact shows same pickers but with rollover note */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {activeSubTab === 'astronomy' ? 'Astronomy Milestone Date' : 'Rollover Date (for Auto-Switch at Midnight IST)'}
                </label>
                {activeSubTab === 'fact' && (
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '-4px' }}>
                    Assign a calendar date - this fact auto-goes live at 12:00 AM IST on that day each year. Date is not shown on the homepage.
                  </span>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px',
                    maxWidth: '430px',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Month */}
                  <div style={{ flex: '1 1 150px' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                      Month (Select)
                    </span>
                    <select
                      value={monthPart}
                      onChange={(e) => handleDatePartChange(e.target.value, dayPart, yearPart)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">-- Select Month --</option>
                      {MONTHS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Day */}
                  <div style={{ flex: '1 1 95px' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                      Date (Day)
                    </span>
                    <select
                      value={dayPart}
                      onChange={(e) => handleDatePartChange(monthPart, e.target.value, yearPart)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">-- Day --</option>
                      {DAYS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div style={{ flex: '1 1 110px' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                      Year (Type)
                    </span>
                    <input
                      type="text"
                      value={yearPart}
                      onChange={(e) => handleDatePartChange(monthPart, dayPart, e.target.value)}
                      placeholder="e.g. 1977"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Output Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    color: '#475569',
                    marginTop: '4px',
                    width: 'fit-content'
                  }}
                >
                  <span>Selected Date:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {astronomyDateStr || 'Please select month, day & type year'}
                  </strong>
                </div>
              </div>

              {/* Rich Text Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="#334155" />
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Content Area (Rich Text Editor)
                  </label>
                </div>
                <TiptapEditor
                  value={formContent}
                  onChange={(newHtml) => setFormContent(newHtml)}
                  minHeight="180px"
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Format text with bold, italics, links, alignments, and lists.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                {/* Publish Live Now */}
                <button
                  type="button"
                  onClick={() => handleSaveEntry(false)}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ffcc00',
                    color: '#0f172a',
                    border: 'none',
                    padding: '12px 26px',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    boxShadow: '0 2px 8px rgba(255, 204, 0, 0.35)',
                    opacity: saving ? 0.7 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Publish'}</span>
                </button>

                {/* Save as Draft */}
                <button
                  type="button"
                  onClick={() => handleSaveEntry(true)}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    opacity: saving ? 0.7 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FileText size={15} />
                  <span>Save as Draft</span>
                </button>

                {/* Cancel */}
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  disabled={saving}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: LIVE HOMEPAGE PREVIEW                                        */}
      {/* =================================================================== */}
      {activeSubTab === 'preview' && (
        <div
          style={{
            background: '#ffffff',
            padding: '28px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 600, color: '#0f172a' }}>
                Live Homepage Dual-Card Preview
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Accurate visual preview of how currently live facts appear on the homepage against the space background.
              </p>
            </div>
          </div>

          {/* Deep Space Background Container */}
          <div
            style={{
              borderRadius: '16px',
              padding: '40px 32px',
              background: 'radial-gradient(ellipse at 50% 30%, #160a2c 0%, #080314 60%, #030008 100%)',
              color: '#ffffff',
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8)'
            }}
          >
            <div
              style={{
                maxWidth: '1000px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1.15fr',
                gap: '36px',
                alignItems: 'center'
              }}
            >
              {/* Left Card: This Day in Astronomy */}
              <div
                style={{
                  position: 'relative',
                  marginLeft: '24px',
                  boxSizing: 'border-box'
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    border: '1.5px solid var(--brand-purple)',
                    borderRadius: '16px',
                    padding: '34px 30px 32px 36px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Signature Floating Sidebar Tabs on the Left Border */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '22px',
                      left: 0,
                      transform: 'translateX(-50%)',
                      zIndex: 5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      pointerEvents: 'none'
                    }}
                  >
                    {/* Date Pill Tab */}
                    <div
                      style={{
                        background: '#080711',
                        border: '1.5px solid var(--brand-purple)',
                        borderRadius: '20px',
                        padding: '14px 6px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '1.2px',
                        textTransform: 'uppercase',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {currentLiveCosmic.astronomyDate}
                    </div>

                    {/* Calendar Icon */}
                    <div
                      title={currentLiveCosmic.astronomyDate}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#080711',
                        border: '1.5px solid var(--brand-purple)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                  </div>

                  <h3
                    style={{
                      margin: '0 0 10px',
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '1.55rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1.2
                    }}
                  >
                    {currentLiveCosmic.astronomyTitle}
                  </h3>

                  <div
                    className="zw-cosmic-rich-content zw-cosmic-scrollable"
                    style={{
                      fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
                      fontSynthesis: 'weight style',
                      fontSize: '0.95rem',
                      lineHeight: 1.68,
                      color: '#cbd5e1',
                      maxHeight: '145px',
                      overflowY: 'auto',
                      paddingRight: '8px'
                    }}
                    dangerouslySetInnerHTML={{ __html: currentLiveCosmic.astronomyContent }}
                  />
                </div>
              </div>

              {/* Flat Divider */}
              <div
                style={{
                  width: '3px',
                  height: '140px',
                  backgroundColor: '#ffba00',
                  borderRadius: '2px',
                  flexShrink: 0
                }}
              />

              {/* Right Module: Space Fact */}
              <div>
                <h3
                  style={{
                    margin: '0 0 14px',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.45rem',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    lineHeight: 1.2
                  }}
                >
                  {currentLiveCosmic.factTitle}
                </h3>

                <div
                  className="zw-cosmic-rich-content"
                  style={{
                    fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
                    fontSynthesis: 'weight style',
                    fontSize: '0.95rem',
                    lineHeight: 1.68,
                    color: '#cbd5e1'
                  }}
                  dangerouslySetInnerHTML={{ __html: currentLiveCosmic.factContent }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal via Excel */}
      {isBulkUploadOpen && (
        <FactsBulkUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          entryType={activeSubTab === 'fact' ? 'fact' : 'astronomy'}
          onBatchSave={saveCosmicEntriesBatch}
          onSuccess={async (count) => {
            showNotification(`Successfully imported ${count} facts in bulk!`);
            await loadAllData();
          }}
        />
      )}
    </div>
  );
}
