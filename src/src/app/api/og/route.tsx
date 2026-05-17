import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title') || 'StreamFlow';
    const description = searchParams.get('description') || 'A Netflix-inspired video streaming experience.';
    const image = searchParams.get('image');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#111',
            color: 'white',
            padding: '40px 80px',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Background Image with Overlay */}
          {image && (
            <img
              src={image}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.25,
              }}
            />
          )}
          
          {/* Subtle dark gradient for better text readability */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8))',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
              alignItems: 'flex-start',
              width: '100%',
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 'bold',
                marginBottom: 24,
                lineHeight: 1.1,
                color: '#f97316', // primary color orange-500
                textShadow: '0 4px 8px rgba(0,0,0,0.5)',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 32,
                color: '#e5e7eb',
                lineHeight: 1.4,
                maxWidth: '900px',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {description}
            </div>
          </div>

          {/* Branding */}
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              left: 80,
              fontSize: 28,
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <div 
              style={{ 
                width: 40, 
                height: 40, 
                backgroundColor: '#f97316', 
                borderRadius: '50%', 
                marginRight: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}
            >
              S
            </div>
            StreamFlow
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(`Failed to generate OG image: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
