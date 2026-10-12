import React, { useState, useEffect } from 'react';
import { BlogClient } from '@zwantum/blog-core';
import { BlogSettings, Media } from '@zwantum/blog-types';
import { BlogOverview } from './BlogOverview';
import { PostList } from './PostList';
import { PostEditor } from './PostEditor';
import { CategoryManager } from './CategoryManager';
import { TagManager } from './TagManager';
import { AuthorManager } from './AuthorManager';
import { MediaLibrary } from './MediaLibrary';
import { CommentManager } from './CommentManager';
import { BlogSettingsView } from './BlogSettingsView';

export type BlogAdminView =
  | 'overview'
  | 'posts'
  | 'new-post'
  | 'edit-post'
  | 'categories'
  | 'tags'
  | 'authors'
  | 'media'
  | 'comments'
  | 'settings';

export interface BlogAdminProps {
  client: BlogClient;
  className?: string;
  enableMedia?: boolean;
  onOpenHostMediaPicker?: () => void;
  initialView?: BlogAdminView;
  title?: string;
  subtitle?: string;
  hideSidebar?: boolean;
  view?: BlogAdminView;
  onViewChange?: (view: BlogAdminView) => void;
}

// Crisp Outline SVG Icons
const Icons = {
  FeatherLogo: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  ),
  Blogs: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
      <path d="M6 14h6" />
    </svg>
  ),
  Overview: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Posts: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Categories: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  ),
  Tags: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <circle cx="7" cy="7" r="1.5" />
    </svg>
  ),
  Authors: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Media: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  Comments: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Settings: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  ChevronDown: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  ChevronLeft: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  ChevronRight: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
};

/**
 * BlogAdmin: The all-in-one unified dashboard component for ZwantumBlog.
 * Drop this single component into any existing or new React/Next.js dashboard.
 */
