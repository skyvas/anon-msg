import React from 'react';

const GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Indigo to Violet
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', // Violet to Pink
  'linear-gradient(135deg, #059669 0%, #0d9488 100%)', // Emerald to Teal
  'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)', // Sky to Blue
  'linear-gradient(135deg, #d97706 0%, #ea580c 100%)', // Amber to Orange
  'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', // Purple to Indigo
  'linear-gradient(135deg, #047857 0%, #059669 100%)', // Deep Emerald
  'linear-gradient(135deg, #be185d 0%, #e11d48 100%)'  // Rose to Crimson
];

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradientIndex(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % GRADIENTS.length;
}

export default function UserAvatar({
  name = '',
  username = '',
  size = 44,
  fontSize,
  borderRadius = '50%',
  style = {},
  className = ''
}) {
  const initials = getInitials(name || username || '?');
  const gradient = GRADIENTS[getGradientIndex(username || name || 'default')];
  const calculatedFontSize = fontSize || Math.round(size * 0.4);

  return (
    <div
      className={`user-initials-avatar ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius,
        background: gradient,
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: `${calculatedFontSize}px`,
        letterSpacing: '0.04em',
        userSelect: 'none',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 4px 12px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        ...style
      }}
      aria-label={name || username}
    >
      {initials}
    </div>
  );
}
