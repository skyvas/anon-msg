import React from 'react';
import { Send, Inbox, User } from 'lucide-react';

export default function BottomNav({ currentView, setCurrentView, unreadCount = 0, currentUser, onOpenAuth }) {
  return (
    <nav className="bottom-nav">
      {/* Send Note Tab */}
      <button
        onClick={() => setCurrentView('send')}
        className={`nav-tab-btn ${currentView === 'send' ? 'active' : ''}`}
      >
        <Send size={20} />
        <span>Send Note</span>
      </button>

      {/* Inbox Tab */}
      <button
        onClick={() => {
          if (!currentUser) {
            onOpenAuth('login');
          } else {
            setCurrentView('inbox');
          }
        }}
        className={`nav-tab-btn ${currentView === 'inbox' ? 'active' : ''}`}
      >
        <div style={{ position: 'relative' }}>
          <Inbox size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -8,
              background: 'var(--accent-pink)',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 'var(--radius-full)',
              lineHeight: 1.2
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <span>Inbox</span>
      </button>

      {/* Account / Profile Tab */}
      <button
        onClick={() => {
          if (!currentUser) {
            onOpenAuth('login');
          } else {
            setCurrentView('profile');
          }
        }}
        className={`nav-tab-btn ${currentView === 'profile' ? 'active' : ''}`}
      >
        <User size={20} />
        <span>{currentUser ? 'Profile' : 'Account'}</span>
      </button>
    </nav>
  );
}
