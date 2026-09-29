import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Rss,
  Share2,
  Image as ImageIcon,
  Save,
  Check,
  ExternalLink,
  Copy,
  Upload,
  FolderOpen,
  Sparkles,
  X,
  FileCode,
  Type,
  Search
} from 'lucide-react';
import { settingsService, DEFAULT_SITE_SETTINGS, SiteSettings } from '../lib/settingsService';
import { blogClient } from '../lib/blogClient';
import { MediaLibrary } from '@zwantum/blog/admin';
import { pushNotify } from './PushNotification';

export default function SettingsManager() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'seo' | 'og' | 'rss' | 'brand' | 'reading'>('seo');
  const [previewPlatform, setPreviewPlatform] = useState<'twitter' | 'facebook'>('twitter');

  // Media Library & Upload States
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RSS action states
  const [copiedRss, setCopiedRss] = useState(false);

  useEffect(() => {
    let isMounted = true;
    settingsService.getSettings().then(data => {
      if (isMounted) {
        setSettings(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (key: keyof SiteSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings(settings);
      pushNotify('Settings saved successfully! SEO & Open Graph updated.', { type: 'success' });
    } catch (err: any) {
      console.error('Save settings error:', err);
      pushNotify('Failed to save settings: ' + (err.message || 'Unknown error'), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Direct file upload for OG image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storage = blogClient?.storage as any;
      if (storage?.upload) {
        const res = await storage.upload(file, file.name, { folder: 'og-banners' });
        if (res?.url) {
          handleChange('ogImage', res.url);
          pushNotify('Open Graph banner uploaded successfully!', { type: 'success' });
        } else {
          throw new Error('Upload returned no URL');
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          handleChange('ogImage', reader.result as string);
          pushNotify('Open Graph banner loaded from local file!', { type: 'success' });
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('OG image upload failed:', err);
      pushNotify('Image upload failed. You can paste an image URL directly.', { type: 'error' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyRssUrl = () => {
    const fullUrl = `${settings.siteUrl.replace(/\/$/, '')}/rss.xml`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedRss(true);
    setTimeout(() => setCopiedRss(false), 2200);
  };

  const cleanSiteUrl = settings.siteUrl ? settings.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'zwosmos.com';

  if (loading) {
    return (
      <div style={{ padding: '40px', color: '#64748b', fontSize: '14px' }}>
        Loading website settings...
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        boxSizing: 'border-box',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.35rem',
              fontWeight: 600,
              color: '#0f172a',
              margin: '0 0 4px 0',
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
            }}
          >
            Site Settings &amp; SEO
          </h1>
          <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>
            Configure Website SEO meta, Open Graph social share cards, RSS syndication, and brand metadata.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: saving ? '#cbd5e1' : '#ffcc00',
            color: '#0f172a',
            border: 'none',
            padding: '9px 20px',
            borderRadius: '9px',
            fontWeight: 600,
            fontSize: '13.5px',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 3px 10px rgba(255, 204, 0, 0.35)',
            transition: 'all 0.15s ease'
          }}
        >
          {saving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Save size={15} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Subtabs Bar with Yellow Branding */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => setActiveSubTab('seo')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: activeSubTab === 'seo' ? '#ffcc00' : '#ffffff',
            color: activeSubTab === 'seo' ? '#0f172a' : '#64748b',
            border: '1px solid',
            borderColor: activeSubTab === 'seo' ? '#ffcc00' : '#e2e8f0',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: activeSubTab === 'seo' ? 600 : 500,
            cursor: 'pointer',
            boxShadow: activeSubTab === 'seo' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Search size={15} color={activeSubTab === 'seo' ? '#0f172a' : '#64748b'} />
          <span>Website SEO Meta</span>
        </button>

        <button
          onClick={() => setActiveSubTab('og')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: activeSubTab === 'og' ? '#ffcc00' : '#ffffff',
            color: activeSubTab === 'og' ? '#0f172a' : '#64748b',
            border: '1px solid',
            borderColor: activeSubTab === 'og' ? '#ffcc00' : '#e2e8f0',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: activeSubTab === 'og' ? 600 : 500,
            cursor: 'pointer',
            boxShadow: activeSubTab === 'og' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Share2 size={15} color={activeSubTab === 'og' ? '#0f172a' : '#64748b'} />
          <span>Open Graph &amp; Social Share</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rss')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: activeSubTab === 'rss' ? '#ffcc00' : '#ffffff',
            color: activeSubTab === 'rss' ? '#0f172a' : '#64748b',
            border: '1px solid',
            borderColor: activeSubTab === 'rss' ? '#ffcc00' : '#e2e8f0',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: activeSubTab === 'rss' ? 600 : 500,
            cursor: 'pointer',
            boxShadow: activeSubTab === 'rss' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Rss size={15} color={activeSubTab === 'rss' ? '#0f172a' : '#64748b'} />
          <span>RSS Feed Syndication</span>
        </button>

        <button
          onClick={() => setActiveSubTab('brand')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: activeSubTab === 'brand' ? '#ffcc00' : '#ffffff',
            color: activeSubTab === 'brand' ? '#0f172a' : '#64748b',
            border: '1px solid',
            borderColor: activeSubTab === 'brand' ? '#ffcc00' : '#e2e8f0',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: activeSubTab === 'brand' ? 600 : 500,
            cursor: 'pointer',
            boxShadow: activeSubTab === 'brand' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Globe size={15} color={activeSubTab === 'brand' ? '#0f172a' : '#64748b'} />
          <span>Branding &amp; Social Links</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reading')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: activeSubTab === 'reading' ? '#ffcc00' : '#ffffff',
            color: activeSubTab === 'reading' ? '#0f172a' : '#64748b',
            border: '1px solid',
            borderColor: activeSubTab === 'reading' ? '#ffcc00' : '#e2e8f0',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: activeSubTab === 'reading' ? 600 : 500,
            cursor: 'pointer',
            boxShadow: activeSubTab === 'reading' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Type size={15} color={activeSubTab === 'reading' ? '#0f172a' : '#64748b'} />
          <span>Blog &amp; Reading Settings</span>
        </button>
      </div>

      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* ========================================================================= */}
      {/* 1. WEBSITE SEO META SECTION */}
      {/* ========================================================================= */}
      {activeSubTab === 'seo' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Column: Form Fields */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Info Notice Banner */}
            <div
              style={{
                padding: '12px 16px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                fontSize: '12.5px',
                color: '#1e40af',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <Search size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
              <div>
                <strong>Website Search Engine Optimization (SEO)</strong>
              </div>
            </div>

            {/* Site Title */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  Website Title
                </label>
                <span style={{ fontSize: '11px', color: (settings.siteTitle?.length || 0) > 60 ? '#f59e0b' : '#64748b' }}>
                  {settings.siteTitle?.length || 0} / 60 chars recommended
                </span>
              </div>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={e => handleChange('siteTitle', e.target.value)}
                placeholder="Zwosmos | Astronomy, Space News & Skywatching"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Appears in browser tabs and as the main clickable headline in Google Search results.
              </span>
            </div>

            {/* Site Description */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  Website Meta Description
                </label>
                <span style={{ fontSize: '11px', color: (settings.siteDescription?.length || 0) > 160 ? '#f59e0b' : '#64748b' }}>
                  {settings.siteDescription?.length || 0} / 160 chars recommended
                </span>
              </div>
              <textarea
                rows={3}
                value={settings.siteDescription}
                onChange={e => handleChange('siteDescription', e.target.value)}
                placeholder="Explore astronomy, space news, skywatching guides, cosmic discoveries..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                The search snippet indexed by Google, Bing, and search crawlers under your page title.
              </span>
            </div>

            {/* Canonical Site URL */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                Canonical Website URL
              </label>
              <input
                type="url"
                value={settings.siteUrl}
                onChange={e => handleChange('siteUrl', e.target.value)}
                placeholder="https://zwosmos.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Tells search engines the authoritative domain to prevent duplicate URL penalties.
              </span>
            </div>

            {/* Meta Keywords & Default Author */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Meta Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={settings.keywords}
                  onChange={e => handleChange('keywords', e.target.value)}
                  placeholder="astronomy, astrophysics, cosmology..."
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

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Default Editorial Author
                </label>
                <input
                  type="text"
                  value={settings.authorName}
                  onChange={e => handleChange('authorName', e.target.value)}
                  placeholder="Zwosmos Editorial"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Google Search SERP Simulator */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <Search size={16} color="#2563eb" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Live Google Search SERP Preview
                </span>
              </div>

              {/* Realistic Google Search Card */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                {/* Google Domain Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0f172a'
                    }}
                  >
                    🪐
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#202124', fontWeight: 400, lineHeight: 1.2 }}>
                      Zwosmos
                    </div>
                    <div style={{ fontSize: '11px', color: '#4d5156', lineHeight: 1.2 }}>
                      {settings.siteUrl || 'https://zwosmos.com'}
                    </div>
                  </div>
                </div>

                {/* Google Blue Title */}
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 400,
                    color: '#1a0dab',
                    lineHeight: 1.3,
                    marginBottom: '6px',
                    cursor: 'pointer',
                    wordBreak: 'break-word'
                  }}
                >
                  {settings.siteTitle || 'Zwosmos | Astronomy, Space News & Skywatching'}
                </div>

                {/* Google Snippet Description */}
                <div
                  style={{
                    fontSize: '13px',
                    color: '#4d5156',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {settings.siteDescription || 'Explore astronomy, space news, skywatching guides, cosmic discoveries, missions, telescopes and stories from across the universe with Zwosmos.'}
                </div>
              </div>

              {/* Note */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '11.5px',
                  color: '#64748b',
                  lineHeight: 1.4
                }}
              >
                💡 <strong>Google Search Tips:</strong> Keep your site title under 60 characters and description under 160 characters to avoid truncation with ellipses (...) on search result pages.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OPEN GRAPH & SOCIAL SHARE SECTION */}
      {/* ========================================================================= */}
      {activeSubTab === 'og' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Column: Form Fields */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Info Notice Banner */}
            <div
              style={{
                padding: '12px 16px',
                background: '#fefce8',
                border: '1px solid #fef08a',
                borderRadius: '10px',
                fontSize: '12.5px',
                color: '#854d0e',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <Share2 size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#ca8a04' }} />
              <div>
                <strong>Open Graph &amp; Social Sharing:</strong> These values configure the rich preview cards generated when your website or links are shared on <strong>Twitter/X, WhatsApp, LinkedIn, Discord, and Facebook</strong>.
              </div>
            </div>

            {/* OG Title */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  Open Graph Title (og:title &amp; twitter:title)
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {settings.ogTitle?.length || 0} characters
                </span>
              </div>
              <input
                type="text"
                value={settings.ogTitle}
                onChange={e => handleChange('ogTitle', e.target.value)}
                placeholder="Zwosmos - Exploring Deep Space & Universe Wonders"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                The bold link headline displayed on Twitter/X, WhatsApp, LinkedIn, Discord, and Facebook cards.
              </span>
            </div>

            {/* OG Description */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  Open Graph Description (og:description &amp; twitter:description)
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {settings.ogDescription?.length || 0} characters
                </span>
              </div>
              <textarea
                rows={3}
                value={settings.ogDescription}
                onChange={e => handleChange('ogDescription', e.target.value)}
                placeholder="Discover cosmic missions, astronomical breakthroughs, night sky guides, and universe stories on Zwosmos."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                The social card snippet description shown underneath the headline.
              </span>
            </div>

            {/* Default OG Image Upload & Picker */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} color="#2563eb" />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                    Default Open Graph Banner (og:image &amp; twitter:image)
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Recommended: 1200 × 630 px
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px' }}>
                {settings.ogImage ? (
                  <img
                    src={settings.ogImage}
                    alt="OG Preview"
                    style={{
                      width: '140px',
                      height: '75px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#090d16'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '140px',
                      height: '75px',
                      background: '#e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      fontSize: '11px'
                    }}
                  >
                    No Image
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ffcc00',
                        color: '#0f172a',
                        border: 'none',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(255, 204, 0, 0.3)'
                      }}
                    >
                      <Upload size={13} />
                      <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMediaLibraryOpen(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ffffff',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <FolderOpen size={13} />
                      <span>Choose from Gallery</span>
                    </button>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Used as the default preview banner when the homepage, books, or pages without an article image are shared.
                  </span>
                </div>
              </div>

              {/* Direct URL input fallback */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Or Direct Image URL:
                </label>
                <input
                  type="url"
                  value={settings.ogImage}
                  onChange={e => handleChange('ogImage', e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Twitter / X Handle & Card Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Twitter / X Handle (twitter:site)
                </label>
                <input
                  type="text"
                  value={settings.twitterHandle}
                  onChange={e => handleChange('twitterHandle', e.target.value)}
                  placeholder="@zwosmos"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Twitter Card Format (twitter:card)
                </label>
                <select
                  value={settings.twitterCard}
                  onChange={e => handleChange('twitterCard', e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    background: '#ffffff'
                  }}
                >
                  <option value="summary_large_image">Large Image Card (Recommended)</option>
                  <option value="summary">Small Thumbnail Card</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Live Social Card Simulator */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#eab308" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    Live Social Share Preview
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setPreviewPlatform('twitter')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: previewPlatform === 'twitter' ? '#ffcc00' : '#f1f5f9',
                      color: '#0f172a',
                      boxShadow: previewPlatform === 'twitter' ? '0 1px 4px rgba(255, 204, 0, 0.35)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Twitter / X
                  </button>
                  <button
                    onClick={() => setPreviewPlatform('facebook')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: previewPlatform === 'facebook' ? '#ffcc00' : '#f1f5f9',
                      color: '#0f172a',
                      boxShadow: previewPlatform === 'facebook' ? '0 1px 4px rgba(255, 204, 0, 0.35)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    LinkedIn / FB
                  </button>
                </div>
              </div>

              {/* Realistic Card Preview Frame */}
              {previewPlatform === 'twitter' ? (
                // Twitter / X Large Image Card Preview
                <div
                  style={{
                    background: '#000000',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid #2f3336',
                    color: '#ffffff'
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '190px', background: '#18181b' }}>
                    {settings.ogImage ? (
                      <img
                        src={settings.ogImage}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71767b', fontSize: '12px' }}>
                        No Image Configured
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '12px', color: '#71767b', marginBottom: '3px' }}>
                      {cleanSiteUrl}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#e7e9ea', lineHeight: 1.3, marginBottom: '4px' }}>
                      {settings.ogTitle || settings.siteTitle || 'Zwosmos'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#71767b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {settings.ogDescription || settings.siteDescription || 'Description will appear here.'}
                    </div>
                  </div>
                </div>
              ) : (
                // Facebook / LinkedIn Card Preview
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid #d1d5db'
                  }}
                >
                  <div style={{ width: '100%', height: '190px', background: '#f3f4f6' }}>
                    {settings.ogImage && (
                      <img
                        src={settings.ogImage}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                      {cleanSiteUrl}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px 0', lineHeight: 1.3 }}>
                      {settings.ogTitle || settings.siteTitle || 'Zwosmos'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {settings.ogDescription || settings.siteDescription}
                    </div>
                  </div>
                </div>
              )}

              {/* Note about Blog Posts */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  fontSize: '11.5px',
                  color: '#166534',
                  lineHeight: 1.4,
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <Check size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Automatic Blog Post Open Graph:</strong> When an individual article is shared, its own title, excerpt, and featured hero image automatically override this default banner!
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RSS FEED SYNDICATION SECTION */}
      {/* ========================================================================= */}
      {activeSubTab === 'rss' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'flex-start' }}>
          {/* Form Fields */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Live Feed Status Box */}
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#ffcc00',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  <Rss size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>
                    RSS 2.0 Feed Endpoint Active
                  </div>
                  <div style={{ fontSize: '12px', color: '#3b82f6', fontFamily: 'monospace' }}>
                    {settings.siteUrl.replace(/\/$/, '')}/rss.xml
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCopyRssUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: copiedRss ? '#10b981' : '#ffffff',
                    color: copiedRss ? '#ffffff' : '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {copiedRss ? <Check size={13} /> : <Copy size={13} />}
                  {copiedRss ? 'Copied URL!' : 'Copy Feed URL'}
                </button>

                <a
                  href="/rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffcc00',
                    color: '#0f172a',
                    textDecoration: 'none',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(255, 204, 0, 0.3)'
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Preview XML</span>
                </a>
              </div>
            </div>

            {/* RSS Feed Title */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                RSS Feed Title
              </label>
              <input
                type="text"
                value={settings.rssTitle}
                onChange={e => handleChange('rssTitle', e.target.value)}
                placeholder="Zwosmos - Cosmic Dispatch Feed"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* RSS Feed Description */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                RSS Feed Description
              </label>
              <textarea
                rows={3}
                value={settings.rssDescription}
                onChange={e => handleChange('rssDescription', e.target.value)}
                placeholder="Latest cosmology, space discoveries, and astronomical observations from Zwosmos."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Feed Language */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                Feed Language Code (RFC 1766)
              </label>
              <input
                type="text"
                value={settings.rssLanguage}
                onChange={e => handleChange('rssLanguage', e.target.value)}
                placeholder="en-US"
                style={{
                  width: '200px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Examples: <code>en-US</code>, <code>en-GB</code>, <code>es-ES</code>
              </span>
            </div>
          </div>

          {/* RSS Information Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileCode size={18} color="#7c3aed" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                How RSS Syndication Works
              </span>
            </div>

            <ul style={{ margin: '0 0 16px 0', paddingLeft: '18px', fontSize: '12.5px', color: '#475569', lineHeight: 1.6 }}>
              <li>
                <strong>Auto-Discovery:</strong> The HTML header includes <code>&lt;link rel="alternate" type="application/rss+xml" href="/rss.xml"&gt;</code> so browsers and feed readers detect your feed instantly.
              </li>
              <li>
                <strong>Standards-Compliant RSS 2.0:</strong> Includes full article titles, permalinks, publication dates, author metadata, categories, and cover image enclosures.
              </li>
              <li>
                <strong>Syndication Ready:</strong> Readers can paste <code>{settings.siteUrl}/rss.xml</code> into Apple News, Feedly, Inoreader, Flipboard, or newsletter automation tools.
              </li>
            </ul>

            <div
              style={{
                background: '#faf5ff',
                border: '1px solid #e9d5ff',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '11.5px',
                color: '#6b21a8'
              }}
            >
              ✦ Any new blog post published in the Blogs tab will automatically stream into your RSS feed in real-time.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BRANDING & SOCIAL LINKS SECTION */}
      {/* ========================================================================= */}
      {activeSubTab === 'brand' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            maxWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Contact Email */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
              Contact / Editorial Email
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={e => handleChange('contactEmail', e.target.value)}
              placeholder="contact@zwosmos.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Copyright Text */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
              Footer Copyright Text
            </label>
            <input
              type="text"
              value={settings.copyrightText}
              onChange={e => handleChange('copyrightText', e.target.value)}
              placeholder="© 2026 Zwosmos. All rights reserved."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Social Profiles - Exactly Instagram, Facebook, X, LinkedIn, YouTube */}
          <div style={{ paddingTop: '8px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>
              Social Media Profiles
            </h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#64748b' }}>
              Configure your 5 official brand links (Instagram, Facebook, X, LinkedIn, YouTube). These link directly to the icons in the website footer.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Instagram */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.socialInstagram}
                  onChange={e => handleChange('socialInstagram', e.target.value)}
                  placeholder="https://instagram.com/zwosmos"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Facebook */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={settings.socialFacebook}
                  onChange={e => handleChange('socialFacebook', e.target.value)}
                  placeholder="https://facebook.com/zwosmos"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* X / Twitter */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  X (Twitter) URL
                </label>
                <input
                  type="url"
                  value={settings.socialTwitter}
                  onChange={e => handleChange('socialTwitter', e.target.value)}
                  placeholder="https://x.com/zwosmos"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={settings.socialLinkedin}
                  onChange={e => handleChange('socialLinkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/zwosmos"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* YouTube */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={settings.socialYoutube}
                  onChange={e => handleChange('socialYoutube', e.target.value)}
                  placeholder="https://youtube.com/@zwosmos"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Save Button for Branding & Social Links */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: saving ? '#cbd5e1' : '#ffcc00',
                  color: '#0f172a',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 10px rgba(255, 204, 0, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BLOG & READING EXPERIENCE SECTION */}
      {/* ========================================================================= */}
      {activeSubTab === 'reading' && (
        <div style={{ maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>
                Editorial Typography &amp; Reading Presentation
              </h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                Configure global reading experience preferences for article pages. Changes take effect across all published and draft articles immediately.
              </p>
            </div>

            {/* Toggle Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                gap: '16px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.25rem' }}>🔤</span>
                  <label
                    htmlFor="toggle-drop-cap-settings"
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer'
                    }}
                  >
                    Opening Paragraph Drop Cap
                  </label>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: settings.enableDropCap !== false ? '#dcfce7' : '#f1f5f9',
                      color: settings.enableDropCap !== false ? '#15803d' : '#64748b'
                    }}
                  >
                    {settings.enableDropCap !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>
                  Renders an oversized, elegant serif initial letter on the opening paragraph of each blog dispatch. Turn this <strong>OFF</strong> if you prefer standard uniform paragraph text without touching any code.
                </p>
              </div>

              {/* Styled Interactive Switch */}
              <button
                type="button"
                id="toggle-drop-cap-settings"
                role="switch"
                aria-checked={settings.enableDropCap !== false}
                onClick={() => handleChange('enableDropCap', settings.enableDropCap === false ? true : false)}
                style={{
                  position: 'relative',
                  width: '52px',
                  height: '28px',
                  borderRadius: '14px',
                  background: settings.enableDropCap !== false ? '#ffcc00' : '#cbd5e1',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: settings.enableDropCap !== false ? '0 2px 8px rgba(255, 204, 0, 0.4)' : 'none',
                  transition: 'background 0.25s ease'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transform: settings.enableDropCap !== false ? 'translateX(24px)' : 'translateX(0px)',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </button>
            </div>

            {/* Live Visual Preview */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Live Appearance Preview
              </div>
              <div
                style={{
                  padding: '24px 28px',
                  borderRadius: '12px',
                  background: '#0b0d17',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)'
                }}
              >
                <div style={{ fontSize: '11px', color: '#ffcc00', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', fontFamily: "'Playfair Display', serif" }}>
                  ✦ Sample Article Body
                </div>
                <div
                  style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '1.08rem',
                    lineHeight: 1.85,
                    color: 'rgba(255, 255, 255, 0.88)'
                  }}
                >
                  <p style={{ margin: 0 }}>
                    {settings.enableDropCap !== false ? (
                      <>
                        <span
                          style={{
                            float: 'left',
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: '3.6rem',
                            lineHeight: 0.82,
                            fontWeight: 700,
                            marginRight: '0.55rem',
                            marginTop: '0.12em',
                            marginBottom: '-0.05em',
                            color: '#ffffff',
                            textTransform: 'uppercase'
                          }}
                        >
                          M
                        </span>
                        ore than half a century after Apollo, human space exploration is entering a decisive new era. Rather than fleeting visits to plant flags, the Artemis accords and Lunar Gateway infrastructure aim to establish sustained scientific expeditions at the Moon's permanently shadowed south pole.
                      </>
                    ) : (
                      "More than half a century after Apollo, human space exploration is entering a decisive new era. Rather than fleeting visits to plant flags, the Artemis accords and Lunar Gateway infrastructure aim to establish sustained scientific expeditions at the Moon's permanently shadowed south pole."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Blog Media Gallery Modal for selecting Open Graph Image */}
      {/* ========================================================================= */}
      {isMediaLibraryOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '24px',
            boxSizing: 'border-box'
          }}
          onClick={() => setIsMediaLibraryOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 22px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FolderOpen size={20} color="#2563eb" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    Select Open Graph Image from Media Gallery
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Choose any existing image from your blog gallery or upload a new one
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMediaLibraryOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '6px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Media Gallery Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <MediaLibrary
                client={blogClient as any}
                onSelectMedia={(media: any) => {
                  const url = media?.url || (typeof media === 'string' ? media : '');
                  if (url) {
                    handleChange('ogImage', url);
                    setIsMediaLibraryOpen(false);
                    pushNotify('Open Graph banner selected from gallery!', { type: 'success' });
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
