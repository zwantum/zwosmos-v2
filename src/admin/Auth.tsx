import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import './Auth.css';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        {/* Header with Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="/assets/icons/Zwosmos_Favicon.svg"
            alt="Zwosmos"
            style={{
              width: '46px',
              height: '46px',
              marginBottom: '14px',
              filter: 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.95))',
              display: 'inline-block'
            }}
          />
          <h2
            style={{
              margin: '0 0 6px 0',
              color: '#ffffff',
              fontSize: '1.65rem',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}
          >
            Zwosmos Admin
          </h2>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.88rem' }}>
            Enter credentials to manage blogs & facts
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#fca5a5',
              padding: '11px 14px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.86rem',
              lineHeight: 1.4,
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email Field */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: 500
              }}
            >
              <Mail size={15} color="#c084fc" /> Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="admin-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@zwosmos.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field with Eye Toggle */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: 500
              }}
            >
              <Lock size={15} color="#c084fc" /> Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="admin-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2.2} /> : <Eye size={18} strokeWidth={2.2} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="admin-submit-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
