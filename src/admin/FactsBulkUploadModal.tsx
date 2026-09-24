import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CosmicEntryType, CosmicEntryStatus } from '../lib/cosmicService';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface ParsedFactRow {
  rowNumber: number;
  rawDate: any;
  normalizedDate: string;
  title: string;
  content: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface FactsBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryType: CosmicEntryType; // Strictly 'astronomy' or 'fact' based on active tab
  onSuccess: (count: number) => void;
  onBatchSave: (
    entries: Array<{
      type: CosmicEntryType;
      title: string;
      astronomyDate?: string;
      content: string;
      status?: CosmicEntryStatus;
    }>
  ) => Promise<{ success: boolean; count: number; error?: string }>;
}

export default function FactsBulkUploadModal({
  isOpen,
  onClose,
  entryType,
  onSuccess,
  onBatchSave
}: FactsBulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedFactRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isAstronomy = entryType === 'astronomy';
  const moduleLabel = isAstronomy ? 'This Day in Astronomy' : 'Space Fact of the Day';

  // Reset when opened
  React.useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParsedRows([]);
      setUploadError(null);
      setIsSaving(false);
      setShowGuide(false);
    }
  }, [isOpen, entryType]);

  if (!isOpen) return null;

  /* =========================================================================
     Date Normalization Helpers
     ========================================================================= */

  function normalizeExcelDate(val: any): string {
    if (!val) return '';

    // Date object
    if (val instanceof Date && !isNaN(val.getTime())) {
      const m = MONTHS[val.getUTCMonth()];
      const d = val.getUTCDate();
      const y = val.getUTCFullYear();
      return `${m} ${d}${y ? `, ${y}` : ''}`;
    }

    // Number (Excel serial date number, e.g. 45560)
    if (typeof val === 'number') {
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
        let dateVal = '';
        let titleVal = '';
        let contentVal = '';

        for (const [key, value] of Object.entries(row)) {
          const cleanKey = key.trim().toLowerCase();
          if (/^(date|astronomy_?date|milestone_?date|calendar_?date|day)/i.test(cleanKey)) {
            dateVal = value;
          } else if (/^(title|headline|fact_?title|milestone_?title|name)/i.test(cleanKey)) {
            titleVal = String(value || '').trim();
          } else if (/^(content|text|fact|description|story|body)/i.test(cleanKey)) {
            contentVal = String(value || '').trim();
          }
        }

        // Normalize date
        const normalizedDate = normalizeExcelDate(dateVal);
        if (!normalizedDate) {
          errors.push('Missing calendar/milestone date');
        }

        // Content
        if (!contentVal) {
          errors.push('Missing fact content');
        }

        // Title defaults
        let finalTitle = titleVal;
        if (!finalTitle) {
          finalTitle = isAstronomy ? 'This Day in Astronomy' : 'SPACE FACT OF THE DAY';
          warnings.push(`Default title "${finalTitle}" applied`);
        }

        const isValid = errors.length === 0;

        parsed.push({
          rowNumber,
          rawDate: dateVal,
          normalizedDate,
          title: finalTitle,
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
          Date: 'September 25, 2024',
          Title: 'This Day in Astronomy',
          Content: 'On this day in 1977, Voyager 1 captured the iconic Earth-Moon portrait in a single frame from deep space.'
        },
        {
          Date: 'September 26, 2024',
          Title: 'This Day in Astronomy',
          Content: 'Cosmonaut Valery Polyakov completed a historic mission demonstrating long-duration human spaceflight resilience.'
        },
        {
          Date: 'September 27, 2024',
          Title: 'This Day in Astronomy',
          Content: 'The SMART-1 spacecraft completed revolutionary solar-electric propulsion maneuvers on its journey to the Moon.'
        }
      ];
    } else {
      sampleData = [
        {
          Date: 'September 25',
          Title: 'SPACE FACT OF THE DAY',
          Content: 'If two pieces of the same type of metal touch in the vacuum of space, they bond permanently via cold welding.'
        },
        {
          Date: 'September 26',
          Title: 'SPACE FACT OF THE DAY',
          Content: 'A single day on Venus is longer than a Venusian year, lasting 243 Earth days to complete one slow retrograde rotation.'
        },
        {
          Date: 'September 27',
          Title: 'SPACE FACT OF THE DAY',
          Content: 'Neutron stars spin up to 600 times per second and are so dense that a teaspoon of their matter would weigh 6 billion tons on Earth.'
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 22 }, // Date
      { wch: 26 }, // Title
      { wch: 80 }  // Content
    ];

    const sheetName = isAstronomy ? 'Astronomy_Milestones' : 'Space_Facts';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filename = isAstronomy
      ? 'Zwosmos_This_Day_in_Astronomy_Template.xlsx'
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
        astronomyDate: row.normalizedDate,
        content: row.content,
        status: 'draft' as CosmicEntryStatus // Auto-rolls over at 12:00 AM IST on date!
      }));

      const res = await onBatchSave(payload);

      if (res.success) {
        onSuccess(res.count);
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
                  : 'Batch upload upcoming space facts. Auto-rolls over at 12:00 AM IST on the assigned date.'}
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
                  Excel Format: Only 3 Columns Needed (Date, Title, Content)
                </span>
                <span style={{ fontSize: '11px', color: '#3b82f6', background: '#dbeafe', padding: '2px 8px', borderRadius: '10px' }}>
                  {showGuide ? 'Hide details' : 'Click to see accepted fields'}
                </span>
              </div>
            </div>

            {showGuide && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#1e3a8a', lineHeight: 1.6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 90px 1fr', gap: '8px', padding: '6px 0', borderBottom: '1px solid #dbeafe', fontWeight: 700 }}>
                  <span>Column Name</span>
                  <span>Required?</span>
                  <span>Accepted Formats & Description</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 90px 1fr', gap: '8px', padding: '6px 0', borderBottom: '1px solid #dbeafe' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>Date</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>Required</span>
                  <span>
                    Calendar date for 12:00 AM IST auto-rollover. Supports:
                    <strong style={{ marginLeft: '4px' }}>September 25, 2024</strong>, <strong>September 25</strong>, <strong>2024-09-25</strong>, or Excel date cells.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 90px 1fr', gap: '8px', padding: '6px 0', borderBottom: '1px solid #dbeafe' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>Title</span>
                  <span style={{ color: '#64748b' }}>Optional</span>
                  <span>
                    Headline for the card (e.g. <em>{isAstronomy ? 'This Day in Astronomy' : 'SPACE FACT OF THE DAY'}</em>). Defaults automatically if left blank.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 90px 1fr', gap: '8px', padding: '6px 0' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>Content</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>Required</span>
                  <span>
                    The body story or fact paragraph. Plain text is automatically formatted into clean paragraphs.
                  </span>
                </div>
              </div>
            )}
          </div>

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
                    ✓ {validCount} Ready to Import
                  </span>
                  {invalidCount > 0 && (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>
                      ⚠ {invalidCount} Invalid (will be skipped)
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Will auto-promote to live at 12:00 AM IST on their date
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
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600, width: '160px' }}>Rollover Date</th>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600, width: '180px' }}>Title</th>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600 }}>Content Snippet</th>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600, width: '90px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: row.isValid ? '#ffffff' : '#fef2f2'
                        }}
                      >
                        <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 500 }}>
                          {row.rowNumber}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={13} color="#ffcc00" />
                            <span>{row.normalizedDate || <em style={{ color: '#ef4444' }}>Missing</em>}</span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            fontWeight: 500,
                            color: '#334155',
                            maxWidth: '180px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={row.title}
                        >
                          {row.title}
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
                          {row.isValid ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#10b981', fontWeight: 600 }}>
                              <CheckCircle2 size={13} />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#ef4444', fontWeight: 600 }} title={row.errors.join(', ')}>
                              <AlertCircle size={13} />
                              <span>Invalid</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
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
            {validCount > 0
              ? `Ready to import ${validCount} entries into ${moduleLabel}.`
              : `Please upload an Excel file for ${moduleLabel}.`}
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
              disabled={validCount === 0 || isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 22px',
                borderRadius: '8px',
                border: 'none',
                background: validCount === 0 || isSaving ? '#cbd5e1' : '#ffcc00',
                color: validCount === 0 || isSaving ? '#94a3b8' : '#0f172a',
                fontSize: '13px',
                fontWeight: 700,
                cursor: validCount === 0 || isSaving ? 'not-allowed' : 'pointer',
                boxShadow: validCount > 0 && !isSaving ? '0 2px 8px rgba(255, 204, 0, 0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={15} />
              <span>
                {isSaving
                  ? 'Importing...'
                  : validCount > 0
                  ? `Import ${validCount} Entries`
                  : 'Import Entries'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
