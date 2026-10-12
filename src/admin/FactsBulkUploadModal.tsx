import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Info,
  RefreshCw,
  CopyPlus,
  SkipForward,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CosmicEntry, CosmicEntryType, CosmicEntryStatus, parseMilestoneDateForRollover } from '../lib/cosmicService';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface ParsedFactRow {
  rowNumber: number;
  rawDate: any;
  normalizedDate: string;
  title: string;
  subtitle?: string;
  content: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface FactsBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryType: CosmicEntryType; // Strictly 'astronomy' or 'fact' based on active tab
  existingEntries?: CosmicEntry[];
  onSuccess: (count: number, updatedCount?: number, insertedCount?: number) => void;
  onBatchSave: (
    entries: Array<{
      type: CosmicEntryType;
      title: string;
      subtitle?: string;
      astronomyDate?: string;
      content: string;
      status?: CosmicEntryStatus;
    }>,
    conflictAction?: 'update' | 'skip' | 'duplicate'
  ) => Promise<{ success: boolean; count: number; updatedCount?: number; insertedCount?: number; error?: string }>;
}

export default function FactsBulkUploadModal({
  isOpen,
  onClose,
  entryType,
  existingEntries = [],
  onSuccess,
  onBatchSave
}: FactsBulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedFactRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [conflictAction, setConflictAction] = useState<'update' | 'skip' | 'duplicate'>('update');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isAstronomy = entryType === 'astronomy';
  const isTerminology = entryType === 'terminology';
  const moduleLabel = isAstronomy
    ? 'This Day in Astronomy'
    : isTerminology
    ? 'Space Terminologies'
    : 'Space Fact of the Day';

  // Map existing entries: by calendar date for astronomy, by clean content for facts, by term for terminology
  const existingMatchesMap = useMemo(() => {
    const map = new Map<string, CosmicEntry>();
    for (const e of existingEntries) {
      if (e.type !== entryType) continue;
      if (isAstronomy) {
        const parsed = parseMilestoneDateForRollover(e.astronomyDate || '');
        if (parsed) {
          const key = `${parsed.month}_${parsed.day}`;
          if (!map.has(key) || e.status === 'live') {
            map.set(key, e);
          }
        }
      } else if (isTerminology) {
        const cleanTerm = (e.title || '').toLowerCase().trim();
        if (cleanTerm && (!map.has(cleanTerm) || e.status === 'live')) {
          map.set(cleanTerm, e);
        }
      } else {
        const cleanContent = e.content.replace(/<[^>]*>?/gm, '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
        if (cleanContent && (!map.has(cleanContent) || e.status === 'live')) {
          map.set(cleanContent, e);
        }
      }
    }
    return map;
  }, [existingEntries, entryType, isAstronomy, isTerminology]);

  // Identify how many valid rows in the uploaded file match an existing entry
  const { matchingCount, newCount } = useMemo(() => {
    let matching = 0;
    let newItems = 0;
    for (const row of parsedRows) {
      if (!row.isValid) continue;
      if (isAstronomy) {
        const parsed = parseMilestoneDateForRollover(row.normalizedDate);
        if (parsed) {
          const key = `${parsed.month}_${parsed.day}`;
          if (existingMatchesMap.has(key)) matching++;
          else newItems++;
        } else {
          newItems++;
        }
      } else if (isTerminology) {
        const cleanTerm = (row.title || '').toLowerCase().trim();
        if (cleanTerm && existingMatchesMap.has(cleanTerm)) matching++;
        else newItems++;
      } else {
        const cleanContent = row.content.replace(/<[^>]*>?/gm, '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
        if (cleanContent && existingMatchesMap.has(cleanContent)) matching++;
        else newItems++;
      }
    }
    return { matchingCount: matching, newCount: newItems };
  }, [parsedRows, existingMatchesMap, isAstronomy, isTerminology]);

  // Reset when opened
  React.useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParsedRows([]);
      setUploadError(null);
      setIsSaving(false);
      setShowGuide(false);
      setConflictAction('update');
    }
  }, [isOpen, entryType]);

  if (!isOpen) return null;

  /* =========================================================================
     Date Normalization Helpers
     ========================================================================= */

  function normalizeExcelDate(val: any): string {
    if (!val) return '';

    // If it's a JS Date object (e.g. from SheetJS cellDates: true)
    if (val instanceof Date && !isNaN(val.getTime())) {
      // Use local date getters to prevent timezone offset shifts (e.g. IST UTC+5:30 shifting Jan 1 to Dec 31)
      const m = MONTHS[val.getMonth()];
      const d = val.getDate();
      const y = val.getFullYear();
      return `${m} ${d}${y ? `, ${y}` : ''}`;
    }

    // If it's a numeric Excel serial date (e.g. 45560)
    if (typeof val === 'number') {
      try {
        if (XLSX.SSF && XLSX.SSF.parse_date_code) {
          const parsed = XLSX.SSF.parse_date_code(val);
          if (parsed && parsed.m >= 1 && parsed.m <= 12 && parsed.d >= 1) {
            const m = MONTHS[parsed.m - 1];
            return `${m} ${parsed.d}${parsed.y ? `, ${parsed.y}` : ''}`;
          }
        }
      } catch { }
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) {
        const m = MONTHS[d.getUTCMonth()];
        const day = d.getUTCDate();
        const y = d.getUTCFullYear();
        return `${m} ${day}, ${y}`;
      }
    }

    const str = String(val).trim();
    if (!str) return '';

    // Match "1 January 1801" or "01 January 2026" or "1 Jan 2026"
    const dayMonthYear = str.match(/^(\d{1,2})[\s\-]+([A-Za-z]+)(?:[\s,]+(\d{2,4}))?/);
    if (dayMonthYear) {
      const day = parseInt(dayMonthYear[1], 10);
      const monthStr = dayMonthYear[2].toLowerCase();
      const mIdx = MONTHS.findIndex(m => m.toLowerCase().startsWith(monthStr.slice(0, 3)));
      if (mIdx !== -1) {
        const yr = dayMonthYear[3] ? `, ${dayMonthYear[3]}` : '';
        return `${MONTHS[mIdx]} ${day}${yr}`;
      }
    }

    // Match "January 1, 1801" or "Jan 1 2026" or "January 1"
    const monthDayYear = str.match(/^([A-Za-z]+)[\s\-]+(\d{1,2})(?:[\s,]+(\d{2,4}))?/);
    if (monthDayYear) {
      const monthStr = monthDayYear[1].toLowerCase();
      const day = parseInt(monthDayYear[2], 10);
      const mIdx = MONTHS.findIndex(m => m.toLowerCase().startsWith(monthStr.slice(0, 3)));
      if (mIdx !== -1) {
        const yr = monthDayYear[3] ? `, ${monthDayYear[3]}` : '';
        return `${MONTHS[mIdx]} ${day}${yr}`;
      }
    }

    // ISO format: YYYY-MM-DD or YYYY/MM/DD
    const iso = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) {
      const mIdx = parseInt(iso[2], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return `${MONTHS[mIdx]} ${parseInt(iso[3], 10)}, ${iso[1]}`;
      }
    }

    // DD-MM-YYYY or DD/MM/YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (ddmmyyyy) {
      const mIdx = parseInt(ddmmyyyy[2], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return `${MONTHS[mIdx]} ${parseInt(ddmmyyyy[1], 10)}, ${ddmmyyyy[3]}`;
      }
    }

    return str;
  }

  function formatContentToHtml(raw: string): string {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (trimmed.startsWith('<p') || trimmed.startsWith('<div')) {
      return trimmed;
    }
    // Convert newlines to paragraphs
    const paragraphs = trimmed
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);
    if (paragraphs.length === 0) return `<p>${trimmed}</p>`;
    return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
  }

  /* =========================================================================
     Excel Parser
     ========================================================================= */

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    try {
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setUploadError('The uploaded Excel workbook contains no sheets.');
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: true
      });

      if (!rawRows || rawRows.length === 0) {
        setUploadError('The uploaded Excel sheet contains no data rows.');
        return;
      }

      const parsed: ParsedFactRow[] = [];

      rawRows.forEach((row, index) => {
        const rowNumber = index + 2; // Row 1 is header in Excel
        const errors: string[] = [];
        const warnings: string[] = [];

        // Flexible key matching
        const rowEntries = Object.entries(row);
        let dateVal = '';
        let titleVal = '';
        let subtitleVal = '';
        let contentVal = '';

        for (const [key, value] of rowEntries) {
          const cleanKey = key.trim().toLowerCase();
          const strVal = String(value ?? '').trim();
          if (!strVal) continue;

          if (/^(date|astronomy_?date|milestone_?date|calendar_?date|day)/i.test(cleanKey)) {
            dateVal = value;
          } else if (/^(content|text|fact_?body|fact_?content|description|story|body|paragraph|detail|details|definition|meaning|explanation)/i.test(cleanKey)) {
            contentVal = strVal;
          } else if (/^(title|topic|topics|category|categories|theme|themes|heading|headline|subject|subjects|name|type|fact_?title|fact_?topic|topic_?name|category_?name|tag|tags|term|terms|word|words|terminology|terminologies)/i.test(cleanKey)) {
            titleVal = strVal;
          } else if (/^(subtitle|event_?heading|sub_?title|event_?title|event|subtopic|sub_?topic)/i.test(cleanKey)) {
            subtitleVal = strVal;
          }
        }

        // Smart column fallback for Space Facts and Terminologies (2-column files):
        // Automatically maps the 2 columns if headers differ from standard names
        if (!isAstronomy) {
          const nonDateCols = rowEntries.filter(([k, v]) => !/^(date|day)/i.test(k.trim()) && String(v ?? '').trim() !== '');
          if (!contentVal || !titleVal) {
            if (nonDateCols.length === 2) {
              const val0 = String(nonDateCols[0][1] ?? '').trim();
              const val1 = String(nonDateCols[1][1] ?? '').trim();
              // Whichever column has longer text is content/definition; the other is title/term
              if (val0.length > val1.length) {
                if (!contentVal) contentVal = val0;
                if (!titleVal) titleVal = val1;
              } else {
                if (!contentVal) contentVal = val1;
                if (!titleVal) titleVal = val0;
              }
            } else if (nonDateCols.length > 0) {
              if (contentVal && !titleVal) {
                const other = nonDateCols.find(([, v]) => String(v ?? '').trim() !== contentVal);
                if (other) titleVal = String(other[1] ?? '').trim();
              }
              if (titleVal && !contentVal) {
                const other = nonDateCols.find(([, v]) => String(v ?? '').trim() !== titleVal);
                if (other) contentVal = String(other[1] ?? '').trim();
              }
            }
          }
        }

        // Normalize date (only required for astronomy)
        let normalizedDate = '';
        if (isAstronomy) {
          normalizedDate = normalizeExcelDate(dateVal);
          if (!normalizedDate) {
            errors.push('Missing calendar/milestone date');
          }
        }

        // Content
        if (!contentVal) {
          errors.push(isTerminology ? 'Missing definition/explanation' : 'Missing fact content');
        }

        // Title & Subtitle Mapping
        let finalTitle = '';
        let finalSubtitle: string | undefined = undefined;

        if (isAstronomy) {
          // "This Day in Astronomy" is constant for all astronomy facts
          finalTitle = 'This Day in Astronomy';

          // Map the user's Title or Subtitle column to subtitle (the event headline)
          if (titleVal && !/^this\s*day\s*in\s*astronomy$/i.test(titleVal)) {
            finalSubtitle = titleVal;
          } else if (subtitleVal) {
            finalSubtitle = subtitleVal;
          }
        } else if (isTerminology) {
          // For Space Terminology: Use the Term as title, Category as subtitle (empty if none provided)
          finalTitle = titleVal || subtitleVal || 'New Term';
          finalSubtitle = subtitleVal ? subtitleVal : '';
        } else {
          // For Space Fact: Use the exact title/topic from this individual row!
          finalTitle = titleVal || subtitleVal || 'Space Fact';
          finalSubtitle = finalTitle;
        }

        const isValid = errors.length === 0;

        parsed.push({
          rowNumber,
          rawDate: dateVal,
          normalizedDate,
          title: finalTitle,
          subtitle: finalSubtitle,
          content: formatContentToHtml(contentVal),
          isValid,
          errors,
          warnings
        });
      });

      setParsedRows(parsed);
      setUploadError(null);
    } catch (err: any) {
      console.error('Error parsing Excel file:', err);
      setUploadError('Failed to parse Excel file: ' + (err.message || 'Corrupted or unsupported format.'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    handleFileSelect(selected);
  };

  const handleFileSelect = (selected: File) => {
    setFile(selected);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        processWorkbook(workbook);
      } catch (err: any) {
        setUploadError('Error reading file: ' + err.message);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read the file.');
    };
    reader.readAsArrayBuffer(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  /* =========================================================================
     Download Sample Excel Template (.xlsx) for this specific module
     ========================================================================= */

  const downloadSampleTemplate = () => {
    const wb = XLSX.utils.book_new();

    let sampleData: any[] = [];

    if (isAstronomy) {
      sampleData = [
        {
          Date: 'September 24, 2014',
          Title: 'Mars Orbiter Mission (Mangalyaan)',
          Content: "On September 24, 2014, ISRO's Mars Orbiter Mission (Mangalyaan) successfully entered orbit around Mars after a journey of about 298 days. India became the first Asian nation to reach Mars orbit."
        },
        {
          Date: 'September 25, 2024',
          Title: 'Voyager 1 Earth-Moon Historic Image',
          Content: 'On this day in 1977, Voyager 1 captured the iconic Earth-Moon portrait in a single frame from deep space.'
        },
        {
          Date: 'September 26, 2024',
          Title: 'Record Space Endurance Mission',
          Content: 'Cosmonaut Valery Polyakov completed a historic mission demonstrating long-duration human spaceflight resilience.'
        }
      ];
    } else if (isTerminology) {
      sampleData = [
        {
          Term: 'Gravitational Lensing',
          Category: 'Astrophysics & Relativity',
          Definition: 'Gravitational lensing occurs when a massive celestial object — such as a galaxy cluster or supermassive black hole — warps the fabric of spacetime, bending and magnifying the light of distant background galaxies like a cosmic telescope.'
        },
        {
          Term: 'Event Horizon',
          Category: 'Black Holes',
          Definition: 'The boundary defining the region of space around a black hole beyond which nothing, not even light, can escape the gravitational pull.'
        },
        {
          Term: 'Cosmic Microwave Background',
          Category: 'Cosmology',
          Definition: 'The faint cosmic background radiation leftover from the Big Bang that uniformly permeates all observable space, providing a snapshot of the universe 380,000 years after its birth.'
        },
        {
          Term: 'Spaghettification',
          Category: 'Black Holes & Singularities',
          Definition: 'The vertical stretching and horizontal compression of an object into long thin shapes in a very strong non-homogeneous gravitational field.'
        }
      ];
    } else {
      sampleData = [
        {
          Title: 'You & the Cosmos',
          Content: 'Your cupped hands, at this very moment, contain roughly 40,000 photons left over from the Big Bang - the cosmic microwave background fills every cubic centimeter of the universe with about 400 of them.'
        },
        {
          Title: 'The Scale of Everything',
          Content: 'If the Sun were hollow, about 1.3 million Earths could fit inside it - yet lined up side by side, only 109 Earths would span its diameter.'
        },
        {
          Title: 'Solar System & Planets',
          Content: 'A day on Venus is longer than a year on Venus: it takes 243 Earth days to rotate once on its axis, but only 225 Earth days to orbit the Sun.'
        },
        {
          Title: 'Black Holes & Singularities',
          Content: 'At the event horizon of a supermassive black hole, gravitational tidal forces can be gentle enough that you could cross it without being immediately spaghettified.'
        },
        {
          Title: 'Deep Space & Galaxies',
          Content: 'The Andromeda Galaxy is hurtling toward our Milky Way at roughly 110 kilometers per second; in about 4.5 billion years, both will merge into a single giant elliptical galaxy.'
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = isAstronomy
      ? [
        { wch: 22 }, // Date
        { wch: 34 }, // Title
        { wch: 80 }  // Content
      ]
      : isTerminology
      ? [
        { wch: 28 }, // Term
        { wch: 28 }, // Category
        { wch: 90 }  // Definition
      ]
      : [
        { wch: 30 }, // Title (Topic)
        { wch: 85 }  // Content
      ];

    const sheetName = isAstronomy
      ? 'Astronomy_Milestones'
      : isTerminology
      ? 'Space_Terminologies'
      : 'Space_Facts';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filename = isAstronomy
      ? 'Zwosmos_This_Day_in_Astronomy_Template.xlsx'
      : isTerminology
      ? 'Zwosmos_Space_Terminologies_Template.xlsx'
      : 'Zwosmos_Space_Fact_of_the_Day_Template.xlsx';

    XLSX.writeFile(wb, filename);
  };

  /* =========================================================================
     Batch Save Handler
     ========================================================================= */

  const handleConfirmUpload = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows found to upload. Please check errors in the table.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = validRows.map(row => ({
        type: entryType, // Strictly the active module type
        title: row.title,
        subtitle: row.subtitle,
        astronomyDate: row.normalizedDate,
        content: row.content,
        status: 'draft' as CosmicEntryStatus // Auto-rolls over at 12:00 AM IST on date!
      }));

      const res = await onBatchSave(payload, conflictAction);

      if (res.success) {
        onSuccess(res.count, res.updatedCount, res.insertedCount);
        onClose();
      } else {
        alert('Failed to complete bulk upload: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Batch upload error:', err);
      alert('An error occurred during bulk upload: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '880px',
          maxHeight: '90vh',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
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
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#ffcc00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
                boxShadow: '0 2px 8px rgba(255, 204, 0, 0.4)'
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                Bulk Upload: {moduleLabel}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                {isAstronomy
                  ? 'Batch upload upcoming astronomy milestones. Auto-rolls over at 12:00 AM IST on the assigned date.'
                  : 'Batch upload space facts (Title & Content). Cycles at 12:00 AM IST with non-consecutive topic shuffle and zero dates needed.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Destination Badge + Download Template Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              background: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                Uploading to:
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#ffcc00',
                  color: '#0f172a'
                }}
              >
                {moduleLabel}
              </span>
            </div>

            {/* Template Download Button */}
            <button
              type="button"
              onClick={downloadSampleTemplate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)'
              }}
            >
              <Download size={14} />
              <span>Download Excel Template (.xlsx)</span>
            </button>
          </div>

          {/* Quick Format & Fields Help Card */}
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
              onClick={() => setShowGuide(!showGuide)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} color="#2563eb" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af' }}>
                  {isAstronomy
                    ? 'Excel Format: 3 Columns (Date, Title, Content)'
                    : 'Excel Format: 2 Columns (Title, Content) - No Dates Needed'}
                </span>
                <span style={{ fontSize: '11px', color: '#3b82f6', background: '#dbeafe', padding: '2px 8px', borderRadius: '10px' }}>
                  {showGuide ? 'Hide details' : 'Click to see accepted fields'}
                </span>
              </div>
            </div>

            {showGuide && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#1e3a8a', lineHeight: 1.6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isAstronomy ? '120px 90px 1fr' : '140px 90px 1fr', gap: '8px', padding: '6px 0', borderBottom: '1px solid #dbeafe', fontWeight: 700 }}>
                  <span>Column Name</span>
                  <span>Required?</span>
                  <span>Description</span>
                </div>

                {isAstronomy && (
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 90px 1fr', gap: '8px', padding: '6px 0', borderBottom: '1px solid #dbeafe' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>Date</span>
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>Required</span>
                    <span>
                      Calendar date for 12:00 AM IST auto-rollover (e.g. <strong>September 25, 2024</strong>, <strong>September 25</strong>, or Excel dates).
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: isAstronomy ? '120px 90px 1fr' : '140px 90px 1fr', gap: '8px', padding: '6px 0', borderBottom: '1px solid #dbeafe' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>Title</span>
                  <span style={{ color: isAstronomy ? '#64748b' : '#dc2626', fontWeight: isAstronomy ? 400 : 700 }}>
                    {isAstronomy ? 'Optional' : 'Required'}
                  </span>
                  <span>
                    {isAstronomy
                      ? 'Specific event headline (e.g. Mars Orbiter Mission). Mapped to subtitle below "This Day in Astronomy".'
                      : 'Topic / category name (e.g. "You & the Cosmos", "The Scale of Everything"). Displays as the subtitle below "Space Fact of the Day".'}
                  </span>
                </div>

                {isAstronomy && (
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 90px 1fr', gap: '8px', padding: '6px 0', borderBottom: '1px solid #dbeafe' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>Subtitle</span>
                    <span style={{ color: '#64748b' }}>Optional</span>
                    <span>
                      Alternative column name for the event headline.
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: isAstronomy ? '120px 90px 1fr' : '140px 90px 1fr', gap: '8px', padding: '6px 0' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>Content</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>Required</span>
                  <span>
                    The body story or fact paragraph. Plain text is automatically formatted into clean paragraphs.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Smart Multi-Topic Mapping Banner for Space Facts */}
          {!isAstronomy && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#f5f3ff',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid #ddd6fe'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7c3aed',
                  flexShrink: 0
                }}
              >
                <Layers size={18} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#5b21b6', display: 'block' }}>
                  All-in-One Multi-Topic Import
                </span>
                <span style={{ fontSize: '12px', color: '#6d28d9', lineHeight: 1.45 }}>
                  Upload all 365 facts together in a single Excel file. Each row automatically uses its own individual Title/Topic from your sheet (e.g. across your 10–15 categories).
                </span>
              </div>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging ? '2px dashed #ffcc00' : '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '28px 20px',
              textAlign: 'center',
              background: isDragging ? '#fffbeb' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
            />

            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: '#64748b'
              }}
            >
              <Upload size={22} />
            </div>

            {file ? (
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                  {file.name}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  {(file.size / 1024).toFixed(1)} KB • Click or drag to replace file
                </p>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                  Click to browse or drag and drop your Excel file here
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Supports Microsoft Excel (.xlsx, .xls) and CSV
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {uploadError && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Conflict Resolution Selector (shown when matching existing entries detected) */}
          {parsedRows.length > 0 && matchingCount > 0 && (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
                  {isAstronomy
                    ? `Existing Dates Detected (${matchingCount} overlapping ${matchingCount === 1 ? 'date' : 'dates'})`
                    : `Existing Facts Detected (${matchingCount} matching ${matchingCount === 1 ? 'fact' : 'facts'})`}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#78350f', lineHeight: 1.5 }}>
                {matchingCount} of the {validCount} entries in your Excel match {isAstronomy ? 'calendar dates' : 'fact contents'} already stored in your system. How would you like to handle them?
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: '10px'
                }}
              >
                {/* Option 1: Update Existing Data (Recommended) */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: conflictAction === 'update' ? '#ffffff' : '#fef3c7',
                    border: `1.5px solid ${conflictAction === 'update' ? '#d97706' : '#fde68a'}`,
                    cursor: 'pointer',
                    boxShadow: conflictAction === 'update' ? '0 2px 6px rgba(217, 119, 6, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="conflictAction"
                    value="update"
                    checked={conflictAction === 'update'}
                    onChange={() => setConflictAction('update')}
                    style={{ marginTop: '3px', accentColor: '#d97706' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RefreshCw size={13} />
                      <span>Update existing data (Recommended)</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px', lineHeight: 1.4 }}>
                      {isAstronomy
                        ? 'Overwrites facts for existing dates with the new Excel content without creating duplicate rows.'
                        : 'Updates matching existing facts with the new Excel content without creating duplicate rows.'}
                    </div>
                  </div>
                </label>

                {/* Option 2: Skip Existing */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: conflictAction === 'skip' ? '#ffffff' : '#fef3c7',
                    border: `1.5px solid ${conflictAction === 'skip' ? '#d97706' : '#fde68a'}`,
                    cursor: 'pointer',
                    boxShadow: conflictAction === 'skip' ? '0 2px 6px rgba(217, 119, 6, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="conflictAction"
                    value="skip"
                    checked={conflictAction === 'skip'}
                    onChange={() => setConflictAction('skip')}
                    style={{ marginTop: '3px', accentColor: '#d97706' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <SkipForward size={13} />
                      <span>Skip existing entries</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px', lineHeight: 1.4 }}>
                      Only imports the {newCount} new entries, leaving all {matchingCount} existing entries untouched.
                    </div>
                  </div>
                </label>

                {/* Option 3: Add as Duplicates */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: conflictAction === 'duplicate' ? '#ffffff' : '#fef3c7',
                    border: `1.5px solid ${conflictAction === 'duplicate' ? '#d97706' : '#fde68a'}`,
                    cursor: 'pointer',
                    boxShadow: conflictAction === 'duplicate' ? '0 2px 6px rgba(217, 119, 6, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="conflictAction"
                    value="duplicate"
                    checked={conflictAction === 'duplicate'}
                    onChange={() => setConflictAction('duplicate')}
                    style={{ marginTop: '3px', accentColor: '#d97706' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CopyPlus size={13} />
                      <span>Add as duplicates</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px', lineHeight: 1.4 }}>
                      Adds all {validCount} rows regardless.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Summary Stats Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    Total Rows: {parsedRows.length}
                  </span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>
                    ✓ {validCount} Valid
                  </span>
                  {matchingCount > 0 && (
                    <span style={{ color: '#d97706', fontWeight: 600 }}>
                      ⚡ {matchingCount} existing entries ({conflictAction === 'update' ? 'will update' : conflictAction === 'skip' ? 'will skip' : 'will duplicate'})
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>
                      ⚠ {invalidCount} Invalid (will be skipped)
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {isAstronomy ? 'Auto-rolls over at 12:00 AM IST on date' : 'Auto-rolls over at 12:00 AM IST'}
                </span>
              </div>

              {/* Scrollable Table */}
              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600, width: '40px' }}>#</th>
                      {isAstronomy && (
                        <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600, width: '170px' }}>Rollover Date</th>
                      )}
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600, width: isAstronomy ? '200px' : '220px' }}>
                        {isAstronomy ? 'Title & Subtitle' : 'Topic / Title'}
                      </th>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600 }}>Content Snippet</th>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600, width: '100px' }}>Action / Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => {
                      let isExisting = false;
                      if (isAstronomy) {
                        const p = parseMilestoneDateForRollover(row.normalizedDate);
                        const key = p ? `${p.month}_${p.day}` : null;
                        isExisting = Boolean(key && existingMatchesMap.has(key));
                      } else {
                        const cleanContent = row.content.replace(/<[^>]*>?/gm, '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
                        isExisting = Boolean(cleanContent && existingMatchesMap.has(cleanContent));
                      }

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: !row.isValid
                              ? '#fef2f2'
                              : isExisting && conflictAction === 'skip'
                                ? '#f8fafc'
                                : isExisting && conflictAction === 'update'
                                  ? '#f0fdf4'
                                  : '#ffffff'
                          }}
                        >
                          <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 500 }}>
                            {row.rowNumber}
                          </td>
                          {isAstronomy && (
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Calendar size={13} color="#ffcc00" />
                                <span>{row.normalizedDate || <em style={{ color: '#ef4444' }}>Missing</em>}</span>
                              </div>
                            </td>
                          )}
                          <td
                            style={{
                              padding: '8px 10px',
                              fontWeight: 500,
                              color: '#334155',
                              maxWidth: isAstronomy ? '200px' : '220px',
                              overflow: 'hidden'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={row.title}>
                              {row.title}
                            </div>
                            {isAstronomy && row.subtitle && (
                              <div style={{ fontSize: '11px', color: '#7c3aed', fontStyle: 'italic', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={row.subtitle}>
                                {row.subtitle}
                              </div>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '8px 10px',
                              color: '#64748b',
                              maxWidth: '260px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={row.content.replace(/<[^>]*>?/gm, '')}
                          >
                            {row.content.replace(/<[^>]*>?/gm, '')}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {!row.isValid ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#ef4444', fontWeight: 600 }} title={row.errors.join(', ')}>
                                <AlertCircle size={13} />
                                <span>Invalid</span>
                              </span>
                            ) : isExisting ? (
                              conflictAction === 'update' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#16a34a', fontWeight: 600, fontSize: '11px', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                                  <RefreshCw size={11} />
                                  <span>Update</span>
                                </span>
                              ) : conflictAction === 'skip' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#64748b', fontWeight: 600, fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                                  <SkipForward size={11} />
                                  <span>Skip</span>
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#b45309', fontWeight: 600, fontSize: '11px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                                  <CopyPlus size={11} />
                                  <span>Duplicate</span>
                                </span>
                              )
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#10b981', fontWeight: 600, fontSize: '11px', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                                <CheckCircle2 size={13} />
                                <span>New</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {validCount > 0 ? (
              matchingCount > 0 ? (
                conflictAction === 'update' ? (
                  <span>
                    Will update <strong>{matchingCount}</strong> existing {isAstronomy ? (matchingCount === 1 ? 'date' : 'dates') : (matchingCount === 1 ? 'fact' : 'facts')} and add <strong>{newCount}</strong> new {newCount === 1 ? 'entry' : 'entries'} (zero duplicates).
                  </span>
                ) : conflictAction === 'skip' ? (
                  <span>
                    Will skip <strong>{matchingCount}</strong> existing entries and only add <strong>{newCount}</strong> new entries.
                  </span>
                ) : (
                  <span>
                    Will add all <strong>{validCount}</strong> entries, creating duplicates for {matchingCount} existing entries.
                  </span>
                )
              ) : (
                `Ready to import ${validCount} entries into ${moduleLabel}.`
              )
            ) : (
              `Please upload an Excel file for ${moduleLabel}.`
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
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
              onClick={handleConfirmUpload}
              disabled={validCount === 0 || isSaving || (conflictAction === 'skip' && newCount === 0)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '9px 22px',
                borderRadius: '8px',
                border: 'none',
                background:
                  validCount === 0 || isSaving || (conflictAction === 'skip' && newCount === 0)
                    ? '#cbd5e1'
                    : '#ffcc00',
                color:
                  validCount === 0 || isSaving || (conflictAction === 'skip' && newCount === 0)
                    ? '#94a3b8'
                    : '#0f172a',
                fontSize: '13px',
                fontWeight: 700,
                cursor:
                  validCount === 0 || isSaving || (conflictAction === 'skip' && newCount === 0)
                    ? 'not-allowed'
                    : 'pointer',
                boxShadow:
                  validCount > 0 && !isSaving && !(conflictAction === 'skip' && newCount === 0)
                    ? '0 2px 8px rgba(255, 204, 0, 0.4)'
                    : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>
                {isSaving
                  ? 'Importing...'
                  : validCount > 0
                    ? matchingCount > 0
                      ? conflictAction === 'update'
                        ? `Update & Import (${matchingCount} updated, ${newCount} new)`
                        : conflictAction === 'skip'
                          ? newCount > 0
                            ? `Import ${newCount} New Entries (${matchingCount} skipped)`
                            : 'No New Entries to Import'
                          : `Import All ${validCount} Entries`
                      : `Import ${validCount} Entries`
                    : 'Import Entries'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
