import React, { useState } from 'react';
import { X, Send, User, VenetianMask, Shield, Sparkles, Check, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import UserAvatar from './UserAvatar';

export default function MessageModal({ recipient, onClose, onMessageSent }) {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true); // DEFAULT OPTION IS ANONYMOUS
  const [senderName, setSenderName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!recipient) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write a message before sending.');
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
        recipient_id: recipient.id,
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

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981']
      });

      setSentSuccess(true);
      if (onMessageSent) onMessageSent();
    } catch (err) {
      setError(err.message || 'Error sending message. Please try again.');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div style={{
          padding: '20px 24px 16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserAvatar
              name={recipient.display_name}
              username={recipient.username}
              size={44}
              fontSize={16}
            />
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                {recipient.display_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                @{recipient.username}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ borderRadius: '50%', padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {sentSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <Check size={32} color="var(--accent-emerald)" />
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8, color: '#fff' }}>
                Message Delivered!
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: 20 }}>
                {isAnonymous ? (
                  <>Your message was delivered <span style={{ color: '#c4b5fd', fontWeight: 600 }}>100% anonymously</span> to @{recipient.username}.</>
                ) : (
                  <>Your message was delivered signed as <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{senderName}</span>.</>
                )}
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={handleSendAnother} className="btn-secondary">
                  Send Another Note
                </button>
                <button onClick={onClose} className="btn-primary">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Recipient Prompt Quote */}
              <div style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: 20
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
                  Their Prompt
                </div>
                <div style={{ fontSize: '0.95rem', color: '#fff', fontStyle: 'italic', lineHeight: 1.4 }}>
                  &ldquo;{recipient.prompt || 'Send me an anonymous message!'}&rdquo;
                </div>
              </div>

              {/* Message Content Input */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Your Message
                  </label>
                  <span style={{ fontSize: '0.75rem', color: content.length > 450 ? 'var(--accent-pink)' : 'var(--text-muted)' }}>
                    {content.length} / 500
                  </span>
                </div>

                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder={`Write your confidential message to ${recipient.display_name}...`}
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 500))}
                  required
                />
              </div>

              {/* Sender Identity Switcher (Default: Anonymous) */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: 20
              }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Sender Identity
                </div>

                {/* Segmented Control */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: 4,
                  borderRadius: 'var(--radius-md)'
                }}>
                  {/* Option 1: Anonymous (DEFAULT) */}
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      background: isAnonymous ? 'var(--primary-gradient)' : 'transparent',
                      color: isAnonymous ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease',
                      boxShadow: isAnonymous ? '0 2px 8px var(--primary-glow)' : 'none'
                    }}
                  >
                    <VenetianMask size={16} />
                    <span>Anonymous (Default)</span>
                  </button>

                  {/* Option 2: Include Name */}
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: !isAnonymous ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                      color: !isAnonymous ? '#6ee7b7' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease',
                      border: !isAnonymous ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent'
                    }}
                  >
                    <User size={16} />
                    <span>Include My Name</span>
                  </button>
                </div>

                {/* Conditional Text Field for Sender Name */}
                {!isAnonymous ? (
                  <div style={{ marginTop: 14, animation: 'fadeIn 0.2s ease-out' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: '#6ee7b7',
                      fontWeight: 600,
                      marginBottom: 6
                    }}>
                      Your Name or Pseudonym
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Taylor, Secret Admirer, Co-worker"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      maxLength={50}
                      required={!isAnonymous}
                    />
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      The recipient will see this name tag on their inbox card.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <Shield size={13} color="var(--primary)" />
                    <span>Your name &amp; identity will not be revealed to the recipient.</span>
                  </div>
                )}
              </div>

              {/* Error Notice */}
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

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <Send size={16} />
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
