import { ImageResponse } from 'next/og'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export const alt = 'Dhuux Article'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Ensure this route is always dynamic so it doesn't crash during build
export const dynamic = 'force-dynamic'

export default async function Image({ params }: { params: Promise<{ articleId?: string }> }) {
  // 1. Await the params (Required in newer Next.js versions)
  const resolvedParams = await params;
  const id = resolvedParams?.articleId;

  let imageUrl = 'https://yourdomain.com/default-og.jpg'; // Your fallback image

  // 2. Only fetch if an ID actually exists
  if (id && id !== 'undefined') {
    try {
      const docRef = doc(db, 'content', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        imageUrl = snap.data().imageUrl || imageUrl;
      }
    } catch (e) {
      console.error("OG Image Fetch Error:", e);
    }
  }

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#000' }}>
        <img 
          src={imageUrl} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </div>
    ),
    { ...size }
  )
}