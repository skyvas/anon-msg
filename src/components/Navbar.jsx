import React from 'react';
import { MessageSquare, Inbox, User, LogOut, Sparkles, LogIn, UserPlus, Settings } from 'lucide-react';
import UserAvatar from './UserAvatar';

export default function Navbar({
  currentView,
  setCurrentView,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenSettings,
  unreadCount = 0
}) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Brand */}
        <div 
          onClick={() => setCurrentView('directory')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)'
          }}>
            <MessageSquare size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(to right, #ffffff, #c4b5fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }} className="brand-font">
              AnonMsg
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Anonymous &amp; Named Social Notes
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setCurrentView('directory')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: currentView === 'directory' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: currentView === 'directory' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={16} color={currentView === 'directory' ? 'var(--primary)' : 'currentColor'} />
            Explore Users
          </button>

          {currentUser && (
            <button
              onClick={() => setCurrentView('inbox')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: currentView === 'inbox' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                color: currentView === 'inbox' ? '#c4b5fd' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <Inbox size={16} color={currentView === 'inbox' ? '#c4b5fd' : 'currentColor'} />
              My Inbox
              {unreadCount > 0 && (
                <span style={{
                  background: 'var(--accent-pink)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  lineHeight: 1
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Right Section: Auth or User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div 
                onClick={() => setCurrentView('inbox')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 10px 4px 4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <UserAvatar 
                  name={currentUser.display_name} 
                  username={currentUser.username} 
                  size={28} 
                  fontSize={12} 
                />
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#fff' }}>
                    {currentUser.display_name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    @{currentUser.username}
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenSettings}
                title="Profile Settings & Prompt"
                className="btn-ghost"
                style={{ borderRadius: '50%', width: 34, height: 34, padding: 0 }}
              >
                <Settings size={16} />
              </button>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="btn-ghost"
                style={{ borderRadius: '50%', width: 34, height: 34, padding: 0 }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => onOpenAuth('login')}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <LogIn size={15} />
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <UserPlus size={15} />
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