export const BlogAdmin: React.FC<BlogAdminProps> = ({
  client,
  className = '',
  enableMedia: enableMediaProp,
  initialView = 'overview',
  title = 'Blog',
  subtitle = 'Create • Share • Inspire',
  hideSidebar = false,
  view: controlledView,
  onViewChange,
}) => {
  const [activeView, setActiveView] = useState<BlogAdminView>(controlledView || initialView);
  const [editingPostId, setEditingPostId] = useState<string | undefined>(undefined);
  const [pendingComments, setPendingComments] = useState<number>(0);
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [isBlogsOpen, setIsBlogsOpen] = useState<boolean>(true);

  // Sync with external controlled view if provided
  useEffect(() => {
    if (controlledView && controlledView !== activeView) {
      if (controlledView === 'posts') {
        setEditingPostId(undefined);
      }
      setActiveView(controlledView);
    }
  }, [controlledView]);

  const changeView = (newView: BlogAdminView, postId?: string) => {
    if (postId !== undefined) {
      setEditingPostId(postId);
    } else if (newView === 'posts' || newView === 'new-post') {
      setEditingPostId(undefined);
    }
    setActiveView(newView);
    onViewChange?.(newView);
  };

  // Collapsed / minified blog sidebar state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zwosmos_blog_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zwosmos_blog_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Media Picker Modal State (for Featured Image and Content insertion)
  const [showMediaPickerModal, setShowMediaPickerModal] = useState<boolean>(false);
  const [mediaPickerSelectCallback, setMediaPickerSelectCallback] = useState<((media: Media) => void) | null>(null);

  // Load blog settings to determine active modules
  useEffect(() => {
    client.settings
      .get()
      .then(setSettings)
      .catch(() => {});
  }, [client]);

  // Load pending comments count for badge
  useEffect(() => {
    client.comments
      .list({ status: 'pending' })
      .then((res) => setPendingComments(res.total))
      .catch(() => {});
  }, [client, activeView]);

  // Module toggles
  const isMediaEnabled = enableMediaProp !== undefined ? enableMediaProp : settings?.enableMedia !== false;
  const isCommentsEnabled = settings?.enableComments !== false;

  // Blog sub-modules inside the Blogs dropdown
  const blogSubModules = [
    { key: 'overview', label: 'Overview', icon: Icons.Overview, badge: undefined },
    { key: 'posts', label: 'Posts', icon: Icons.Posts, badge: undefined },
    { key: 'categories', label: 'Categories', icon: Icons.Categories, badge: undefined },
    { key: 'authors', label: 'Authors', icon: Icons.Authors, badge: undefined },
    ...(isMediaEnabled
      ? [{ key: 'media', label: 'Media', icon: Icons.Media, badge: undefined }]
      : []),
    ...(isCommentsEnabled
      ? [{ key: 'comments', label: 'Comments', icon: Icons.Comments, badge: pendingComments > 0 ? String(pendingComments) : undefined }]
      : []),
    { key: 'settings', label: 'Settings', icon: Icons.Settings, badge: undefined },
  ];

  const isSubItemActive = (key: string): boolean => {
    if (key === 'posts') {
      return activeView === 'posts' || activeView === 'new-post' || activeView === 'edit-post';
    }
    return activeView === key;
  };

  const isAnyBlogSubItemActive = blogSubModules.some((item) => isSubItemActive(item.key));

  return (
    <div
      className={`zw-blog-admin-root ${className}`}
      style={{
        display: 'flex',
        minHeight: hideSidebar ? 'auto' : '100vh',
        background: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* 1. CLEAN SIDEBAR */}
      {!hideSidebar && (
        <aside
          style={{
            width: isSidebarCollapsed ? '76px' : '255px',
            background: '#ffffff',
            color: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          borderRight: '1px solid #f1f5f9',
          padding: isSidebarCollapsed ? '20px 10px' : '24px 16px',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), padding 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Brand Header & Toggle */}
        {!isSidebarCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', paddingLeft: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
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
                  flexShrink: 0,
                }}
              >
                <Icons.FeatherLogo />
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.02em', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {title}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400, marginTop: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {subtitle}
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
                transition: 'all 0.15s ease',
                flexShrink: 0,
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
              <Icons.ChevronLeft size={18} />
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
                flexShrink: 0,
              }}
            >
              <Icons.FeatherLogo />
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
                transition: 'all 0.15s ease',
                flexShrink: 0,
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
              <Icons.ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Navigation */}
        {!isSidebarCollapsed ? (
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
            {/* Collapsible Blogs Dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setIsBlogsOpen(!isBlogsOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isAnyBlogSubItemActive && !isBlogsOpen ? '#fffdf0' : 'transparent',
                  color: isAnyBlogSubItemActive ? '#0f172a' : '#334155',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 600,
                  width: '100%',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isAnyBlogSubItemActive && !isBlogsOpen ? '#fffdf0' : 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: isAnyBlogSubItemActive ? '#0f172a' : '#64748b', display: 'flex' }}>
                    <Icons.Blogs />
                  </span>
                  <span>Blogs</span>
                </div>
                <span style={{ color: '#94a3b8', display: 'flex' }}>
                  {isBlogsOpen ? <Icons.ChevronDown size={14} /> : <Icons.ChevronRight size={14} />}
                </span>
              </button>

              {/* Sub-modules */}
              {isBlogsOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '3px', marginBottom: '8px' }}>
                  {blogSubModules.map((item) => {
                    const active = isSubItemActive(item.key);
                    const IconComponent = item.icon;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          if (item.key === 'posts') {
                            setEditingPostId(undefined);
                          }
                          setActiveView(item.key as BlogAdminView);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 14px 9px 34px',
                          borderRadius: '10px',
                          border: 'none',
                          background: active ? '#ffcc00' : 'transparent',
                          color: active ? '#0f172a' : '#64748b',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: active ? 600 : 450,
                          width: '100%',
                          boxShadow: active ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.color = '#0f172a';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#64748b';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: active ? '#0f172a' : '#94a3b8', display: 'flex' }}>
                            <IconComponent />
                          </span>
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            style={{
                              background: active ? '#0f172a' : '#ffcc00',
                              color: active ? '#ffcc00' : '#0f172a',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '10px',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        ) : (
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', overflowY: 'auto' }}>
            {blogSubModules.map((item) => {
              const active = isSubItemActive(item.key);
              const IconComponent = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (item.key === 'posts') {
                      setEditingPostId(undefined);
                    }
                    setActiveView(item.key as BlogAdminView);
                  }}
                  title={item.label}
                  aria-label={item.label}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    border: 'none',
                    background: active ? '#ffcc00' : 'transparent',
                    color: active ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: active ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  <span style={{ display: 'flex' }}>
                    <IconComponent />
                  </span>
                  {Boolean(item.badge) && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: active ? '#0f172a' : '#ffcc00',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Sidebar Copyright */}
        {!isSidebarCollapsed && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #f1f5f9',
              fontSize: '11px',
              color: '#94a3b8',
              textAlign: 'center',
              marginTop: 'auto',
              background: '#ffffff',
            }}
          >
            <div>© {new Date().getFullYear()} <strong>Zwantum</strong></div>
            <div style={{ marginTop: '3px', color: '#64748b' }}>
              Powered by <strong style={{ color: '#0f172a' }}>Zwantum</strong>
            </div>
          </div>
        )}
      </aside>
      )}

      {/* 2. MAIN WORKSPACE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        <main style={{ flex: 1, padding: hideSidebar ? '24px 28px' : '32px', overflowY: 'visible', minHeight: 0 }}>
          {activeView === 'overview' && (
            <BlogOverview
              client={client}
              onNavigateToPosts={() => changeView('posts')}
              onNavigateToNewPost={() => changeView('new-post')}
              onNavigateToEditPost={(id) => changeView('edit-post', id)}
            />
          )}

          {activeView === 'posts' && (
            <PostList
              client={client}
              onNavigateToNewPost={() => changeView('new-post')}
              onNavigateToEditPost={(id) => changeView('edit-post', id)}
            />
          )}

          {activeView === 'new-post' && (
            <PostEditor
              client={client}
              onBack={() => changeView('posts')}
              onSaveSuccess={(saved) => {
                if (saved?.id) {
                  changeView('edit-post', saved.id);
                }
              }}
              onOpenMediaLibrary={(onSelect) => {
                setMediaPickerSelectCallback(() => onSelect);
                setShowMediaPickerModal(true);
              }}
            />
          )}

          {activeView === 'edit-post' && (
            <PostEditor
              client={client}
              postId={editingPostId}
              onBack={() => changeView('posts')}
              onSaveSuccess={() => {
                // Do not redirect; keep user on the edit page
              }}
              onOpenMediaLibrary={(onSelect) => {
                setMediaPickerSelectCallback(() => onSelect);
                setShowMediaPickerModal(true);
              }}
            />
          )}

          {activeView === 'categories' && <CategoryManager client={client} />}

          {activeView === 'tags' && <TagManager client={client} />}

          {activeView === 'authors' && <AuthorManager client={client} />}

          {activeView === 'media' && isMediaEnabled && <MediaLibrary client={client} />}

          {activeView === 'comments' && <CommentManager client={client} />}

          {activeView === 'settings' && (
            <BlogSettingsView
              client={client}
              onSettingsUpdated={(newSettings) => setSettings(newSettings)}
            />
          )}
        </main>

        {/* Main Workspace Copyright Footer */}
        {!hideSidebar && (
          <footer
            style={{
              padding: '14px 32px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '12px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span>© {new Date().getFullYear()} Zwantum. All rights reserved.</span>
            <span style={{ fontWeight: 500, color: '#475569' }}>
              Powered by <strong style={{ color: '#0f172a' }}>Zwantum</strong>
            </span>
          </footer>
        )}
      </div>

      {/* Media Picker Modal Dialog */}
      {showMediaPickerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMediaPickerModal(false);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '980px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  Media Library
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Select an existing image from Supabase storage or upload a new one
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMediaPickerModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <MediaLibrary
                client={client}
                onSelectMedia={(media) => {
                  mediaPickerSelectCallback?.(media);
                  setShowMediaPickerModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
