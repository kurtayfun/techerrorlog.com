import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const alt = 'TechErrorLog - Technical Diagnostic & Error Resolution';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Dynamic Twitter Image Generation using Satori
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative grid/circuits pattern */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        
        {/* Top Section: Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {/* Logo Badge */}
          <div
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '36px',
              borderRadius: '16px',
              boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
            }}
          >
            T
          </div>
          
          {/* Brand Name */}
          <span
            style={{
              fontSize: '38px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
            }}
          >
            Tech<span style={{ color: '#3b82f6' }}>Error</span>Log
          </span>
        </div>

        {/* Middle/Bottom Section: Main Content & Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxWidth: '850px',
            zIndex: 10,
          }}
        >
          {/* Main Headline */}
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: '-0.04em',
            }}
          >
            System Diagnostic Logs & Solutions
          </h1>
          
          {/* Subtitle / Description */}
          <p
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              lineHeight: 1.5,
              margin: 0,
              fontWeight: 400,
            }}
          >
            Precise, verified, and clutter-free diagnostic workflows for Windows and operating systems.
          </p>
        </div>

        {/* Footer info/badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '32px',
            width: '100%',
          }}
        >
          {/* URL Badge */}
          <span
            style={{
              fontSize: '18px',
              color: '#64748b',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            WWW.TECHERRORLOG.COM
          </span>

          {/* Bullet separator */}
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
            }}
          />

          {/* Secure/Verified Badge */}
          <span
            style={{
              fontSize: '16px',
              color: '#3b82f6',
              fontWeight: 600,
            }}
          >
            Verified Diagnostic Guides
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
