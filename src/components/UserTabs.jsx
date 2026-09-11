import React from 'react';
import { Users } from 'lucide-react';
import UserAvatar from './UserAvatar';

export default function UserTabs({ users, selectedUserId, onSelectUser }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      overflowX: 'auto',
      padding: '4px 2px 14px 2px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {/* "All Profiles" tab */}
      <button
        onClick={() => onSelectUser(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          background: selectedUserId === null 
            ? 'var(--primary-gradient)' 
            : 'rgba(255, 255, 255, 0.05)',
          color: selectedUserId === null ? '#ffffff' : 'var(--text-secondary)',
          border: selectedUserId === null 
            ? 'none' 
            : '1px solid var(--border-subtle)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontSize: '0.85rem',
          fontWeight: 600,
          transition: 'all 0.2s ease',
          boxShadow: selectedUserId === null ? '0 4px 14px var(--primary-glow)' : 'none'
        }}
      >
        <Users size={15} />
        All Members ({users.length})
      </button>

      {/* Individual User Tabs */}
      {users.map(user => {
        const isSelected = selectedUserId === user.id;
        return (
          <button
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px 6px 8px',
              borderRadius: 'var(--radius-full)',
              background: isSelected 
                ? 'var(--primary-gradient)' 
                : 'rgba(255, 255, 255, 0.05)',
              color: isSelected ? '#ffffff' : 'var(--text-secondary)',
              border: isSelected 
                ? 'none' 
                : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? '0 4px 14px var(--primary-glow)' : 'none'
            }}
          >
            <div style={{ position: 'relative' }}>
              <UserAvatar
                name={user.display_name}
                username={user.username}
                size={24}
                fontSize={10}
              />
              {user.is_available ? (
                <span style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-emerald)',
                  border: '1px solid var(--bg-main)'
                }} />
              ) : null}
            </div>
            <span>{user.display_name}</span>
            <span style={{
              fontSize: '0.75rem',
              opacity: isSelected ? 0.9 : 0.6
            }}>
              @{user.username}
            </span>
          </button>
        );
      })}
    </div>
  );
}
