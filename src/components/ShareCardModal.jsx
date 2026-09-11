import React, { useRef, useState } from 'react';
import { X, Download, Copy, Check, Sparkles, VenetianMask, User } from 'lucide-react';

const THEMES = [
  { id: 'cyber', name: 'Cyber Violet', bg: 'linear-gradient(135deg, #1e1b4b 0%, #31104b 50%, #090a0f 100%)', text: '#ffffff', accent: '#a855f7' },
  { id: 'neon', name: 'Neon Nebula', bg: 'linear-gradient(135deg, #091e2b 0%, #083344 50%, #090a0f 100%)', text: '#ffffff', accent: '#06b6d4' },
  { id: 'sunset', name: 'Sunset Glow', bg: 'linear-gradient(135deg, #3d071a 0%, #5b1031 50%, #090a0f 100%)', text: '#ffffff', accent: '#ec4899' },
  { id: 'emerald', name: 'Emerald Night', bg: 'linear-gradient(135deg, #06382a 0%, #022c22 50%, #090a0f 100%)', text: '#ffffff', accent: '#10b981' }
];

export default function ShareCardModal({ message, currentUser, onClose }) {
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  if (!message) return null;

  const handleCopyText = () => {
    const text = `"${message.content}"\n\nSent ${message.is_anonymous ? 'anonymously' : `by ${message.sender_name}`} on AnonMsg`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (selectedTheme.id === 'cyber') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#31104b');
      grad.addColorStop(1, '#090a0f');
    } else if (selectedTheme.id === 'neon') {
      grad.addColorStop(0, '#091e2b');
      grad.addColorStop(0.5, '#0e7490');
      grad.addColorStop(1, '#090a0f');
    } else if (selectedTheme.id === 'sunset') {
      grad.addColorStop(0, '#3d071a');
      grad.addColorStop(0.5, '#5b1031');
      grad.addColorStop(1, '#090a0f');
    } else {
      grad.addColorStop(0, '#06382a');
      grad.addColorStop(0.5, '#022c22');
      grad.addColorStop(1, '#090a0f');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative glow circles
    ctx.beginPath();
    ctx.arc(200, 300, 400, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(880, 1600, 500, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.fill();

    // App Branding Header (No emojis)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AnonMsg', width / 2, 260);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '36px -apple-system, sans-serif';
    ctx.fillText(`send notes to @${currentUser?.username || 'me'}`, width / 2, 320);

    // Draw main glass card
    const cardX = 100;
    const cardY = 460;
    const cardW = width - 200;
    const cardH = 960;
    const cardRadius = 50;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Sender Badge on Card (Zero emojis)
    const badgeText = message.is_anonymous ? 'ANONYMOUS SENDER' : `SENT BY: ${message.sender_name}`;
    ctx.font = 'bold 36px -apple-system, sans-serif';
    ctx.fillStyle = message.is_anonymous ? '#d8b4fe' : '#6ee7b7';
    ctx.fillText(badgeText, width / 2, cardY + 120);

    // Prompt title
    ctx.font = '32px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`"${currentUser?.prompt || 'Send me an anonymous note'}"`, width / 2, cardY + 200);

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 60, cardY + 260);
    ctx.lineTo(cardX + cardW - 60, cardY + 260);
    ctx.stroke();

    // Message Content
    ctx.fillStyle = '#ffffff';
    ctx.font = '52px -apple-system, sans-serif';
    ctx.textAlign = 'center';

    const words = message.content.split(' ');
    let line = '';
    let currentY = cardY + 400;
    const maxLineWidth = cardW - 140;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineWidth && i > 0) {
        ctx.fillText(line, width / 2, currentY);
        line = words[i] + ' ';
        currentY += 75;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, currentY);

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 42px -apple-system, sans-serif';
    ctx.fillText('Reply on AnonMsg', width / 2, height - 200);

    // Trigger download
    const link = document.createElement('a');
    link.download = `anonmsg-card-${message.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={17} color="var(--primary)" />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Story Card
            </h4>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ borderRadius: '50%', padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '18px 20px 24px 20px' }}>
          {/* Theme Switcher Dots */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: theme.bg,
                  border: selectedTheme.id === theme.id ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: selectedTheme.id === theme.id ? '0 0 10px rgba(255, 255, 255, 0.5)' : 'none',
                  cursor: 'pointer'
                }}
                title={theme.name}
              />
            ))}
          </div>

          {/* Story Card Preview (No emojis) */}
          <div 
            ref={cardRef}
            style={{
              aspectRatio: '9 / 15',
              width: '100%',
              maxWidth: 320,
              margin: '0 auto 20px auto',
              borderRadius: 24,
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
              background: selectedTheme.bg
            }}
          >
            {/* Watermark header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                AnonMsg
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                send notes to @{currentUser?.username || 'me'}
              </div>
            </div>

            {/* Inner Content Box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 18,
              padding: '20px 16px',
              textAlign: 'center',
              margin: 'auto 0'
            }}>
              <div style={{ marginBottom: 10 }}>
                {message.is_anonymous ? (
                  <span className="badge-anon">
                    <VenetianMask size={12} />
                    Anonymous
                  </span>
                ) : (
                  <span className="badge-named">
                    <User size={12} />
                    {message.sender_name}
                  </span>
                )}
              </div>

              <div style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: 1.45,
                wordBreak: 'break-word'
              }}>
                &ldquo;{message.content}&rdquo;
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '0.72rem',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 600,
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-block'
              }}>
                Reply on AnonMsg
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={handleCopyText} className="btn-secondary">
              {copied ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button onClick={handleDownloadImage} className="btn-primary">
              <Download size={15} />
              <span>Save PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
