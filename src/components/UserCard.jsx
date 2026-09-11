import React, { useState } from 'react';
import { Send, MessageCircle, Share2, Check, Sparkles } from 'lucide-react';
import UserAvatar from './UserAvatar';

export default function UserCard({ user, onSendMessage }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}?u=${user.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="glass-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'relative'
      }}
    >
      <div>
        {/* Top bar: Avatar + Availability Status + Share */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <UserAvatar 
              name={user.display_name} 
              username={user.username} 
              size={64} 
              fontSize={22} 
              borderRadius="var(--radius-md)" 
            />
            {user.is_available ? (
              <div 
                title="Available for messages"
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span className="badge-pulse" />
                <span style={{ fontSize: '0.65rem', color: '#6ee7b7', fontWeight: 600 }}>Active</span>
              </div>
            ) : (
              <div 
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: 'rgba(148, 163, 184, 0.2)',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 8px'
                }}
              >
                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Away</span>
              </div>
            )}
          </div>

          <button
            onClick={handleCopyLink}
            title="Copy profile link"
            className="btn-ghost"
            style={{ borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '0.75rem', gap: 4 }}
          >
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Share2 size={14} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        {/* User Identity Info */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>
          {user.display_name}
        </h3>
        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          @{user.username}
        </div>

        {user.bio && (
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: 16
          }}>
            {user.bio}
          </p>
        )}

        {/* User's Message Prompt (Call-out box) */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: 20,
          position: 'relative'
        }}>
          <div style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#c4b5fd',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 4
          }}>
            <Sparkles size={12} color="#a78bfa" />
            Prompt
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#ffffff',
            fontWeight: 500,
            fontStyle: 'italic',
            lineHeight: 1.4
          }}>
            &ldquo;{user.prompt || 'Send me an anonymous note!'}&rdquo;
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 14,
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <MessageCircle size={14} />
          <span>{user.received_count || 0} messages received</span>
        </div>

        <button
          onClick={() => onSendMessage(user)}
          disabled={!user.is_available}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Send size={14} />
          Send Message
        </button>
      </div>
    </div>
  );
}
