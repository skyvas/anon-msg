import React, { useState, useEffect, useRef } from 'react';
import { VenetianMask, User, Send, Check, Sparkles, Share2, ShieldCheck, ChevronDown, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import AnimatedLogo from './AnimatedLogo';
import UserAvatar from './UserAvatar';

export default function SendScreen({ users, selectedUser, onSelectUser, onMessageSent }) {
  const [activeUser, setActiveUser] = useState(selectedUser || null);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true); // DEFAULT IS ANONYMOUS
  const [senderName, setSenderName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const membersRef = useRef(null);

  // Sync active user only if explicitly selected (no default user selected on initial visit)
  useEffect(() => {
    if (selectedUser) {
      setActiveUser(selectedUser);
    }
  }, [selectedUser]);

  const handleScrollToMembers = () => {
    if (membersRef.current) {
      membersRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelect = (user) => {
    setActiveUser(user);
    onSelectUser(user);
    setSentSuccess(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeUser) return;

    if (!content.trim()) {
      setError('Please enter a message before sending.');
      return;
    }

    if (!isAnonymous && !senderName.trim()) {
      setError('Please enter your name or choose to remain anonymous.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        recipient_id: activeUser.id,
        content: content.trim(),
        is_anonymous: isAnonymous,
        sender_name: isAnonymous ? null : senderName.trim()
      };

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      // Celebratory particle burst
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981']
      });

      setSentSuccess(true);
      if (onMessageSent) onMessageSent();
    } catch (err) {
      setError(err.message || 'Error delivering message.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setContent('');
    setIsAnonymous(true);
    setSenderName('');
    setSentSuccess(false);
    setError('');
  };

  const handleCopyLink = () => {
    if (!activeUser) return;
    const url = `${window.location.origin}?u=${activeUser.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ paddingBottom: 30 }}>
      {/* 1. Animated Hero Section with Logo & Scroll Down Trigger */}
      <section style={{
        textAlign: 'center',
        padding: '36px 20px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.12) 0%, transparent 70%)'
      }}>
        {/* Signature Animated SVG Logo */}
        <div style={{ marginBottom: 18 }}>
          <AnimatedLogo size={76} animated={true} />
        </div>

        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          marginBottom: 10,
          background: 'linear-gradient(135deg, #ffffff 40%, #c4b5fd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Real Feedback.<br />Total Privacy.
        </h1>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          maxWidth: 320,
          lineHeight: 1.5,
          marginBottom: 24
        }}>
          Send anonymous questions, compliments, or signed messages to anyone on the platform.
        </p>

        {/* Animated Scroll Down Indicator Button */}
        <button
          onClick={handleScrollToMembers}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#c4b5fd' }}>
            Scroll to message someone
          </span>
          <div className="animate-bounce-down" style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ChevronDown size={18} color="#c4b5fd" />
          </div>
        </button>
      </section>

      {/* 2. Interactive Members & Direct Send Card */}
      <div ref={membersRef} style={{ padding: '0 16px', scrollMarginTop: 70 }}>
        {/* Horizontal Story Avatars Bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            marginBottom: 10,
            paddingLeft: 4
          }}>
            Select Member
          </div>

          <div className="no-scrollbar" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            overflowX: 'auto',
            padding: '2px 4px 6px 4px'
          }}>
            {users.map(u => {
              const isSelected = activeUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelect(u)}
                  className={`story-avatar-btn ${isSelected ? 'active' : ''}`}
                >
                  <div className={`story-avatar-ring ${isSelected ? 'active' : ''}`}>
                    <UserAvatar
                      name={u.display_name}
                      username={u.username}
                      size={50}
                      fontSize={17}
                    />
                  </div>
                  <span className="story-avatar-name">{u.display_name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Central Direct Compose Card */}
        {activeUser ? (
          <div className="clean-card" style={{ padding: '20px' }}>
            {/* Header: User Info + Copy link */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <UserAvatar
                    name={activeUser.display_name}
                    username={activeUser.username}
                    size={44}
                    fontSize={16}
                  />
                  {activeUser.is_available && (
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-emerald)',
                      border: '2px solid #111'
                    }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    {activeUser.display_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    @{activeUser.username}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => { setActiveUser(null); onSelectUser(null); }}
                  className="btn-ghost"
                  title="Choose someone else"
                  style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#c4b5fd' }}
                >
                  Change
                </button>
                <button
                  onClick={handleCopyLink}
                  className="btn-ghost"
                  style={{ fontSize: '0.75rem', gap: 4, padding: '4px 8px' }}
                >
                  <Share2 size={13} color="var(--primary)" />
                  <span>{copied ? 'Copied' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Recipient Prompt Bubble */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.06) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 18
            }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#c4b5fd',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <Sparkles size={13} color="#c4b5fd" />
                Prompt
              </div>
              <div style={{
                fontSize: '0.975rem',
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: 1.4
              }}>
                &ldquo;{activeUser.prompt || 'Send me an anonymous note'}&rdquo;
              </div>
            </div>

            {sentSuccess ? (
              /* Success confirmation */
              <div style={{ textAlign: 'center', padding: '16px 0 8px 0' }}>
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}>
                  <Check size={26} color="var(--accent-emerald)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 6 }}>
                  Delivered
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  {isAnonymous ? (
                    <>Your note was delivered <span style={{ color: '#c4b5fd', fontWeight: 600 }}>anonymously</span> to @{activeUser.username}.</>
                  ) : (
                    <>Your note was delivered signed by <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{senderName}</span>.</>
                  )}
                </p>
                <button onClick={handleSendAnother} className="btn-secondary" style={{ width: '100%' }}>
                  Send Another Note
                </button>
              </div>
            ) : (
              /* Compose Form */
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <textarea
                    className="clean-textarea"
                    rows={4}
                    placeholder={`Send an anonymous note to ${activeUser.display_name.split(' ')[0]}...`}
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 500))}
                    required
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: 4,
                    fontSize: '0.72rem',
                    color: content.length > 450 ? 'var(--accent-pink)' : 'var(--text-muted)'
                  }}>
                    {content.length} / 500
                  </div>
                </div>

                {/* Identity Switcher: Anonymous (Default) vs Include Name */}
                <div style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginBottom: 18
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    background: '#181822',
                    padding: 3,
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {/* Option 1: Anonymous (DEFAULT) */}
                    <button
                      type="button"
                      onClick={() => setIsAnonymous(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-xs)',
                        border: 'none',
                        cursor: 'pointer',
                        background: isAnonymous ? 'var(--primary-gradient)' : 'transparent',
                        color: isAnonymous ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <VenetianMask size={15} />
                      <span>Anonymous</span>
                    </button>

                    {/* Option 2: Include Name */}
                    <button
                      type="button"
                      onClick={() => setIsAnonymous(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-xs)',
                        border: !isAnonymous ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                        cursor: 'pointer',
                        background: !isAnonymous ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        color: !isAnonymous ? '#6ee7b7' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <User size={15} />
                      <span>Add My Name</span>
                    </button>
                  </div>

                  {/* Conditional Name Field */}
                  {!isAnonymous ? (
                    <div style={{ marginTop: 12 }}>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="Your name or pseudonym (e.g. Alex, Classmate)"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        maxLength={50}
                        style={{ padding: '10px 14px', fontSize: '0.875rem' }}
                        required={!isAnonymous}
                      />
                    </div>
                  ) : (
                    <div style={{
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)'
                    }}>
                      <ShieldCheck size={13} color="var(--primary)" />
                      <span>Recipient will only see: Anonymous Note</span>
                    </div>
                  )}
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

                <button
                  type="submit"
                  disabled={submitting || !activeUser.is_available}
                  className="btn-primary"
                >
                  <Send size={16} />
                  <span>{submitting ? 'Delivering...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="clean-card" style={{ padding: '28px 20px', textAlign: 'center' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto'
            }}>
              <VenetianMask size={26} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
              Select a Member to Message
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20, maxWidth: 320, margin: '0 auto 20px auto', lineHeight: 1.5 }}>
              Tap any member from the stories above or pick a recipient from the directory below to send an anonymous or signed note.
            </p>

            {/* Member Quick Directory */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelect(u)}
                  className="btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    width: '100%',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <UserAvatar
                      name={u.display_name}
                      username={u.username}
                      size={42}
                      fontSize={16}
                    />
                    <div>
                      <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#fff' }}>
                        {u.display_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        @{u.username}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#c4b5fd', fontWeight: 600 }}>
                    Message ›
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
