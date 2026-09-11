import React, { useState } from 'react';
import { X, Save, Sparkles, Check, User } from 'lucide-react';
import UserAvatar from './UserAvatar';

export default function ProfileSettingsModal({ currentUser, onClose, onProfileUpdated }) {
  const [prompt, setPrompt] = useState(currentUser?.prompt || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [isAvailable, setIsAvailable] = useState(Boolean(currentUser?.is_available));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('anon_token');
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          bio: bio.trim(),
          is_available: isAvailable
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      onProfileUpdated(data.user);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
            Profile &amp; Prompt Settings
          </h3>
          <button onClick={onClose} className="btn-ghost" style={{ borderRadius: '50%', padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* User Identity Preview with Initials Badge */}
        <div style={{
          padding: '16px 24px 0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <UserAvatar
            name={currentUser?.display_name}
            username={currentUser?.username}
            size={48}
          />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              {currentUser?.display_name}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              @{currentUser?.username}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ padding: '20px 24px 24px 24px' }}>
          {/* Prompt Field */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Public Question Prompt
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {prompt.length} / 120
              </span>
            </div>
            <input
              type="text"
              className="form-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Ask me anything or share an honest confession..."
              maxLength={120}
              required
            />
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 4 }}>
              This question prompt appears prominently on your public profile card.
            </div>
          </div>

          {/* Bio Field */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                About You / Bio
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {bio.length} / 200
              </span>
            </div>
            <textarea
              className="form-textarea"
              style={{ minHeight: 90, fontSize: '0.875rem' }}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell visitors a little about yourself, your work, or topics you like chatting about..."
              maxLength={200}
            />
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 4 }}>
              A brief intro shown to visitors when they view your profile.
            </div>
          </div>

          {/* Availability Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20
          }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                Accepting Messages
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                When toggled off, visitors cannot send you new messages.
              </div>
            </div>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saved ? (
                <>
                  <Check size={16} color="var(--accent-emerald)" />
                  Saved!
                </>
              ) : (
                <>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Settings'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
