import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, FileText, Database, BookOpen, Settings as SettingsIcon, LogOut } from 'lucide-react';
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

  return (
    <div
      className="admin-dashboard"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <PushNotificationContainer />
      {/* Sidebar - Matching Light Blog Theme */}
      <aside
        style={{
          width: '240px',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '28px', paddingLeft: '6px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#ffcc00',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255, 204, 0, 0.4)',
            }}
          >
            <LayoutDashboard size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Admin
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: 400 }}>
              Zwosmos Portal
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <button
            onClick={() => handleTabChange('blogs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              background: activeTab === 'blogs' ? '#ffcc00' : 'transparent',
              color: activeTab === 'blogs' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: activeTab === 'blogs' ? 600 : 500,
              boxShadow: activeTab === 'blogs' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'blogs') {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#0f172a';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'blogs') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            <FileText size={18} />
            <span>Blogs</span>
          </button>

          <button
            onClick={() => handleTabChange('facts')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              background: activeTab === 'facts' ? '#ffcc00' : 'transparent',
              color: activeTab === 'facts' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: activeTab === 'facts' ? 600 : 500,
              boxShadow: activeTab === 'facts' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease'
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
            <Database size={18} />
            <span>Facts</span>
          </button>

          <button
            onClick={() => handleTabChange('books')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              background: activeTab === 'books' ? '#ffcc00' : 'transparent',
              color: activeTab === 'books' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: activeTab === 'books' ? 600 : 500,
              boxShadow: activeTab === 'books' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease'
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
            <BookOpen size={18} />
            <span>Books</span>
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              background: activeTab === 'settings' ? '#ffcc00' : 'transparent',
              color: activeTab === 'settings' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: activeTab === 'settings' ? 600 : 500,
              boxShadow: activeTab === 'settings' ? '0 2px 8px rgba(255, 204, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease'
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
            <SettingsIcon size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            color: '#64748b',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: 500,
            marginTop: 'auto',
            transition: 'all 0.15s ease'
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
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          padding: '24px 28px',
          overflowY: 'auto',
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
