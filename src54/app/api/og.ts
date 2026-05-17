import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge', // Required for @vercel/og
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get('title') || 'Default Title';
  const description = searchParams.get('description') || 'Default Description';
  const imageUrl = searchParams.get('image') || ''; // optional header image

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#111111',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            width={1200}
            height={400}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: 'auto',
              borderRadius: 16,
              marginBottom: 30,
            }}
          />
        )}
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '0 60px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 32,
            textAlign: 'center',
            marginTop: 20,
            padding: '0 60px',
          }}
        >
          {description}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}