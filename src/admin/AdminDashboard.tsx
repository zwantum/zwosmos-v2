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
  ChevronRight
} from 'lucide-react';
import BlogsManager from './BlogsManager';
import FactsManager from './FactsManager';
import BooksManager from './BooksManager';
import SettingsManager from './SettingsManager';
import { PushNotificationContainer } from './PushNotification';
import './Admin.css';

type AdminTab = 'blogs' | 'facts' | 'books' | 'settings';
const VALID_TABS: AdminTab[] = ['blogs', 'facts', 'books', 'settings'];

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

  const [activeTab, setActiveTabState] = useState<AdminTab>(getInitialTab);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('zwosmos_admin_tab', tab);
    } catch {}
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  };

  // Keep URL search params and tab state synchronized
  useEffect(() => {
    const urlTab = searchParams.get('tab') as AdminTab;
    if (urlTab && VALID_TABS.includes(urlTab)) {
      if (urlTab !== activeTab) {
        setActiveTabState(urlTab);
        try {
          localStorage.setItem('zwosmos_admin_tab', urlTab);
        } catch {}
      }
    } else {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', activeTab);
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const navItems = [
    { key: 'blogs' as AdminTab, label: 'Blogs', icon: FileText },
    { key: 'facts' as AdminTab, label: 'Facts', icon: Database },
    { key: 'books' as AdminTab, label: 'Books', icon: BookOpen },
    { key: 'settings' as AdminTab, label: 'Settings', icon: SettingsIcon },
  ];

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
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, alignItems: isCollapsed ? 'center' : 'stretch' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTabChange(item.key)}
                title={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? '0px' : '12px',
                  padding: isCollapsed ? '10px 0' : '10px 14px',
                  width: isCollapsed ? '46px' : '100%',
                  height: isCollapsed ? '46px' : 'auto',
                  background: isActive ? '#ffcc00' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#0f172a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                <Icon size={20} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
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

        {activeTab === 'blogs' && <BlogsManager />}
        {activeTab === 'books' && <BooksManager />}
        {activeTab === 'settings' && <SettingsManager />}
      </main>
    </div>
  );
}
