import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Default Title';
  const description = searchParams.get('description') || 'Default Description';
  const imageUrl = searchParams.get('image'); // the article image

  let backgroundImage: string | null = null;

  // Try to fetch the provided image
  if (imageUrl) {
    try {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        backgroundImage = `data:${blob.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
      }
    } catch (err) {
      console.error('Failed to fetch article image for OG:', err);
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          padding: 40,
          boxSizing: 'border-box',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#111',
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #f55, #55f)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 'bold', marginBottom: 20, textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>{title}</div>
        <div style={{ fontSize: 36, maxWidth: '80%', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>{description}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}