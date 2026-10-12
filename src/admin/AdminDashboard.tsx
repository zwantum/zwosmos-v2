import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  FileText,
  Database,
  BookOpen,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Users,
  Image as ImageIcon,
  SlidersHorizontal,
} from 'lucide-react';
import BlogsManager from './BlogsManager';
import { BlogAdminView } from './blog-admin/index';
import FactsManager from './FactsManager';
import BooksManager from './BooksManager';
import SettingsManager from './SettingsManager';
import { PushNotificationContainer } from './PushNotification';
import './Admin.css';

type AdminTab = 'blogs' | 'facts' | 'books' | 'settings';
const VALID_TABS: AdminTab[] = ['blogs', 'facts', 'books', 'settings'];

type BlogSubView = 'overview' | 'posts' | 'categories' | 'authors' | 'media' | 'settings';
const VALID_BLOG_VIEWS: BlogSubView[] = ['overview', 'posts', 'categories', 'authors', 'media', 'settings'];

import type { LucideIcon } from 'lucide-react';

interface BlogSubItemConfig {
  key: BlogSubView;
  label: string;
  icon: LucideIcon;
}

const blogSubItems: BlogSubItemConfig[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'categories', label: 'Categories', icon: FolderTree },
  { key: 'authors', label: 'Authors', icon: Users },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'settings', label: 'Settings', icon: SlidersHorizontal },
];

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Collapsed / minified sidebar state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zwosmos_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zwosmos_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const getInitialTab = (): AdminTab => {
    // 1. Try URL search parameter ?tab=...
    const urlTab = searchParams.get('tab') as AdminTab;
    if (urlTab && VALID_TABS.includes(urlTab)) {
      return urlTab;
    }
    // 2. Try LocalStorage
    try {
      const stored = localStorage.getItem('zwosmos_admin_tab') as AdminTab;
      if (stored && VALID_TABS.includes(stored)) {
        return stored;
      }
    } catch {}
    // 3. Fallback
    return 'blogs';
  };

  const getInitialBlogView = (): BlogSubView => {
    const urlView = searchParams.get('view') as BlogSubView;
    if (urlView && VALID_BLOG_VIEWS.includes(urlView)) {
      return urlView;
    }
    try {
      const stored = localStorage.getItem('zwosmos_admin_blog_view') as BlogSubView;
      if (stored && VALID_BLOG_VIEWS.includes(stored)) {
        return stored;
      }
    } catch {}
    return 'posts';
  };

  const [activeTab, setActiveTabState] = useState<AdminTab>(getInitialTab);
  const [activeBlogView, setActiveBlogViewState] = useState<BlogSubView>(getInitialBlogView);
  const [isBlogsExpanded, setIsBlogsExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('zwosmos_admin_blogs_expanded');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleBlogsExpanded = () => {
    setIsBlogsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zwosmos_admin_blogs_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const handleTabChange = (tab: AdminTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('zwosmos_admin_tab', tab);
    } catch {}
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        if (tab === 'blogs') {
          next.set('view', activeBlogView);
        } else {
          next.delete('view');
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleBlogSubViewClick = (view: BlogSubView) => {
    setActiveTabState('blogs');
    setActiveBlogViewState(view);
    setIsBlogsExpanded(true);
    try {
      localStorage.setItem('zwosmos_admin_tab', 'blogs');
      localStorage.setItem('zwosmos_admin_blog_view', view);
      localStorage.setItem('zwosmos_admin_blogs_expanded', 'true');
    } catch {}
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'blogs');
        next.set('view', view);
        return next;
      },
      { replace: true }
    );
  };

  const handleBlogViewFromInside = (v: BlogAdminView) => {
    if (VALID_BLOG_VIEWS.includes(v as BlogSubView)) {
      setActiveBlogViewState(v as BlogSubView);
      try {
        localStorage.setItem('zwosmos_admin_blog_view', v);
      } catch {}
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', 'blogs');
          next.set('view', v);
          return next;
        },
        { replace: true }
      );
    }
  };

  // Keep URL search params and tab state synchronized
  useEffect(() => {
    const urlTab = searchParams.get('tab') as AdminTab;
    const urlView = searchParams.get('view') as BlogAdminView;

    if (urlTab && VALID_TABS.includes(urlTab)) {
      if (urlTab !== activeTab) {
        setActiveTabState(urlTab);
        try {
          localStorage.setItem('zwosmos_admin_tab', urlTab);
        } catch {}
      }
    }

    if (urlTab === 'blogs' && urlView && VALID_BLOG_VIEWS.includes(urlView as BlogSubView)) {
      if (urlView !== activeBlogView) {
        setActiveBlogViewState(urlView as BlogSubView);
        try {
          localStorage.setItem('zwosmos_admin_blog_view', urlView);
        } catch {}
      }
    }
  }, [searchParams]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div
      className="admin-dashboard"
      style={{
        display: 'flex',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        background: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <PushNotificationContainer />
      {/* Sidebar - Sticky, Collapsible / Minified, Independent Height */}
      <aside
        style={{
          width: isCollapsed ? '76px' : '240px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          padding: isCollapsed ? '20px 10px' : '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxSizing: 'border-box',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 10,
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Brand Header & Toggle */}
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', paddingLeft: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#ffcc00',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(255, 204, 0, 0.4)',
                  flexShrink: 0
                }}
              >
                <LayoutDashboard size={19} />
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                  Admin
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: 400 }}>
                  Zwosmos Portal
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSidebar}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
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
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <ChevronLeft size={18} strokeWidth={2.2} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingBottom: '24px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#ffcc00',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(255, 204, 0, 0.4)',
                flexShrink: 0
              }}
            >
              <LayoutDashboard size={20} />
            </div>

            <button
              type="button"
              onClick={toggleSidebar}
              title="Expand sidebar"
              aria-label="Expand sidebar"
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
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <ChevronRight size={18} strokeWidth={2.2} />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, alignItems: isCollapsed ? 'center' : 'stretch' }}>
          {/* 1. BLOGS with nested accordion */}
          <div style={{ width: isCollapsed ? 'auto' : '100%' }}>
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) {
                  toggleSidebar();
                  handleTabChange('blogs');
                  setIsBlogsExpanded(true);
                } else {
                  if (activeTab !== 'blogs') {
                    handleTabChange('blogs');
                    setIsBlogsExpanded(true);
                  } else {
                    toggleBlogsExpanded();
                  }
                }
              }}
              title="Blogs"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                gap: isCollapsed ? '0px' : '12px',
                padding: isCollapsed ? '10px 0' : '10px 14px',
                width: isCollapsed ? '46px' : '100%',
                height: isCollapsed ? '46px' : 'auto',
                background:
                  activeTab === 'blogs' && (!isBlogsExpanded || isCollapsed)
                    ? '#ffcc00'
                    : activeTab === 'blogs'
                    ? '#f1f5f9'
                    : 'transparent',
                color: activeTab === 'blogs' ? '#0f172a' : '#64748b',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: activeTab === 'blogs' ? 600 : 500,
                boxShadow:
                  activeTab === 'blogs' && (!isBlogsExpanded || isCollapsed)
                    ? '0 2px 8px rgba(255, 204, 0, 0.35)'
                    : 'none',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'blogs' || (isBlogsExpanded && !isCollapsed)) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'blogs') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                } else if (isBlogsExpanded && !isCollapsed) {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0px' : '12px' }}>
                <FileText size={20} strokeWidth={2} />
                {!isCollapsed && <span>Blogs</span>}
              </div>

              {!isCollapsed && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: activeTab === 'blogs' ? '#0f172a' : '#94a3b8',
                  }}
                >
                  {isBlogsExpanded ? <ChevronDown size={16} strokeWidth={2.2} /> : <ChevronRight size={16} strokeWidth={2.2} />}
                </span>
              )}
            </button>

            {/* Sub-items under Blogs */}
            {!isCollapsed && isBlogsExpanded && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  paddingLeft: '12px',
                  marginLeft: '14px',
                  marginTop: '4px',
                  marginBottom: '6px',
                  borderLeft: '2px solid #e2e8f0',
                }}
              >
                {blogSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive =
                    activeTab === 'blogs' &&
                    (activeBlogView === sub.key ||
                      (sub.key === 'posts' &&
                        (activeBlogView === 'posts' ||
                          (activeBlogView as string) === 'new-post' ||
                          (activeBlogView as string) === 'edit-post')));

                  return (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => handleBlogSubViewClick(sub.key)}
                      title={sub.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        width: '100%',
                        background: isSubActive ? '#ffcc00' : 'transparent',
                        color: isSubActive ? '#0f172a' : '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: isSubActive ? 600 : 500,
                        boxShadow: isSubActive ? '0 2px 6px rgba(255, 204, 0, 0.3)' : 'none',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubActive) {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.color = '#0f172a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#64748b';
                        }
                      }}
                    >
                      <SubIcon size={16} strokeWidth={isSubActive ? 2.2 : 1.9} />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. FACTS */}
          <button
            type="button"
            onClick={() => handleTabChange('facts')}
            title="Facts"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0px' : '12px',
              padding: isCollapsed ? '10px 0' : '10px 14px',
              width: isCollapsed ? '46px' : '100%',
              height: isCollapsed ? '46px' : 'auto',
              background: activeTab === 'facts' ? '#ffcc00' : 'transparent',
              color: activeTab === 'facts' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: activeTab === 'facts' ? 600 : 500,
              boxShadow: activeTab === 'facts' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'facts') {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#0f172a';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'facts') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            <Database size={20} strokeWidth={2} />
            {!isCollapsed && <span>Facts</span>}
          </button>

          {/* 3. BOOKS */}
          <button
            type="button"
            onClick={() => handleTabChange('books')}
            title="Books"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0px' : '12px',
              padding: isCollapsed ? '10px 0' : '10px 14px',
              width: isCollapsed ? '46px' : '100%',
              height: isCollapsed ? '46px' : 'auto',
              background: activeTab === 'books' ? '#ffcc00' : 'transparent',
              color: activeTab === 'books' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: activeTab === 'books' ? 600 : 500,
              boxShadow: activeTab === 'books' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'books') {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#0f172a';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'books') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            <BookOpen size={20} strokeWidth={2} />
            {!isCollapsed && <span>Books</span>}
          </button>

          {/* 4. SETTINGS */}
          <button
            type="button"
            onClick={() => handleTabChange('settings')}
            title="Settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0px' : '12px',
              padding: isCollapsed ? '10px 0' : '10px 14px',
              width: isCollapsed ? '46px' : '100%',
              height: isCollapsed ? '46px' : 'auto',
              background: activeTab === 'settings' ? '#ffcc00' : 'transparent',
              color: activeTab === 'settings' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: activeTab === 'settings' ? 600 : 500,
              boxShadow: activeTab === 'settings' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'settings') {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#0f172a';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'settings') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            <SettingsIcon size={20} strokeWidth={2} />
            {!isCollapsed && <span>Settings</span>}
          </button>
        </nav>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0px' : '10px',
            padding: isCollapsed ? '10px 0' : '10px 14px',
            width: isCollapsed ? '46px' : '100%',
            height: isCollapsed ? '46px' : 'auto',
            margin: isCollapsed ? 'auto auto 0 auto' : 'auto 0 0 0',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            color: '#64748b',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.15s ease',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff1f2';
            e.currentTarget.style.borderColor = '#fecdd3';
            e.currentTarget.style.color = '#e11d48';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Main Content Area - Scrollable Independently */}
      <main
        style={{
          flex: 1,
          height: '100vh',
          padding: '24px 28px',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#f8fafc',
          color: '#0f172a',
          boxSizing: 'border-box'
        }}
      >
        {activeTab === 'facts' && (
          <div style={{ width: '100%', margin: 0 }}>
            <h1 style={{ marginBottom: '20px', fontSize: '1.35rem', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Manage Facts
            </h1>
            <FactsManager />
          </div>
        )}

        {activeTab === 'blogs' && (
          <BlogsManager
            view={activeBlogView}
            onViewChange={handleBlogViewFromInside}
          />
        )}
        {activeTab === 'books' && <BooksManager />}
        {activeTab === 'settings' && <SettingsManager />}
      </main>
    </div>
  );
}
