import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Dynamic Favicon Generation using Satori/ImageResponse
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: '#2563eb', // bg-blue-600 color
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          borderRadius: '7px',
          fontFamily: 'sans-serif',
        }}
      >
        T
      </div>
    ),
    {
      ...size,
    }
  );
}
