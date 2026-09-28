import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';
import Footer from './Footer';
import { useBlogPosts, useTags } from '@zwantum/blog/react';
import { useSEO } from '../lib/seoService';
import { settingsService, DEFAULT_SITE_SETTINGS, SiteSettings } from '../lib/settingsService';
import { generateSitemapXml, getSitemapHierarchy, SitemapEntry } from '../lib/sitemapService';
import {
  Search,
  Copy,
  Check,
  Download,
  ExternalLink,
  Map,
  Compass,
  FileText,
  Layers,
  Rss,
  Tag,
  Code,
  Globe,
  ArrowRight
} from 'lucide-react';

export const SitemapPage: React.FC = () => {
  const { isMobile } = useMobile();
  const { theme, isDark } = useTheme();
  const isLight = !isDark;
  const isSepia = theme === 'sepia';

  const { posts: livePosts } = useBlogPosts();
  const { tags: liveTags } = useTags();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pages' | 'categories' | 'articles' | 'tags' | 'feeds'>('all');
  const [copied, setCopied] = useState(false);
  const [showRawXml, setShowRawXml] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
    if (typeof window !== 'undefined' && window.location.pathname.endsWith('.xml')) {
      setShowRawXml(true);
    }
  }, []);

  useSEO({
    title: 'Sitemap - Cosmic Index & Site Architecture',
    description: 'Comprehensive directory and index of all astronomical categories, deep-space dispatches, cosmic literature, and syndication feeds across Zwosmos.',
    type: 'website'
  });

  const hierarchy = useMemo(() => {
    return getSitemapHierarchy(livePosts || [], liveTags || []);
  }, [livePosts, liveTags]);

  const xmlContent = useMemo(() => {
    return generateSitemapXml(livePosts || [], liveTags || [], settings);
  }, [livePosts, liveTags, settings]);

  const sitemapUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/sitemap.xml`
    : 'https://zwosmos.com/sitemap.xml';

  const handleCopy = () => {
    navigator.clipboard.writeText(sitemapUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter items based on activeTab and searchQuery
  const filterEntries = (entries: SitemapEntry[]) => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.loc.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  };

  const filteredCore = useMemo(() => filterEntries(hierarchy.corePages), [hierarchy.corePages, searchQuery]);
  const filteredCategories = useMemo(() => filterEntries(hierarchy.categories), [hierarchy.categories, searchQuery]);
  const filteredArticles = useMemo(() => filterEntries(hierarchy.articles), [hierarchy.articles, searchQuery]);
  const filteredTags = useMemo(() => filterEntries(hierarchy.tags), [hierarchy.tags, searchQuery]);
  const filteredFeeds = useMemo(() => filterEntries(hierarchy.feeds), [hierarchy.feeds, searchQuery]);

  const totalIndexed =
    hierarchy.corePages.length +
    hierarchy.categories.length +
    hierarchy.articles.length +
    hierarchy.tags.length +
    hierarchy.feeds.length;

  const cardBg = isLight
    ? (isSepia ? '#fdf5e6' : '#ffffff')
    : 'rgba(255, 255, 255, 0.03)';
  const cardBorder = isLight
    ? (isSepia ? '1px solid rgba(217, 119, 6, 0.22)' : '1px solid #e2e8f0')
    : '1px solid rgba(255, 255, 255, 0.08)';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark
          ? 'radial-gradient(ellipse at top center, rgba(147, 51, 234, 0.22) 0%, var(--bg-main) 60%)'
          : (isSepia ? '#fff3e0' : '#f8fafc'),
        backgroundColor: isDark ? 'var(--bg-main)' : (isSepia ? '#fff3e0' : '#f8fafc'),
        color: isDark ? '#ffffff' : '#111827',
        boxSizing: 'border-box',
        transition: 'background 0.3s ease, background-color 0.3s ease, color 0.3s ease'
      }}
    >
      <Header />

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '24px 16px 80px' : '48px 24px 100px',
          boxSizing: 'border-box'
        }}
      >
        {/* ========================================================================= */}
        {/* 1. BREADCRUMBS                                                            */}
        {/* ========================================================================= */}
        <div
          style={{
            fontSize: isMobile ? '0.78rem' : '0.85rem',
            color: isLight ? '#6b7280' : 'rgba(255,255,255,0.6)',
            letterSpacing: '0.5px',
            fontWeight: 600,
            fontFamily: "'Lora', serif",
            marginBottom: isMobile ? '20px' : '28px'
          }}
        >
          <Link
            to="/"
            style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--brand-purple)')}
            onMouseOut={e => (e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255,255,255,0.6)')}
          >
            Zwosmos
          </Link>
          <span style={{ color: 'var(--brand-purple)', margin: '0 8px' }}>›</span>
          <span style={{ color: isLight ? '#111827' : 'rgba(255,255,255,0.92)' }}>Sitemap</span>
        </div>

        {/* ========================================================================= */}
        {/* 2. HERO HEADER                                                            */}
        {/* ========================================================================= */}
        <section
          style={{
            background: cardBg,
            border: cardBorder,
            borderRadius: '24px',
            padding: isMobile ? '28px 20px' : '44px 40px',
            boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.04)' : '0 20px 48px rgba(0,0,0,0.45)',
            marginBottom: '36px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Compass size={20} />
            </div>
            <div
              style={{
                color: '#a855f7',
                fontFamily: '"Orbitron", sans-serif',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}
            >
              Cosmic Cartography
            </div>
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2rem, 1.2rem + 2.5vw, 3.4rem)',
              lineHeight: 1.15,
              margin: '0 0 16px 0',
              color: isLight ? '#0f172a' : '#ffffff'
            }}
          >
            Cosmic Sitemap & Architecture
          </h1>

          <p
            style={{
              fontFamily: "'Lora', serif",
              fontSize: isMobile ? '1rem' : '1.12rem',
              color: isLight ? '#475569' : 'rgba(255, 255, 255, 0.75)',
              maxWidth: '780px',
              lineHeight: 1.65,
              margin: '0 0 28px 0'
            }}
          >
            Explore the comprehensive directory of our universe: 9 curated astronomical compendiums,
            investigative deep-space dispatches, cosmic literature, and machine-readable syndication manifests.
          </p>

          {/* Quick Actions (Copy XML URL & Download) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: isLight ? '#f1f5f9' : 'rgba(0, 0, 0, 0.4)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '13px',
                fontFamily: 'monospace',
                color: isLight ? '#334155' : '#cbd5e1',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <Globe size={14} style={{ color: '#a855f7', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sitemapUrl}</span>
            </div>

            <button
              onClick={handleCopy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: copied ? '#10b981' : 'var(--brand-purple)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 18px',
                fontFamily: '"Orbitron", sans-serif',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: copied ? '0 0 16px rgba(16, 185, 129, 0.4)' : '0 0 16px rgba(147, 51, 234, 0.4)'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'COPIED XML URL' : 'COPY SITEMAP XML'}
            </button>

            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                color: isLight ? '#1f2937' : '#ffffff',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '12px',
                padding: '9px 18px',
                fontFamily: '"Orbitron", sans-serif',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--brand-purple)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Download size={14} />
              DOWNLOAD XML
            </button>

            <button
              onClick={() => setShowRawXml(!showRawXml)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                color: '#a855f7',
                border: 'none',
                padding: '9px 12px',
                fontFamily: '"Orbitron", sans-serif',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '1px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              <Code size={14} />
              {showRawXml ? 'HIDE RAW XML' : 'INSPECT RAW XML'}
            </button>
          </div>

          {/* Raw XML Box */}
          {showRawXml && (
            <div
              style={{
                marginTop: '24px',
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                padding: '20px',
                maxHeight: '360px',
                overflow: 'auto',
                position: 'relative'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  borderBottom: '1px solid #1e293b',
                  paddingBottom: '8px'
                }}
              >
                <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  W3C XML Sitemap Protocol v0.9 • {urlsCount(xmlContent)} URLs
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(xmlContent);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a855f7',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Copy size={12} />
                  Copy XML Code
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: 1.5,
                  fontFamily: 'Consolas, Monaco, monospace',
                  color: '#38bdf8',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}
              >
                {xmlContent}
              </pre>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 3. METRIC COUNTERS                                                        */}
        {/* ========================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
            gap: isMobile ? '12px' : '16px',
            marginBottom: '36px'
          }}
        >
          {[
            { label: 'Total Endpoints', value: totalIndexed, icon: Layers, color: '#a855f7' },
            { label: 'Core Portals', value: hierarchy.corePages.length, icon: Map, color: '#38bdf8' },
            { label: 'Cosmic Topics', value: hierarchy.categories.length, icon: Compass, color: '#ec4899' },
            { label: 'Dispatches', value: hierarchy.articles.length, icon: FileText, color: '#10b981' },
            { label: 'Data Feeds', value: hierarchy.feeds.length, icon: Rss, color: '#f59e0b' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                style={{
                  background: cardBg,
                  border: cardBorder,
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.02)' : 'none'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: `${stat.color}15`,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: '"Orbitron", sans-serif',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color: isLight ? '#0f172a' : '#ffffff'
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.6)',
                      fontFamily: '"Noto Sans", sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginTop: '2px'
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 4. SEARCH & TAB FILTER BAR                                                */}
        {/* ========================================================================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            marginBottom: '32px'
          }}
        >
          {/* Tab Filters */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
              padding: '4px',
              borderRadius: '14px'
            }}
          >
            {[
              { id: 'all', label: 'All Destinations' },
              { id: 'pages', label: 'Primary Hubs' },
              { id: 'categories', label: '9 Categories' },
              { id: 'articles', label: 'Dispatches' },
              { id: 'tags', label: 'Topics & Tags' },
              { id: 'feeds', label: 'Feeds & XML' }
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    background: active
                      ? (isLight ? '#ffffff' : 'var(--brand-purple)')
                      : 'transparent',
                    color: active
                      ? (isLight ? 'var(--brand-purple)' : '#ffffff')
                      : (isLight ? '#475569' : 'rgba(255, 255, 255, 0.65)'),
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontFamily: '"Orbitron", sans-serif',
                    fontWeight: active ? 700 : 500,
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: active
                      ? (isLight ? '0 2px 8px rgba(0,0,0,0.06)' : '0 0 14px rgba(147, 51, 234, 0.5)')
                      : 'none'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              width: isMobile ? '100%' : '320px'
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.4)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search cosmic index..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '10px 14px 10px 38px',
                color: isLight ? '#0f172a' : '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand-purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)')}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. CONTENT SECTIONS                                                       */}
        {/* ========================================================================= */}

        {/* SECTION 1: CORE PORTALS */}
        {(activeTab === 'all' || activeTab === 'pages') && filteredCore.length > 0 && (
          <section style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Map size={18} style={{ color: '#38bdf8' }} />
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.45rem',
                  margin: 0,
                  color: isLight ? '#0f172a' : '#ffffff'
                }}
              >
                Primary Portals & Navigational Anchors
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                ({filteredCore.length})
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}
            >
              {filteredCore.map(item => (
                <Link
                  key={item.loc}
                  to={item.loc}
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: '16px',
                    padding: '20px',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--brand-purple)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = isLight
                      ? '0 12px 24px rgba(147, 51, 234, 0.12)'
                      : '0 12px 28px rgba(147, 51, 234, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isLight
                      ? (isSepia ? 'rgba(217, 119, 6, 0.22)' : '#e2e8f0')
                      : 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          color: '#a855f7',
                          background: 'rgba(168, 85, 247, 0.12)',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {item.loc}
                      </span>
                      <ArrowRight size={14} style={{ color: '#a855f7' }} />
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.18rem',
                        margin: '0 0 6px 0',
                        color: isLight ? '#0f172a' : '#ffffff'
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Lora', serif",
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.65)',
                        margin: 0
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: THE 9 ASTRONOMICAL CATEGORIES */}
        {(activeTab === 'all' || activeTab === 'categories') && filteredCategories.length > 0 && (
          <section style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Compass size={18} style={{ color: '#ec4899' }} />
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.45rem',
                  margin: 0,
                  color: isLight ? '#0f172a' : '#ffffff'
                }}
              >
                The 9 Astronomical Compendiums
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#ec4899', fontFamily: 'monospace' }}>
                ({filteredCategories.length})
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px'
              }}
            >
              {filteredCategories.map(cat => (
                <Link
                  key={cat.loc}
                  to={cat.loc}
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: '16px',
                    padding: '22px',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#ec4899';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = isLight
                      ? '0 12px 24px rgba(236, 72, 153, 0.12)'
                      : '0 12px 28px rgba(236, 72, 153, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isLight
                      ? (isSepia ? 'rgba(217, 119, 6, 0.22)' : '#e2e8f0')
                      : 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          color: '#ec4899',
                          background: 'rgba(236, 72, 153, 0.12)',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {cat.loc}
                      </span>
                      <ArrowRight size={14} style={{ color: '#ec4899' }} />
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.25rem',
                        margin: '0 0 6px 0',
                        color: isLight ? '#0f172a' : '#ffffff'
                      }}
                    >
                      {cat.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Lora', serif",
                        fontSize: '0.88rem',
                        lineHeight: 1.55,
                        color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.65)',
                        margin: 0
                      }}
                    >
                      {cat.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: ARTICLES & DISPATCHES */}
        {(activeTab === 'all' || activeTab === 'articles') && filteredArticles.length > 0 && (
          <section style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <FileText size={18} style={{ color: '#10b981' }} />
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.45rem',
                  margin: 0,
                  color: isLight ? '#0f172a' : '#ffffff'
                }}
              >
                Published Dispatches & Scientific Guides
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontFamily: 'monospace' }}>
                ({filteredArticles.length})
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '14px'
              }}
            >
              {filteredArticles.map(article => (
                <Link
                  key={article.loc}
                  to={article.loc}
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: '14px',
                    padding: '16px 18px',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.22s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isLight
                      ? '0 8px 20px rgba(16, 185, 129, 0.1)'
                      : '0 8px 24px rgba(16, 185, 129, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isLight
                      ? (isSepia ? 'rgba(217, 119, 6, 0.22)' : '#e2e8f0')
                      : 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: '"Orbitron", sans-serif',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          color: '#10b981',
                          fontWeight: 600
                        }}
                      >
                        {article.category}
                      </span>
                      {article.lastmod && (
                        <span style={{ fontSize: '0.72rem', color: isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.45)', fontFamily: 'monospace' }}>
                          {article.lastmod}
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.05rem',
                        lineHeight: 1.35,
                        margin: '0 0 6px 0',
                        color: isLight ? '#0f172a' : '#ffffff'
                      }}
                    >
                      {article.title}
                    </h3>
                    {article.description && (
                      <p
                        style={{
                          fontFamily: "'Lora', serif",
                          fontSize: '0.82rem',
                          lineHeight: 1.5,
                          color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.6)',
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {article.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 4: TAGS & DISCOVERY TOPICS */}
        {(activeTab === 'all' || activeTab === 'tags') && filteredTags.length > 0 && (
          <section style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Tag size={18} style={{ color: '#a855f7' }} />
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.45rem',
                  margin: 0,
                  color: isLight ? '#0f172a' : '#ffffff'
                }}
              >
                Topics & Exploratory Tags
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#a855f7', fontFamily: 'monospace' }}>
                ({filteredTags.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {filteredTags.map(tagItem => (
                <Link
                  key={tagItem.loc}
                  to={tagItem.loc}
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: '24px',
                    padding: '8px 16px',
                    textDecoration: 'none',
                    color: isLight ? '#1f2937' : '#ffffff',
                    fontSize: '0.86rem',
                    fontFamily: '"Orbitron", sans-serif',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--brand-purple)';
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)';
                    e.currentTarget.style.color = '#a855f7';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isLight
                      ? (isSepia ? 'rgba(217, 119, 6, 0.22)' : '#e2e8f0')
                      : 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = cardBg;
                    e.currentTarget.style.color = isLight ? '#1f2937' : '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span>{tagItem.title}</span>
                  <ArrowRight size={12} style={{ opacity: 0.6 }} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 5: FEEDS & MACHINE MANIFESTS */}
        {(activeTab === 'all' || activeTab === 'feeds') && filteredFeeds.length > 0 && (
          <section style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Rss size={18} style={{ color: '#f59e0b' }} />
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.45rem',
                  margin: 0,
                  color: isLight ? '#0f172a' : '#ffffff'
                }}
              >
                Machine Protocols & Syndication Feeds
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontFamily: 'monospace' }}>
                ({filteredFeeds.length})
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px'
              }}
            >
              {filteredFeeds.map(feedItem => (
                <Link
                  key={feedItem.loc}
                  to={feedItem.loc}
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: '16px',
                    padding: '22px',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#f59e0b';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = isLight
                      ? '0 12px 24px rgba(245, 158, 11, 0.12)'
                      : '0 12px 28px rgba(245, 158, 11, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isLight
                      ? (isSepia ? 'rgba(217, 119, 6, 0.22)' : '#e2e8f0')
                      : 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.12)',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {feedItem.loc}
                      </span>
                      <ExternalLink size={14} style={{ color: '#f59e0b' }} />
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.2rem',
                        margin: '0 0 6px 0',
                        color: isLight ? '#0f172a' : '#ffffff'
                      }}
                    >
                      {feedItem.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Lora', serif",
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.65)',
                        margin: 0
                      }}
                    >
                      {feedItem.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty Search Result State */}
        {filteredCore.length === 0 &&
          filteredCategories.length === 0 &&
          filteredArticles.length === 0 &&
          filteredTags.length === 0 &&
          filteredFeeds.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: cardBg,
                border: cardBorder,
                borderRadius: '20px'
              }}
            >
              <Compass size={48} style={{ color: '#a855f7', marginBottom: '16px', opacity: 0.8 }} />
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.4rem',
                  margin: '0 0 8px 0',
                  color: isLight ? '#0f172a' : '#ffffff'
                }}
              >
                No Matching Cosmic Coordinates
              </h3>
              <p
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: '0.95rem',
                  color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.65)',
                  maxWidth: '480px',
                  margin: '0 auto 20px auto'
                }}
              >
                We could not find any endpoints matching "{searchQuery}". Try searching for another cosmic term, topic, or category.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'var(--brand-purple)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontFamily: '"Orbitron", sans-serif',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                CLEAR SEARCH
              </button>
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
};

function urlsCount(xml: string): number {
  const matches = xml.match(/<url>/g);
  return matches ? matches.length : 0;
}

export default SitemapPage;
