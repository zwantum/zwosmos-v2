import { useState, useEffect, useRef, useMemo } from 'react';
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
  Layers,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Tag
} from 'lucide-react';
import {
  getCosmicEntries,
  saveCosmicEntry,
  saveCosmicEntriesBatch,
  deleteCosmicEntry,
  deleteCosmicEntriesBatch,
  getActiveCosmicData,
  getTodayIST,
  getUpcomingSortDistance,
  DailyCosmicData,
  DEFAULT_COSMIC_DATA,
  CosmicEntry,
  CosmicEntryType,
  parseMilestoneDateForRollover,
  FACT_TOPIC_PRESETS
} from '../lib/cosmicService';
import { supabase } from '../lib/supabase';
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

const ITEMS_PER_PAGE = 30;

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
  const listTopRef = useRef<HTMLDivElement>(null);

  // Cosmic Entries list
  const [entries, setEntries] = useState<CosmicEntry[]>([]);
  const [currentLiveCosmic, setCurrentLiveCosmic] = useState<DailyCosmicData>(DEFAULT_COSMIC_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [isAssignTopicOpen, setIsAssignTopicOpen] = useState(false);
  const [bulkSelectedTopic, setBulkSelectedTopic] = useState<string>(FACT_TOPIC_PRESETS[0]);
  const [bulkCustomTopic, setBulkCustomTopic] = useState<string>('');
  const [bulkUpdatingTopic, setBulkUpdatingTopic] = useState(false);

  // Identify calendar date duplicates in the Astronomy tab only
  const { duplicateGroups, redundantIds } = useMemo(() => {
    if (activeSubTab !== 'astronomy') return { duplicateGroups: [], redundantIds: [] };
    const tabEntries = entries.filter(e => e.type === 'astronomy');
    const dateMap = new Map<string, CosmicEntry[]>();

    for (const entry of tabEntries) {
      const parsed = parseMilestoneDateForRollover(entry.astronomyDate || '');
      if (parsed) {
        const key = `${parsed.month}_${parsed.day}`;
        if (!dateMap.has(key)) dateMap.set(key, []);
        dateMap.get(key)!.push(entry);
      }
    }

    const groups: { dateKey: string; dateStr: string; items: CosmicEntry[]; keep: CosmicEntry; remove: CosmicEntry[] }[] = [];
    const idsToRemove: string[] = [];

    for (const [dateKey, items] of dateMap.entries()) {
      if (items.length > 1) {
        // Prioritize live entry to keep, otherwise the newest updated entry
        const liveItem = items.find(e => e.status === 'live');
        const sorted = [...items].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        const keepItem = liveItem || sorted[0];
        const removeItems = items.filter(e => e.id !== keepItem.id);

        groups.push({
          dateKey,
          dateStr: keepItem.astronomyDate || items[0].astronomyDate || 'Same date',
          items,
          keep: keepItem,
          remove: removeItems
        });

        removeItems.forEach(e => idsToRemove.push(e.id));
      }
    }

    return { duplicateGroups: groups, redundantIds: idsToRemove };
  }, [entries, activeSubTab]);

  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);

  const handleCleanDuplicates = async () => {
    if (redundantIds.length === 0) return;

    const confirmed = window.confirm(
      `Found ${redundantIds.length} duplicate entries across ${duplicateGroups.length} calendar dates (e.g. from overlapping bulk uploads).\n\n` +
      `This will keep the active/primary entry for each date and permanently delete the ${redundantIds.length} redundant duplicate records.\n\n` +
      `Proceed with cleanup?`
    );

    if (!confirmed) return;

    setCleaningDuplicates(true);
    try {
      const res = await deleteCosmicEntriesBatch(redundantIds);
      if (res.success) {
        showNotification(`Cleaned up ${res.count} duplicate entries successfully!`);
        await loadAllData();
      } else {
        alert('Failed to clean up duplicates: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error cleaning duplicates: ' + err.message);
    } finally {
      setCleaningDuplicates(false);
    }
  };

  // Form State (for Create or Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [formContent, setFormContent] = useState('');
  const tiptapEditorRef = useRef<any>(null);

  // Date fields — used by both Astronomy & Space Fact for midnight IST rollover
  const [monthPart, setMonthPart] = useState('');
  const [dayPart, setDayPart] = useState('');
  const [yearPart, setYearPart] = useState('');
  const [astronomyDateStr, setAstronomyDateStr] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  // When changing sub-tab, reset view to list, pagination and selections
  useEffect(() => {
    setViewMode('list');
    setFilterStatus('all');
    setCurrentPage(1);
    setEditingId(null);
    setSelectedIds(new Set());
  }, [activeSubTab]);

  // Reset page and selection when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
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
    setFormSubtitle('');
    setMonthPart('');
    setDayPart('');
    setYearPart('');
    setAstronomyDateStr('');
    if (type === 'astronomy') {
      setFormTitle('This Day in Astronomy');
      setFormContent('<p>On this day in space history...</p>');
    } else {
      setFormTitle('You & the Cosmos');
      setFormContent('<p>Did you know...</p>');
    }
    setViewMode('form');
  };

  const handleStartEdit = (entry: CosmicEntry) => {
    setEditingId(entry.id);
    setIsEditingTitle(false);
    if (activeSubTab === 'astronomy') {
      setFormTitle('This Day in Astronomy');
      setFormSubtitle(entry.subtitle || (entry.title !== 'This Day in Astronomy' ? entry.title : ''));
    } else {
      setFormTitle(entry.title);
      setFormSubtitle(entry.subtitle || '');
    }
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
    const rawContent = tiptapEditorRef.current ? tiptapEditorRef.current.getHTML() : formContent;
    const finalContent = (rawContent && rawContent.trim() && rawContent !== '<p></p>') ? rawContent : formContent;

    if (!formTitle.trim()) {
      alert('Please enter a module title');
      return;
    }
    if (!stripHtml(finalContent).trim()) {
      alert('Please enter content for this fact');
      return;
    }

    setSaving(true);
    try {
      const finalStatus = asDraft ? 'draft' : 'live';
      const isAstronomy = activeSubTab === 'astronomy';

      const res = await saveCosmicEntry({
        id: editingId || undefined,
        type: activeSubTab as CosmicEntryType,
        title: isAstronomy ? 'This Day in Astronomy' : formTitle,
        subtitle: isAstronomy ? formSubtitle.trim() : (formSubtitle.trim() || formTitle),
        astronomyDate: astronomyDateStr || undefined,
        content: finalContent,
        scheduledAt: null,
        status: finalStatus
      });

      if (res.success && res.data) {
        showNotification(
          finalStatus === 'live'
            ? 'Fact published live to homepage!'
            : 'Fact saved successfully! It will show automatically on its scheduled date.'
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
  const todayIST = getTodayIST();

  const allTabEntries = entries
    .filter(e => e.type === activeSubTab)
    .filter(e => {
      if (filterStatus === 'all') return true;
      if (activeSubTab === 'fact') {
        if (filterStatus === 'live') return e.status === 'live';
        if (filterStatus === 'draft') return e.status !== 'live';
        return true;
      }
      return e.status === filterStatus;
    })
    .sort((a, b) => {
      // 1. Live entry ALWAYS comes first (#1)
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;

      // 2. Upcoming schedule order for Astronomy
      if (activeSubTab === 'astronomy') {
        const distA = getUpcomingSortDistance(a.astronomyDate || '', todayIST);
        const distB = getUpcomingSortDistance(b.astronomyDate || '', todayIST);
        if (distA !== distB) return distA - distB;
      }

      // 3. Fallback tie-break by updatedAt
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(allTabEntries.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const currentTabEntries = allTabEntries.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const liveEntryCount = entries.filter(e => e.type === activeSubTab && e.status === 'live').length;
  const upcomingEntryCount = entries.filter(e => e.type === activeSubTab && e.status === 'draft').length;
  const pastEntryCount = entries.filter(e => e.type === activeSubTab && e.status === 'archived').length;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    const left = Math.max(2, safePage - 1);
    const right = Math.min(totalPages - 1, safePage + 1);

    if (left > 2) {
      pages.push('...');
    }
    for (let i = left; i <= right; i++) {
      pages.push(i);
    }
    if (right < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };

  const allModuleEntries = entries.filter(e => e.type === activeSubTab);
  const currentPageSelectableEntries = currentTabEntries.filter(e => e.status !== 'live');
  const allModuleSelectableEntries = allModuleEntries.filter(e => e.status !== 'live');

  const isAllCurrentPageSelected =
    currentPageSelectableEntries.length > 0 &&
    currentPageSelectableEntries.every(e => selectedIds.has(e.id));

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentPageSelectableEntries.forEach(e => next.delete(e.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentPageSelectableEntries.forEach(e => next.add(e.id));
        return next;
      });
    }
  };

  const handleSelectAllModule = () => {
    setSelectedIds(new Set(allModuleSelectableEntries.map(e => e.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the ${count} selected ${count === 1 ? 'fact' : 'facts'}? This cannot be undone.`
      )
    ) {
      return;
    }

    setBulkDeleting(true);
    try {
      const res = await deleteCosmicEntriesBatch(Array.from(selectedIds));
      if (res.success) {
        showNotification(`Successfully deleted ${res.count} facts!`);
        setSelectedIds(new Set());
        await loadAllData();
      } else {
        alert('Failed to delete entries: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error during bulk deletion: ' + err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBatchAssignTopic = async () => {
    if (selectedIds.size === 0) return;
    const finalTopic = (bulkSelectedTopic === '__custom__' ? bulkCustomTopic : bulkSelectedTopic).trim();
    if (!finalTopic) {
      alert('Please enter or select a valid topic.');
      return;
    }

    setBulkUpdatingTopic(true);
    try {
      const idsArray = Array.from(selectedIds);
      const nowIso = new Date().toISOString();

      if (supabase) {
        const { error } = await supabase
          .from('cosmic_entries')
          .update({ title: finalTopic, subtitle: finalTopic, updated_at: nowIso })
          .in('id', idsArray);
        if (error) {
          console.warn('Supabase bulk topic update warning:', error.message);
        }
      }

      const currentList = await getCosmicEntries();
      const updatedList = currentList.map(item => {
        if (selectedIds.has(item.id)) {
          return { ...item, title: finalTopic, subtitle: finalTopic, updatedAt: nowIso };
        }
        return item;
      });
      localStorage.setItem('zwosmos_cosmic_entries', JSON.stringify(updatedList));

      showNotification(`Successfully assigned topic "${finalTopic}" to ${idsArray.length} facts!`);
      setIsAssignTopicOpen(false);
      setBulkCustomTopic('');
      setSelectedIds(new Set());
      await loadAllData();
    } catch (err: any) {
      alert('Error updating topics: ' + err.message);
    } finally {
      setBulkUpdatingTopic(false);
    }
  };

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
                    {activeSubTab === 'astronomy' ? 'This Day in Astronomy - Entries & Schedule' : 'Space Fact of the Day - Daily Rotation Deck'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                    {activeSubTab === 'astronomy'
                      ? 'Manage previously uploaded facts, currently active content, and future scheduled rollouts with exact calendar dates.'
                      : 'Automated midnight IST rollover. Daily facts cycle through all entries with guaranteed non-consecutive topics and zero date maintenance.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Delete Selected Button (appears when items are selected) */}
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      disabled={bulkDeleting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        cursor: bulkDeleting ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontSize: '13px',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Trash2 size={16} />
                      <span>{bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}</span>
                    </button>
                  )}

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

              {/* Duplicate Dates Warning & One-Click Cleanup Banner */}
              {redundantIds.length > 0 && (
                <div
                  style={{
                    padding: '12px 18px',
                    background: '#fffbeb',
                    border: '1.5px solid #fde68a',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.4 }}>
                      <strong>Duplicate Dates Detected:</strong> {redundantIds.length} redundant duplicate {redundantIds.length === 1 ? 'entry' : 'entries'} found across {duplicateGroups.length} calendar dates (e.g. from overlapping bulk uploads).
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCleanDuplicates}
                    disabled={cleaningDuplicates}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '7px',
                      background: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: cleaningDuplicates ? 'not-allowed' : 'pointer',
                      boxShadow: '0 1px 3px rgba(217, 119, 6, 0.3)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>{cleaningDuplicates ? 'Cleaning...' : `Clean Up ${redundantIds.length} Duplicates`}</span>
                  </button>
                </div>
              )}

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                {(activeSubTab === 'astronomy' ? [
                  { key: 'all', label: `All (${entries.filter(e => e.type === 'astronomy').length})` },
                  { key: 'live', label: `Live Now (${liveEntryCount})`, color: '#10b981' },
                  { key: 'draft', label: `Upcoming (${upcomingEntryCount})`, color: '#64748b' },
                  { key: 'archived', label: `Past Till Date (${pastEntryCount})`, color: '#94a3b8' }
                ] : [
                  { key: 'all', label: `All Facts (${entries.filter(e => e.type === 'fact').length})` },
                  { key: 'live', label: `Live Today (${liveEntryCount})`, color: '#10b981' },
                  { key: 'draft', label: `In Rotation (${entries.filter(e => e.type === 'fact' && e.status !== 'live').length})`, color: '#6366f1' }
                ]).map(tab => (
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

              {/* Multi-Select Toolbar */}
              {currentTabEntries.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: selectedIds.size > 0 ? '10px 16px' : '8px 14px',
                    background: selectedIds.size > 0 ? '#fef2f2' : '#f8fafc',
                    border: selectedIds.size > 0 ? '1.5px solid #fecaca' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    gap: '12px',
                    flexWrap: 'wrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: currentPageSelectableEntries.length > 0 ? 'pointer' : 'default',
                        userSelect: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: selectedIds.size > 0 ? '#991b1b' : '#334155'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isAllCurrentPageSelected}
                        onChange={handleToggleSelectCurrentPage}
                        disabled={currentPageSelectableEntries.length === 0}
                        style={{
                          width: '17px',
                          height: '17px',
                          cursor: currentPageSelectableEntries.length > 0 ? 'pointer' : 'default',
                          accentColor: '#dc2626'
                        }}
                      />
                      <span>
                        {selectedIds.size > 0
                          ? `${selectedIds.size} selected`
                          : 'Select'}
                      </span>
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={handleSelectAllModule}
                        disabled={allModuleSelectableEntries.length === 0}
                        style={{
                          padding: '4px 10px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: allModuleSelectableEntries.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Select All Facts ({allModuleSelectableEntries.length})
                      </button>

                      {selectedIds.size > 0 && (
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          style={{
                            padding: '4px 8px',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748b',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedIds.size > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {activeSubTab === 'fact' && (
                        <button
                          type="button"
                          onClick={() => setIsAssignTopicOpen(true)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 16px',
                            background: '#7c3aed',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Tag size={14} />
                          <span>Change Topic ({selectedIds.size})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        disabled={bulkDeleting}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 16px',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: bulkDeleting ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Trash2 size={14} />
                        <span>{bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

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
                <div ref={listTopRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentTabEntries.map(entry => {
                    const isLive = entry.status === 'live';
                    const isSelected = selectedIds.has(entry.id);

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
                          border: isSelected
                            ? '1.5px solid #dc2626'
                            : isLive
                              ? '1.5px solid #10b981'
                              : '1px solid #e2e8f0',
                          background: isSelected
                            ? '#fffafa'
                            : isLive
                              ? '#f0fdf4'
                              : '#ffffff',
                          boxShadow: isSelected
                            ? '0 4px 14px rgba(220, 38, 38, 0.08)'
                            : isLive
                              ? '0 4px 14px rgba(16, 185, 129, 0.1)'
                              : '0 1px 3px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Checkbox for Multi-Select Deletion */}
                        {!isLive ? (
                          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(entry.id)}
                              style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                accentColor: '#dc2626'
                              }}
                              title="Select for bulk delete"
                            />
                          </div>
                        ) : (
                          <div style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                        )}

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
                                {activeSubTab === 'astronomy' ? 'Live Now' : 'Live Today'}
                              </span>
                            )}

                            {entry.status === 'archived' && activeSubTab === 'astronomy' && (
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

                            {/* Milestone Date Badge (Astronomy only) */}
                            {activeSubTab === 'astronomy' && entry.astronomyDate && (
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

                            {/* Duplicate Date Badge (Astronomy only) */}
                            {activeSubTab === 'astronomy' && redundantIds.includes(entry.id) && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fde68a',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                                title="This date is already covered by another entry."
                              >
                                <AlertTriangle size={11} color="#d97706" />
                                <span>Duplicate Date</span>
                              </span>
                            )}
                          </div>

                          {/* Title & Subtitle */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <h4 style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                              {activeSubTab === 'astronomy' ? 'This Day in Astronomy' : entry.title}
                            </h4>
                            {activeSubTab === 'astronomy' && (
                              (entry.subtitle || (entry.title !== 'This Day in Astronomy' ? entry.title : '')) ? (
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', fontStyle: 'italic' }}>
                                  {entry.subtitle || (entry.title !== 'This Day in Astronomy' ? entry.title : '')}
                                </span>
                              ) : null
                            )}
                          </div>

                          {/* Content Snippet (Preserves Rich Text Formatting) */}
                          <div
                            className="zw-facts-list-snippet"
                            style={{
                              margin: 0,
                              fontSize: '13px',
                              color: '#64748b',
                              lineHeight: 1.45,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word'
                            }}
                            dangerouslySetInnerHTML={{ __html: entry.content }}
                          />
                        </div>

                        {/* Right Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>


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
                        justifyContent: 'space-between',
                        gap: '12px',
                        paddingTop: '16px',
                        borderTop: '1px solid #f1f5f9',
                        marginTop: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        Showing <strong style={{ color: '#0f172a' }}>{(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, allTabEntries.length)}</strong> of <strong style={{ color: '#0f172a' }}>{allTabEntries.length}</strong> facts (Page {safePage} of {totalPages})
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handlePageChange(Math.max(1, safePage - 1))}
                          disabled={safePage <= 1}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '6px 12px', borderRadius: '8px',
                            border: '1px solid #e2e8f0', background: safePage <= 1 ? '#f8fafc' : '#ffffff',
                            color: safePage <= 1 ? '#cbd5e1' : '#334155',
                            cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: '12px', fontWeight: 600
                          }}
                        >
                          <ChevronLeft size={15} />
                          <span>Prev</span>
                        </button>

                        {getPaginationPages().map((page, idx) => {
                          if (page === '...') {
                            return (
                              <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '13px' }}>
                                ...
                              </span>
                            );
                          }
                          const pageNum = Number(page);
                          const isActive = pageNum === safePage;
                          return (
                            <button
                              key={`page-${pageNum}`}
                              type="button"
                              onClick={() => handlePageChange(pageNum)}
                              style={{
                                minWidth: '34px', height: '34px', borderRadius: '8px',
                                border: '1px solid',
                                borderColor: isActive ? '#0f172a' : '#e2e8f0',
                                background: isActive ? '#0f172a' : '#ffffff',
                                color: isActive ? '#ffffff' : '#475569',
                                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))}
                          disabled={safePage >= totalPages}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '6px 12px', borderRadius: '8px',
                            border: '1px solid #e2e8f0', background: safePage >= totalPages ? '#f8fafc' : '#ffffff',
                            color: safePage >= totalPages ? '#cbd5e1' : '#334155',
                            cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                            fontSize: '12px', fontWeight: 600
                          }}
                        >
                          <span>Next</span>
                          <ChevronRight size={15} />
                        </button>
                      </div>
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

              {/* Title Field */}
              {activeSubTab === 'astronomy' ? (
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
                      placeholder="This Day in Astronomy"
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
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Topic / Category Title <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}>(Displays as subtitle below "Space Fact of the Day")</span>
                  </label>

                  {/* Multiple Topic Selector + Custom Input */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                      value={FACT_TOPIC_PRESETS.includes(formTitle) ? formTitle : '__custom__'}
                      onChange={(e) => {
                        if (e.target.value !== '__custom__') {
                          setFormTitle(e.target.value);
                        }
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        minWidth: '220px'
                      }}
                    >
                      <option value="">-- Choose from Topics --</option>
                      {FACT_TOPIC_PRESETS.map(preset => (
                        <option key={preset} value={preset}>{preset}</option>
                      ))}
                      <option value="__custom__">Custom Topic (Type below)...</option>
                    </select>

                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Or enter custom topic title..."
                      style={{
                        flex: 1,
                        minWidth: '240px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '14px',
                        fontWeight: 500,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Clickable Quick Topic Chips */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {FACT_TOPIC_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormTitle(preset)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: formTitle === preset ? '1.5px solid #7c3aed' : '1px solid #e2e8f0',
                          background: formTitle === preset ? '#f3e8ff' : '#f8fafc',
                          color: formTitle === preset ? '#6d28d9' : '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.1s ease'
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Select from available topic options above or type any custom topic.
                  </span>
                </div>
              )}

              {/* Event Heading / Subtitle (Only in This Day in Astronomy) */}
              {activeSubTab === 'astronomy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Event Heading / Subtitle <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}>(Optional small headline)</span>
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="e.g. Mars Orbiter Mission (Mangalyaan), Voyager 1 Earth-Moon Photo"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '14px',
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Displays as a small headline directly below "This Day in Astronomy" on the homepage.
                  </span>
                </div>
              )}

              {/* Milestone Date Pickers (Astronomy only) */}
              {activeSubTab === 'astronomy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Astronomy Milestone Date
                  </label>

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
              )}

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
                  onReady={(ed) => { tiptapEditorRef.current = ed; }}
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
                  <span>{saving ? 'Saving...' : activeSubTab === 'fact' ? 'Publish' : 'Publish'}</span>
                </button>

                {/* Save Entry */}
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
                  <Layers size={15} />
                  <span>{activeSubTab === 'fact' ? 'Save to Rotation Queue' : 'Save Entry'}</span>
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
                      margin: '0 0 8px',
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '1.55rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1.2
                    }}
                  >
                    {currentLiveCosmic.astronomyTitle}
                  </h3>

                  {currentLiveCosmic.astronomySubtitle && currentLiveCosmic.astronomySubtitle.trim() && (
                    <div
                      style={{
                        margin: '0 0 10px',
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        fontStyle: 'italic',
                        color: '#bd75ff',
                        lineHeight: 1.3
                      }}
                    >
                      {currentLiveCosmic.astronomySubtitle}
                    </div>
                  )}

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
          existingEntries={entries}
          onBatchSave={saveCosmicEntriesBatch}
          onSuccess={async (count, updatedCount, insertedCount) => {
            if (updatedCount && insertedCount) {
              showNotification(`Bulk upload complete: ${updatedCount} existing dates updated, ${insertedCount} new dates added!`);
            } else if (updatedCount) {
              showNotification(`Bulk upload complete: ${updatedCount} existing dates updated!`);
            } else {
              showNotification(`Successfully imported ${count} facts in bulk!`);
            }
            await loadAllData();
          }}
        />
      )}

      {/* Batch Assign Topic Modal */}
      {isAssignTopicOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => !bulkUpdatingTopic && setIsAssignTopicOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Assign Topic to {selectedIds.size} Selected Facts
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Categorize selected facts into any topic below. This topic will display as the subtitle on the homepage.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Select Topic:
              </label>

              <select
                value={bulkSelectedTopic}
                onChange={e => setBulkSelectedTopic(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {FACT_TOPIC_PRESETS.map(preset => (
                  <option key={preset} value={preset}>{preset}</option>
                ))}
                <option value="__custom__">Custom Topic (Type below)...</option>
              </select>

              {/* Clickable Quick Topic Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {FACT_TOPIC_PRESETS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setBulkSelectedTopic(preset);
                      setBulkCustomTopic('');
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: bulkSelectedTopic === preset ? '1.5px solid #7c3aed' : '1px solid #e2e8f0',
                      background: bulkSelectedTopic === preset ? '#f3e8ff' : '#f8fafc',
                      color: bulkSelectedTopic === preset ? '#6d28d9' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {bulkSelectedTopic === '__custom__' && (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    value={bulkCustomTopic}
                    onChange={e => setBulkCustomTopic(e.target.value)}
                    placeholder="Enter custom topic title..."
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #7c3aed',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setIsAssignTopicOpen(false)}
                disabled={bulkUpdatingTopic}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchAssignTopic}
                disabled={bulkUpdatingTopic}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#7c3aed',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: bulkUpdatingTopic ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)'
                }}
              >
                {bulkUpdatingTopic ? 'Updating...' : `Apply Topic to ${selectedIds.size} Facts`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
