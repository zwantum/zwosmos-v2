import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Auth from './Auth';
import AdminDashboard from './AdminDashboard';

export default function AdminApp() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'white' }}>Loading Admin...</div>;
  }

  // If supabase is not configured yet, just show a message.
  if (!supabase) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'white' }}>
        <h2>Supabase Not Configured</h2>
        <p>Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.</p>
      </div>
    );
  }

  return (
    <div className="admin-app" style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'white', fontFamily: "'Inter', sans-serif" }}>
      <Routes>
        <Route path="/" element={session ? <AdminDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
