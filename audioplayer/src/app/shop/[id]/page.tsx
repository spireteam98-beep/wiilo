"use client";

import { ChevronLeft, Heart } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Bitcoin Icon
const BitcoinIcon = () => (
  <div className="w-8 h-8 rounded-full bg-[#3D3D3D] flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#F7931A">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09v1.07h-1.35v-1.05c-1.29-.09-2.6-.53-3.54-1.21l.63-1.57c.89.56 1.91.94 2.91.94.95 0 1.67-.36 1.67-1.09 0-.69-.61-1.02-1.86-1.4-1.83-.55-3.2-1.27-3.2-2.97 0-1.43 1.05-2.51 2.83-2.83V6.91h1.35v1.01c1.06.09 1.99.39 2.77.84l-.56 1.54c-.71-.39-1.56-.69-2.47-.69-.99 0-1.44.4-1.44.96 0 .63.57.91 2 1.36 1.98.61 3.06 1.43 3.06 3.01 0 1.52-1.16 2.59-3.08 2.88v1.07z"/>
    </svg>
  </div>
);

// Product data
const product = {
  id: 'macbook-pro-2020',
  name: 'Mackbook Pro 2020',
  specs: '256GB SSD, 16GB, VGA',
  category: 'Gadgets',
  description: [
    'Apple MacBook Pro 13" M1 Chip 8GB 512GB 2020 Model. The Apple M1 chip redefines the 13-inch MacBook Pro. Featuring an 8-core CPU that flies through complex workflows in photography, coding, video editing, and more.',
    'Incredible 8-core GPU that crushes graphics-intensive tasks and enables super-smooth gaming.'
  ],
  priceBtc: '0.000000023',
  priceUsd: 1200,
  images: [
    'https://picsum.photos/seed/macbook-detail/600/400',
    'https://picsum.photos/seed/macbook-detail2/600/400',
    'https://picsum.photos/seed/macbook-detail3/600/400',
  ],
};

export default function BuyProductScreen({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = (params as any) as { id: string };
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md relative bg-[#0A0A0A] min-h-screen flex flex-col">
        
        {/* Image Section */}
        <div className="relative">
          {/* Back Button */}
          <button 
            onClick={() => router.back()}
            className="absolute top-6 left-4 z-20 w-12 h-12 rounded-2xl bg-[#2A2A2A] flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Product Image with Gradient Background */}
          <div 
            className="h-[380px] w-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            }}
          >
            <Image
              src={product.images[currentImageIndex]}
              alt={product.name}
              width={320}
              height={220}
              className="object-contain"
            />
          </div>

          {/* Carousel Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-[6px] rounded-full transition-all ${
                  index === currentImageIndex 
                    ? 'w-6 bg-[#FF9500]' 
                    : 'w-[6px] bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Product Info Section */}
        <div className="flex-1 bg-[#121418] rounded-t-[24px] -mt-4 px-5 pt-6 pb-28">
          
          {/* Title Row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-[22px] font-bold text-white mb-1">{product.name}</h1>
              <p className="text-[15px] text-[#9CA3AF]">{product.specs}</p>
            </div>
            <span className="px-4 py-1.5 rounded-full border border-[#F97316]/60 text-[#F97316] text-[13px] font-medium">
              {product.category}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-4 mb-4">
            {product.description.map((paragraph, i) => (
              <p key={i} className="text-[14px] leading-relaxed text-[#A0A0A0]">
                {paragraph}
              </p>
            ))}
          </div>

          {/* More Details Link */}
          <button className="text-[#F97316] text-[14px] font-medium mb-6">
            More details
          </button>

          {/* Pricing Section */}
          <div className="flex items-center justify-between">
            {/* BTC Selector */}
            <button className="flex items-center gap-2 h-11 pl-1 pr-4 rounded-full bg-[#1E1E1E]">
              <BitcoinIcon />
              <span className="text-white font-medium text-[14px]">BTC</span>
              <svg className="w-4 h-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {/* Prices */}
            <div className="text-right">
              <p className="text-[18px] font-bold text-[#F7931A]">{product.priceBtc}BTC</p>
              <p className="text-[14px] text-[#9CA3AF]">${product.priceUsd.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Purchase Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#121418] px-5 py-4">
          <div className="flex gap-3 max-w-md mx-auto">
            {/* Buy Now Button */}
            <button className="flex-1 h-14 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-[16px] transition-colors">
              Buy Now
            </button>
            
            {/* Favorite Button */}
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                isFavorite 
                  ? 'bg-[#F97316]/20 border border-[#F97316]' 
                  : 'bg-[#3D2A2A]'
              }`}
            >
              <Heart 
                className={`w-6 h-6 ${
                  isFavorite 
                    ? 'fill-[#F97316] text-[#F97316]' 
                    : 'text-white'
                }`}
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
