import { useState, useEffect } from 'react';
import { Pencil, Check, Lock, Save, Sparkles, Calendar, Eye, CheckCircle2, FileText } from 'lucide-react';
import { getCosmicData, updateCosmicData, DailyCosmicData, DEFAULT_COSMIC_DATA } from '../lib/cosmicService';
import TiptapEditor from './TiptapEditor';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

function parseDateParts(dateStr: string) {
  if (!dateStr) return { month: '', day: '', year: '' };
  
  // Format: "Month Day, Year" or "Month Day Year"
  const m1 = dateStr.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})?$/);
  if (m1) {
    return { month: m1[1] || '', day: m1[2] || '', year: m1[3] || '' };
  }
  // Format: "Day Month Year"
  const m2 = dateStr.trim().match(/^(\d{1,2})\s+([A-Za-z]+),?\s*(\d{4})?$/);
  if (m2) {
    return { month: m2[2] || '', day: m2[1] || '', year: m2[3] || '' };
  }
  // Generic search
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

export default function FactsManager() {
  const [activeSubTab, setActiveSubTab] = useState<'astronomy' | 'fact' | 'preview'>('astronomy');
  const [data, setData] = useState<DailyCosmicData>(DEFAULT_COSMIC_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit lock toggles for titles
  const [isEditingAstronomyTitle, setIsEditingAstronomyTitle] = useState(false);
  const [isEditingFactTitle, setIsEditingFactTitle] = useState(false);

  // Date parts: Month (dropdown only), Day (dropdown only), Year (type only)
  const [monthPart, setMonthPart] = useState('');
  const [dayPart, setDayPart] = useState('');
  const [yearPart, setYearPart] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const cosmic = await getCosmicData();
      setData(cosmic);
      
      // Parse date parts
      const parsed = parseDateParts(cosmic.astronomyDate);
      setMonthPart(parsed.month);
      setDayPart(parsed.day);
      setYearPart(parsed.year);
    } catch (err) {
      console.error('Failed to load cosmic data:', err);
    } finally {
      setLoading(false);
    }
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

    const combined = parts.join(' ');
    setData(prev => ({ ...prev, astronomyDate: combined }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await updateCosmicData(data);
      if (res.success && res.data) {
        setData(res.data);
        setSaveSuccess(true);
        setIsEditingAstronomyTitle(false);
        setIsEditingFactTitle(false);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert('Failed to save changes: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error saving cosmic facts: ' + err.message);
    } finally {
      setSaving(false);
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
      {/* Top Banner / Notification */}
      {saveSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            color: '#065f46',
            fontSize: '14px',
            fontWeight: 500,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>Cosmic modules saved successfully! Changes are live on the homepage.</span>
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
            <Sparkles size={15} />
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

        {/* Global Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffcc00',
            color: '#0f172a',
            border: 'none',
            padding: '10px 20px',
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
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: THIS DAY IN ASTRONOMY                                        */}
      {/* =================================================================== */}
      {activeSubTab === 'astronomy' && (
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
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 600, color: '#0f172a' }}>
              This Day in Astronomy (Left Card)
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Configure the historical milestone displayed on the left card of the homepage.
            </p>
          </div>

          {/* Title Field with Lock & Edit Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Module Title
              </label>
              <button
                type="button"
                onClick={() => setIsEditingAstronomyTitle(!isEditingAstronomyTitle)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: isEditingAstronomyTitle ? '1px solid #10b981' : '1px solid #cbd5e1',
                  background: isEditingAstronomyTitle ? '#ecfdf5' : '#f8fafc',
                  color: isEditingAstronomyTitle ? '#047857' : '#334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {isEditingAstronomyTitle ? (
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
                value={data.astronomyTitle}
                readOnly={!isEditingAstronomyTitle}
                onChange={(e) => setData({ ...data, astronomyTitle: e.target.value })}
                placeholder="This Day in Astronomy"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  paddingRight: !isEditingAstronomyTitle ? '36px' : '14px',
                  borderRadius: '8px',
                  border: isEditingAstronomyTitle ? '1.5px solid #ffcc00' : '1px solid #e2e8f0',
                  background: isEditingAstronomyTitle ? '#ffffff' : '#f8fafc',
                  color: '#0f172a',
                  fontSize: '14px',
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: isEditingAstronomyTitle ? 'text' : 'default',
                  transition: 'all 0.15s ease'
                }}
              />
              {!isEditingAstronomyTitle && (
                <Lock
                  size={15}
                  color="#94a3b8"
                  style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }}
                />
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {isEditingAstronomyTitle
                ? 'Title unlocked: edit text and click "Done Editing" when finished.'
                : 'Title is locked by default. Click "Edit Title" to modify it.'}
            </span>
          </div>

          {/* Date: Month Dropdown, Day Dropdown, Year Type Input (Compact Small Width) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Astronomy Date
            </label>

            {/* Compact row - NOT full width */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '12px',
                maxWidth: '430px',
                flexWrap: 'wrap'
              }}
            >
              {/* Month: Dropdown Only */}
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

              {/* Day: Dropdown Only */}
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

              {/* Year: Type Only */}
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

            {/* Date Output Badge */}
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
                {data.astronomyDate || 'Please select month, day & type year'}
              </strong>
            </div>
          </div>

          {/* Rich Text Editor with Dashboard Theme Toolbar (NO black background) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="#334155" />
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Content Area (Rich Text Editor)
              </label>
            </div>
            <TiptapEditor
              value={data.astronomyContent}
              onChange={(newHtml) => setData({ ...data, astronomyContent: newHtml })}
              minHeight="180px"
            />
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Format text with bold, italics, links, alignments, and lists.
            </span>
          </div>

          {/* Bottom Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '6px' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffcc00',
                color: '#0f172a',
                border: 'none',
                padding: '12px 24px',
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
              <span>{saving ? 'Saving...' : 'Save This Day in Astronomy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: SPACE FACT OF THE DAY                                        */}
      {/* =================================================================== */}
      {activeSubTab === 'fact' && (
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
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 600, color: '#0f172a' }}>
              Space Fact of the Day (Right Card)
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Configure the daily astrophysics fact displayed on the right of the homepage.
            </p>
          </div>

          {/* Title Field with Lock & Edit Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Module Title
              </label>
              <button
                type="button"
                onClick={() => setIsEditingFactTitle(!isEditingFactTitle)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: isEditingFactTitle ? '1px solid #10b981' : '1px solid #cbd5e1',
                  background: isEditingFactTitle ? '#ecfdf5' : '#f8fafc',
                  color: isEditingFactTitle ? '#047857' : '#334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {isEditingFactTitle ? (
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
                value={data.factTitle}
                readOnly={!isEditingFactTitle}
                onChange={(e) => setData({ ...data, factTitle: e.target.value })}
                placeholder="SPACE FACT OF THE DAY"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  paddingRight: !isEditingFactTitle ? '36px' : '14px',
                  borderRadius: '8px',
                  border: isEditingFactTitle ? '1.5px solid #ffcc00' : '1px solid #e2e8f0',
                  background: isEditingFactTitle ? '#ffffff' : '#f8fafc',
                  color: '#0f172a',
                  fontSize: '14px',
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: isEditingFactTitle ? 'text' : 'default',
                  transition: 'all 0.15s ease'
                }}
              />
              {!isEditingFactTitle && (
                <Lock
                  size={15}
                  color="#94a3b8"
                  style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }}
                />
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {isEditingFactTitle
                ? 'Title unlocked: edit text and click "Done Editing" when finished.'
                : 'Title is locked by default. Click "Edit Title" to modify it.'}
            </span>
          </div>

          {/* Rich Text Editor for Fact Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="#334155" />
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Fact Content Area (Rich Text Editor)
              </label>
            </div>
            <TiptapEditor
              value={data.factContent}
              onChange={(newHtml) => setData({ ...data, factContent: newHtml })}
              minHeight="180px"
            />
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Format space fact text with bold highlights, links, and paragraph styling.
            </span>
          </div>

          {/* Bottom Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '6px' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffcc00',
                color: '#0f172a',
                border: 'none',
                padding: '12px 24px',
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
              <span>{saving ? 'Save Space Fact' : 'Save Space Fact'}</span>
            </button>
          </div>
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
                Accurate visual preview of how both cards appear on the homepage against the space background.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffcc00',
                color: '#0f172a',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                boxShadow: '0 2px 8px rgba(255, 204, 0, 0.35)'
              }}
            >
              <Save size={15} />
              <span>{saving ? 'Saving...' : 'Publish to Homepage'}</span>
            </button>
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
              {/* Left Card: This Day in Astronomy (Normal Border with Sidebar Tabs) */}
              <div
                style={{
                  position: 'relative',
                  marginLeft: '24px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Main Card with Normal Border */}
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
                      {data.astronomyDate}
                    </div>

                    {/* Calendar Icon */}
                    <div
                      title={data.astronomyDate}
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
                    {data.astronomyTitle}
                  </h3>

                  <div
                    className="zw-cosmic-rich-content"
                    style={{
                      fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
                      fontSynthesis: 'weight style',
                      fontSize: '0.95rem',
                      lineHeight: 1.68,
                      color: '#cbd5e1',
                      maxHeight: '135px',
                      overflowY: 'auto',
                      paddingRight: '6px'
                    }}
                    dangerouslySetInnerHTML={{ __html: data.astronomyContent }}
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
                  {data.factTitle}
                </h3>

                <div
                  className="zw-cosmic-rich-content"
                  style={{
                    fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
                    fontSynthesis: 'weight style',
                    fontSize: '0.95rem',
                    lineHeight: 1.68,
                    color: '#cbd5e1',
                    maxHeight: '135px',
                    overflowY: 'auto',
                    paddingRight: '6px'
                  }}
                  dangerouslySetInnerHTML={{ __html: data.factContent }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
