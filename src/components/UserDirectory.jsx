import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Filter, Users } from 'lucide-react';
import UserTabs from './UserTabs';
import UserCard from './UserCard';

export default function UserDirectory({ users, onSelectUserForMessage, loading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTabUserId, setSelectedTabUserId] = useState(null);

  // Filter users based on search and selected tab
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Tab filter
      if (selectedTabUserId !== null && user.id !== selectedTabUserId) {
        return false;
      }
      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        user.username.toLowerCase().includes(q) ||
        user.display_name.toLowerCase().includes(q) ||
        (user.bio && user.bio.toLowerCase().includes(q)) ||
        (user.prompt && user.prompt.toLowerCase().includes(q))
      );
    });
  }, [users, selectedTabUserId, searchQuery]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px 80px 20px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: 40, position: 'relative' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(139, 92, 246, 0.12)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: '#c4b5fd',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: 16
        }}>
          <Sparkles size={14} color="#a78bfa" />
          <span>Next-Gen Anonymous Social Inbox</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #ffffff 30%, #c4b5fd 70%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Speak your mind freely.<br />Anonymous or by name.
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          color: 'var(--text-secondary)',
          maxWidth: 620,
          margin: '0 auto 30px auto',
          lineHeight: 1.6
        }}>
          Select any available member below to send an honest question, private confession, or warm compliment. 
          You stay in control of whether to stay anonymous or sign your note.
        </p>

        {/* Search Bar */}
        <div style={{
          maxWidth: 480,
          margin: '0 auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search 
            size={18} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: 16, pointerEvents: 'none' }} 
          />
          <input
            type="text"
            placeholder="Search by name, handle, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 46, borderRadius: 'var(--radius-full)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn-ghost"
              style={{ position: 'absolute', right: 12, padding: 4, fontSize: '0.75rem' }}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Profile Tabs Bar */}
      <section style={{ marginBottom: 30 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12
        }}>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Users size={14} />
            Available Members
          </div>
          {selectedTabUserId !== null && (
            <button
              onClick={() => setSelectedTabUserId(null)}
              className="btn-ghost"
              style={{ fontSize: '0.8rem', color: '#c4b5fd' }}
            >
              View all ({users.length})
            </button>
          )}
        </div>

        <UserTabs
          users={users}
          selectedUserId={selectedTabUserId}
          onSelectUser={(userId) => setSelectedTabUserId(userId)}
        />
      </section>

      {/* User Profiles Grid */}
      <section>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading available profiles...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Users size={40} color="var(--text-muted)" style={{ marginBottom: 14 }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>No profiles matched your filter</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              Try searching with different terms or reset your tab selection.
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedTabUserId(null); }}
              className="btn-secondary"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="user-grid">
            {filteredUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onSendMessage={onSelectUserForMessage}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
