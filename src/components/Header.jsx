import React from 'react';
import { Settings, LogIn } from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import UserAvatar from './UserAvatar';

export default function Header({ currentUser, onOpenAuth, onOpenSettings }) {
  return (
    <header style={{
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(12, 13, 18, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Brand with Animated Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AnimatedLogo size={32} animated={true} />
        <span style={{
          fontSize: '1.2rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(to right, #ffffff, #c4b5fd)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          AnonMsg
        </span>
      </div>

      {/* Right User Action */}
      {currentUser ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '3px 9px 3px 4px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)'
          }}>
            <UserAvatar
              name={currentUser.display_name}
              username={currentUser.username}
              size={22}
              fontSize={10}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
              @{currentUser.username}
            </span>
          </div>

          <button
            onClick={onOpenSettings}
            className="btn-ghost"
            title="Settings"
            style={{ padding: 6, borderRadius: '50%' }}
          >
            <Settings size={17} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => onOpenAuth('login')}
          className="btn-secondary"
          style={{ padding: '6px 14px', fontSize: '0.825rem', borderRadius: 'var(--radius-full)', gap: 6 }}
        >
          <LogIn size={14} />
          Sign In
        </button>
      )}
    </header>
  );
}
