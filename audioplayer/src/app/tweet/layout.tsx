
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Player',
  description: 'A custom video player.',
};

export default function VideoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
        {children}
    </>
  );
}
