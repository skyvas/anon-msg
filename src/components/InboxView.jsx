import React, { useState, useEffect, useMemo } from 'react';
import { 
  Inbox, 
  VenetianMask, 
  User, 
  Star, 
  Trash2, 
  Share2, 
  Sparkles,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import ShareCardModal from './ShareCardModal';

export default function InboxView({ currentUser, onUpdateUnreadCount }) {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, anonymous_count: 0, named_count: 0, anonymous_ratio: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, anon, named, starred
  const [shareMessage, setShareMessage] = useState(null);
  const [copiedProfile, setCopiedProfile] = useState(false);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('anon_token');
      const res = await fetch('/api/messages/inbox', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setStats(data.stats || {});
        if (onUpdateUnreadCount) {
          onUpdateUnreadCount(data.stats?.unread || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleToggleRead = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('anon_token');
      const res = await fetch(`/api/messages/inbox/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_read: !currentStatus })
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: !currentStatus } : m));
        setStats(prev => {
          const newUnread = !currentStatus ? Math.max(0, prev.unread - 1) : prev.unread + 1;
          if (onUpdateUnreadCount) onUpdateUnreadCount(newUnread);
          return { ...prev, unread: newUnread };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const token = localStorage.getItem('anon_token');
      const res = await fetch(`/api/messages/inbox/${id}/favorite`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, is_favorite: !m.is_favorite } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      const token = localStorage.getItem('anon_token');
      const res = await fetch(`/api/messages/inbox/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const deletedMsg = messages.find(m => m.id === id);
        setMessages(prev => prev.filter(m => m.id !== id));
        setStats(prev => {
          const newTotal = prev.total - 1;
          const newUnread = (deletedMsg && !deletedMsg.is_read) ? Math.max(0, prev.unread - 1) : prev.unread;
          const newAnon = (deletedMsg && deletedMsg.is_anonymous) ? prev.anonymous_count - 1 : prev.anonymous_count;
          const newNamed = (deletedMsg && !deletedMsg.is_anonymous) ? prev.named_count - 1 : prev.named_count;
          if (onUpdateUnreadCount) onUpdateUnreadCount(newUnread);
          return {
            total: newTotal,
            unread: newUnread,
            anonymous_count: newAnon,
            named_count: newNamed,
            anonymous_ratio: newTotal > 0 ? Math.round((newAnon / newTotal) * 100) : 0
          };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyProfileLink = () => {
    const url = `${window.location.origin}?u=${currentUser?.username || ''}`;
    navigator.clipboard.writeText(url);
    setCopiedProfile(true);
    setTimeout(() => setCopiedProfile(false), 2000);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (activeFilter === 'anon' && !m.is_anonymous) return false;
      if (activeFilter === 'named' && m.is_anonymous) return false;
      if (activeFilter === 'starred' && !m.is_favorite) return false;
      return true;
    });
  }, [messages, activeFilter]);

  return (
    <div style={{ padding: '20px 16px 36px 16px' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Your Inbox
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            @{currentUser?.username} • {stats.total || 0} messages received
          </div>
        </div>

        <button
          onClick={handleCopyProfileLink}
          className="btn-secondary"
          style={{
            fontSize: '0.78rem',
            padding: '7px 12px',
            borderRadius: 'var(--radius-full)',
            gap: 5
          }}
        >
          <Share2 size={13} color="var(--primary)" />
          {copiedProfile ? 'Copied' : 'My Link'}
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 20
      }}>
        <div className="clean-card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Unread
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: stats.unread > 0 ? 'var(--accent-pink)' : '#fff' }}>
            {stats.unread || 0}
          </div>
        </div>

        <div className="clean-card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Anonymous
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c4b5fd' }}>
            {stats.anonymous_count || 0}
          </div>
        </div>

        <div className="clean-card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Named
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#6ee7b7' }}>
            {stats.named_count || 0}
          </div>
        </div>
      </div>

      {/* Filter Row with SVG Icons (Zero Emojis) */}
      <div className="no-scrollbar" style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        marginBottom: 16,
        paddingBottom: 2
      }}>
        {[
          { id: 'all', label: `All (${messages.length})`, icon: Inbox },
          { id: 'anon', label: `Anonymous (${stats.anonymous_count || 0})`, icon: VenetianMask },
          { id: 'named', label: `Named (${stats.named_count || 0})`, icon: User },
          { id: 'starred', label: `Starred`, icon: Star }
        ].map(f => {
          const Icon = f.icon;
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 13px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: isActive ? 'var(--primary-gradient)' : 'var(--bg-card)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={13} />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Stream */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
          Loading inbox...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="clean-card" style={{ textAlign: 'center', padding: '44px 18px' }}>
          <Inbox size={38} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <h4 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: 6 }}>
            No messages yet
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 18, lineHeight: 1.5 }}>
            Share your link with friends or post it to your social bio to start receiving anonymous notes.
          </p>
          <button onClick={handleCopyProfileLink} className="btn-primary" style={{ width: 'auto', margin: '0 auto', padding: '10px 20px', fontSize: '0.85rem' }}>
            <Share2 size={15} />
            Copy Profile Link
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredMessages.map(msg => (
            <div
              key={msg.id}
              className="clean-card"
              style={{
                padding: '16px 18px',
                borderLeft: !msg.is_read ? '3.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                background: !msg.is_read ? '#1a1b26' : 'var(--bg-card)'
              }}
            >
              {/* Header: Sender Badge + Relative Time */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {msg.is_anonymous ? (
                    <span className="badge-anon">
                      <VenetianMask size={13} />
                      Anonymous Note
                    </span>
                  ) : (
                    <span className="badge-named">
                      <User size={13} />
                      From: {msg.sender_name || 'Named Sender'}
                    </span>
                  )}

                  {!msg.is_read && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--accent-pink)',
                      background: 'rgba(244, 63, 94, 0.15)',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      New
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <Clock size={11} />
                  <span>{formatTime(msg.created_at)}</span>
                </div>
              </div>

              {/* Message Content */}
              <p style={{
                fontSize: '0.98rem',
                color: '#ffffff',
                lineHeight: 1.55,
                marginBottom: 14,
                wordBreak: 'break-word',
                fontWeight: 400
              }}>
                {msg.content}
              </p>

              {/* Action Toolbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleToggleRead(msg.id, msg.is_read)}
                    className="btn-ghost"
                    style={{ padding: '5px 8px', fontSize: '0.75rem', gap: 5 }}
                    title={msg.is_read ? 'Mark Unread' : 'Mark Read'}
                  >
                    {msg.is_read ? <EyeOff size={14} /> : <Eye size={14} color="var(--primary)" />}
                    <span>{msg.is_read ? 'Unread' : 'Read'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleFavorite(msg.id)}
                    className="btn-ghost"
                    style={{
                      padding: '5px 8px',
                      fontSize: '0.75rem',
                      gap: 5,
                      color: msg.is_favorite ? 'var(--accent-amber)' : 'inherit'
                    }}
                    title="Star message"
                  >
                    <Star size={14} fill={msg.is_favorite ? 'var(--accent-amber)' : 'none'} />
                    <span>{msg.is_favorite ? 'Starred' : 'Star'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setShareMessage(msg)}
                    className="btn-ghost"
                    style={{
                      padding: '5px 9px',
                      fontSize: '0.75rem',
                      background: 'rgba(139, 92, 246, 0.12)',
                      color: '#c4b5fd',
                      borderRadius: 'var(--radius-xs)',
                      gap: 5
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Story Card</span>
                  </button>

                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="btn-ghost"
                    style={{ padding: '5px 8px', color: '#ef4444' }}
                    title="Delete message"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Story Card Export Modal */}
      {shareMessage && (
        <ShareCardModal
          message={shareMessage}
          currentUser={currentUser}
          onClose={() => setShareMessage(null)}
        />
      )}
    </div>
  );
}
