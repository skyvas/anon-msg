import React from 'react';

export default function AnimatedLogo({ size = 40, animated = true }) {
  return (
    <div style={{
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.45))'
    }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="logoGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Animated Orbit Ring */}
        <ellipse
          cx="50"
          cy="50"
          rx="45"
          ry="32"
          stroke="url(#logoGrad1)"
          strokeWidth="2.5"
          strokeDasharray="14 10 24 10"
          style={{
            transformOrigin: '50% 50%',
            animation: animated ? 'logoOrbit 8s linear infinite' : 'none'
          }}
        />

        {/* Counter Orbit Ring */}
        <ellipse
          cx="50"
          cy="50"
          rx="34"
          ry="44"
          stroke="url(#logoGrad2)"
          strokeWidth="1.8"
          strokeDasharray="8 8 20 8"
          opacity="0.8"
          style={{
            transformOrigin: '50% 50%',
            animation: animated ? 'logoCounterOrbit 6s linear infinite' : 'none'
          }}
        />

        {/* Center Chat Bubble / Core Emblem */}
        <g style={{
          transformOrigin: '50% 50%',
          animation: animated ? 'logoPulse 3s ease-in-out infinite' : 'none'
        }}>
          {/* Main Bubble */}
          <path
            d="M50 24C34.5 24 22 34.5 22 47.5C22 53.5 24.8 58.8 29.5 62.8L27 75L39.8 70.2C43 71.3 46.4 72 50 72C65.5 72 78 61.5 78 48.5C78 35.5 65.5 24 50 24Z"
            fill="#121218"
            stroke="url(#logoGrad1)"
            strokeWidth="3.5"
            strokeLinejoin="round"
            filter="url(#logoGlow)"
          />

          {/* Inner Confidential Signal Dots */}
          <circle cx="39" cy="48" r="3.5" fill="#8b5cf6">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="50" cy="48" r="3.5" fill="#c4b5fd">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.8s"
              begin="0.3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="61" cy="48" r="3.5" fill="#06b6d4">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.8s"
              begin="0.6s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
    </div>
  );
}
