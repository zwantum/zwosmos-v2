import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, FileText, Database, LogOut } from 'lucide-react';
import BlogsManager from './BlogsManager';
import FactsManager from './FactsManager';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'blogs' | 'facts'>('blogs');

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: 'var(--bg-dark-purple)', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard size={24} /> Admin
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <button
            onClick={() => setActiveTab('blogs')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 15px',
              background: activeTab === 'blogs' ? 'var(--brand-purple)' : 'transparent',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '1rem',
              transition: 'background 0.2s'
            }}
          >
            <FileText size={20} /> Blogs
          </button>
          
          <button
            onClick={() => setActiveTab('facts')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 15px',
              background: activeTab === 'facts' ? 'var(--brand-purple)' : 'transparent',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '1rem',
              transition: 'background 0.2s'
            }}
          >
            <Database size={20} /> Facts
          </button>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 15px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '5px',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '1rem',
            marginTop: 'auto'
          }}
        >
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <h1 style={{ marginBottom: '30px', fontSize: '2rem' }}>
          {activeTab === 'blogs' ? 'Manage Blogs' : 'Manage Facts'}
        </h1>
        
        {activeTab === 'blogs' && <BlogsManager />}
        {activeTab === 'facts' && <FactsManager />}
      </div>
    </div>
  );
}
