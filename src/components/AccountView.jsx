import React, { useState } from 'react';
import { User, Settings, LogOut, Share2, Check, Sparkles, LogIn, UserPlus, Shield, Lock } from 'lucide-react';
import UserAvatar from './UserAvatar';

export default function AccountView({
  currentUser,
  onOpenSettings,
  onLogout,
  onOpenAuth
}) {
  const [copied, setCopied] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCopyLink = () => {
    if (!currentUser) return;
    const url = `${window.location.origin}?u=${currentUser.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInlineAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (authTab === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = authTab === 'login'
      ? { username: username.trim(), password }
      : {
          username: username.trim(),
          display_name: displayName.trim() || username.trim(),
          password,
          prompt: prompt.trim() || 'Send me an anonymous note'
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('anon_token', data.token);
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Logged Out View — Clean In-Page Sign In & Create Account
  if (!currentUser) {
    return (
      <div style={{ padding: '24px 16px 40px 16px' }}>
        <div className="clean-card" style={{ padding: '24px 20px', marginBottom: 20 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <User size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              Account &amp; Inbox
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Sign in to view messages sent to you or claim your custom profile handle.
            </p>
          </div>

          {/* Segmented Auth Mode Switch */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            background: 'var(--bg-app)',
            padding: 3,
            borderRadius: 'var(--radius-sm)',
            marginBottom: 18
          }}>
            <button
              type="button"
              onClick={() => { setAuthTab('login'); setError(''); }}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: authTab === 'login' ? 'var(--primary-gradient)' : 'transparent',
                color: authTab === 'login' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('register'); setError(''); }}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: authTab === 'register' ? 'var(--primary-gradient)' : 'transparent',
                color: authTab === 'register' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleInlineAuth}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. jordan_craft"
                className="clean-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {authTab === 'register' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jordan Craft"
                    className="clean-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    Public Question Prompt
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Send me an honest question or thought"
                    className="clean-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                Password {authTab === 'register' && '(min 8 characters)'}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="clean-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.825rem',
                marginBottom: 16
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary">
              {authTab === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              <span>{loading ? 'Processing...' : (authTab === 'login' ? 'Sign In' : 'Create Account')}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Logged In Profile View
  return (
    <div style={{ padding: '20px 16px 36px 16px' }}>
      <div className="clean-card" style={{ padding: '24px 20px', textAlign: 'center', marginBottom: 16 }}>
        <UserAvatar
          name={currentUser.display_name}
          username={currentUser.username}
          size={76}
          fontSize={26}
          style={{ margin: '0 auto 12px auto' }}
        />
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: 2 }}>
          {currentUser.display_name}
        </h3>
        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: currentUser.bio ? 10 : 18 }}>
          @{currentUser.username}
        </div>

        {/* Bio Section */}
        {currentUser.bio && (
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: 18,
            lineHeight: 1.5,
            maxWidth: 360,
            margin: '0 auto 18px auto'
          }}>
            {currentUser.bio}
          </p>
        )}

        {/* Current Prompt Box */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: 18,
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#c4b5fd', marginBottom: 4 }}>
            Your Active Prompt
          </div>
          <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 500 }}>
            &ldquo;{currentUser.prompt || 'Send me an anonymous note'}&rdquo;
          </div>
        </div>

        <button onClick={handleCopyLink} className="btn-secondary" style={{ width: '100%', fontSize: '0.875rem' }}>
          {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Share2 size={16} />}
          <span>{copied ? 'Link Copied to Clipboard' : 'Copy My Profile Link'}</span>
        </button>
      </div>

      {/* Action List */}
      <div className="clean-card" style={{ padding: '6px 8px' }}>
        <button
          onClick={onOpenSettings}
          className="btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            padding: '14px 14px',
            fontSize: '0.9rem',
            color: '#fff',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={18} color="var(--text-muted)" />
            <span>Edit Prompt &amp; Bio</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>›</span>
        </button>

        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 8px' }} />

        <button
          onClick={onLogout}
          className="btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            padding: '14px 14px',
            fontSize: '0.9rem',
            color: '#ef4444',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>›</span>
        </button>
      </div>
    </div>
  );
}
