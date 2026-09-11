import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import SendScreen from './components/SendScreen';
import InboxView from './components/InboxView';
import AccountView from './components/AccountView';
import AuthModal from './components/AuthModal';
import ProfileSettingsModal from './components/ProfileSettingsModal';

export default function App() {
  const [currentView, setCurrentView] = useState('send'); // 'send', 'inbox', 'profile'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authModal, setAuthModal] = useState(null); // null, 'login', 'register'
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch users
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  // Check authenticated session
  const checkAuth = async () => {
    const token = localStorage.getItem('anon_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        // Also fetch initial unread count
        const inboxRes = await fetch('/api/messages/inbox', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const inboxData = await inboxRes.json();
        if (inboxRes.ok) {
          setUnreadCount(inboxData.stats?.unread || 0);
        }
      } else {
        localStorage.removeItem('anon_token');
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Session check failed:', err);
    }
  };

  useEffect(() => {
    loadUsers();
    checkAuth();

    // Direct link support: ?u=username
    const urlParams = new URLSearchParams(window.location.search);
    const targetHandle = urlParams.get('u');
    if (targetHandle) {
      fetch(`/api/users/${targetHandle}`)
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setSelectedUser(d.user);
            setCurrentView('send');
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('anon_token');
    setCurrentUser(null);
    setCurrentView('send');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('inbox');
    loadUsers();
  };

  return (
    <div className="app-container">
      {/* 1. Minimal Top Header */}
      <Header
        currentUser={currentUser}
        onOpenAuth={(mode) => setAuthModal(mode)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* 2. Main Scrollable Screen Body */}
      <main style={{ flex: 1, paddingBottom: 10 }}>
        {currentView === 'send' && (
          <SendScreen
            users={users}
            selectedUser={selectedUser}
            onSelectUser={(u) => setSelectedUser(u)}
            onMessageSent={() => loadUsers()}
          />
        )}

        {currentView === 'inbox' && (
          <InboxView
            currentUser={currentUser}
            onUpdateUnreadCount={(count) => setUnreadCount(count)}
          />
        )}

        {currentView === 'profile' && (
          <AccountView
            currentUser={currentUser}
            onOpenSettings={() => setSettingsModalOpen(true)}
            onLogout={handleLogout}
            onOpenAuth={(mode) => setAuthModal(mode)}
          />
        )}
      </main>

      {/* 3. Native iOS Bottom Tab Bar */}
      <BottomNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        unreadCount={unreadCount}
        currentUser={currentUser}
        onOpenAuth={(mode) => setAuthModal(mode)}
      />

      {/* Auth Bottom Sheet Modal */}
      {authModal && (
        <AuthModal
          initialMode={authModal}
          onClose={() => setAuthModal(null)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Profile Settings Sheet Modal */}
      {settingsModalOpen && (
        <ProfileSettingsModal
          currentUser={currentUser}
          onClose={() => setSettingsModalOpen(false)}
          onProfileUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}
