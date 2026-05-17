'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Search } from 'lucide-react';
import BottomNav from '@/components/common/bottom-nav';

// Ethereum Icon
const EthIcon = () => (
  <div className="w-8 h-8 rounded-full bg-[#627EEA]/20 flex items-center justify-center">
    <svg viewBox="0 0 32 32" className="w-4 h-4">
      <path fill="#627EEA" d="M16 0l-.5.9v21.2l.5.4 9.5-5.6z"/>
      <path fill="#8C8C8C" d="M16 0L6.5 16.9l9.5 5.6V0z"/>
      <path fill="#3C3C3B" d="M16 24.4l-.3.3v7.3l.3.8 9.5-13.4z"/>
      <path fill="#8C8C8C" d="M16 32.8V24.4L6.5 19.4z"/>
      <path fill="#141414" d="M16 22.5l9.5-5.6L16 12.3z"/>
      <path fill="#393939" d="M6.5 16.9l9.5 5.6v-10z"/>
    </svg>
  </div>
);

// Filter Icon
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Products data
const products = [
  {
    id: 'macbook-pro-2021',
    name: 'Macbook Pro 2021',
    description: '256GB SSD, 16GB, VGA...',
    priceEth: 345,
    priceUsd: 1200,
    image: 'https://picsum.photos/seed/macbook1/400/400',
  },
  {
    id: 'airpods-max',
    name: 'Airpod Max - Green',
    description: '256GB SSD, 16GB, VGA...',
    priceEth: 145,
    priceUsd: 1200,
    image: 'https://picsum.photos/seed/airpods1/400/400',
  },
  {
    id: 'macbook-pro-2',
    name: 'Macbook Pro 2021',
    description: '256GB SSD, 16GB, VGA...',
    priceEth: 345,
    priceUsd: 1200,
    image: 'https://picsum.photos/seed/macbook2/400/400',
  },
  {
    id: 'macbook-pro-3',
    name: 'Macbook Pro 2021',
    description: '256GB SSD, 16GB, VGA...',
    priceEth: 345,
    priceUsd: 1200,
    image: 'https://picsum.photos/seed/macbook3/400/400',
  },
];

const categories = ['Gadgets', 'Sale', 'Techies', 'Fashion'];

export default function ShopPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md relative bg-[#0D0D0D] min-h-screen text-white">
        {/* Scrollable Content */}
        <div className="pb-28 px-4">
          
          {/* Header */}
          <header className="flex items-center justify-between py-6">
            <h1 className="text-[22px] font-bold tracking-tight">Your GlassFlow Shop</h1>
            <button className="w-12 h-12 rounded-xl border border-[#333333] flex items-center justify-center hover:bg-white/5 transition-colors">
              <Heart className="w-5 h-5 text-white" strokeWidth={1.5} />
            </button>
          </header>

          {/* Promo Banner */}
          <section className="relative h-[140px] rounded-2xl overflow-hidden mb-4">
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 20%, #3F51B5 40%, #00BCD4 60%, #4CAF50 80%, #FF9800 100%)',
              }}
            />
            <div className="absolute inset-0 opacity-80">
              <svg viewBox="0 0 400 140" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                <ellipse cx="50" cy="70" rx="80" ry="60" fill="#E91E63"/>
                <ellipse cx="120" cy="100" rx="60" ry="50" fill="#9C27B0"/>
                <ellipse cx="180" cy="40" rx="70" ry="45" fill="#3F51B5"/>
                <ellipse cx="100" cy="20" rx="50" ry="40" fill="#4CAF50"/>
                <ellipse cx="220" cy="90" rx="55" ry="45" fill="#00BCD4"/>
              </svg>
            </div>
            <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
              <p className="text-white/90 text-sm font-medium mb-0.5">Tech Week</p>
              <p className="text-white text-2xl font-bold leading-tight">SUPER DEALS</p>
              <p className="text-[#FF9800] text-xl font-bold">30% OFF</p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/2">
              <Image
                src="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=300&h=200&fit=crop"
                alt="Gadgets"
                fill
                className="object-cover object-center opacity-90"
              />
            </div>
          </section>

          {/* Carousel Dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            <div className="w-6 h-[6px] rounded-full bg-[#FF9500]"></div>
            <div className="w-[6px] h-[6px] rounded-full bg-white/30"></div>
            <div className="w-[6px] h-[6px] rounded-full bg-white/30"></div>
          </div>

          {/* Categories */}
          <section className="flex gap-2.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
            {categories.map((cat, i) => (
              <button
                key={cat}
                className={`px-5 h-10 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  i === 0
                    ? 'bg-[#3D2A2A] text-white'
                    : 'bg-[#1E1E1E] text-white/70 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </section>

          {/* ETH Selector & Icons */}
          <section className="flex items-center justify-between mb-5">
            <button className="flex items-center gap-2 h-11 pl-1.5 pr-4 rounded-full bg-[#1A1A1A]">
              <EthIcon />
              <span className="text-white font-semibold text-sm">ETH</span>
              <svg className="w-4 h-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <div className="flex items-center gap-5">
              <button className="text-white/70 hover:text-white transition-colors">
                <FilterIcon />
              </button>
              <button className="text-white/70 hover:text-white transition-colors">
                <Search className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>
          </section>

          {/* Product Grid */}
          <section className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => router.push(`/shop/${product.id}`)}
                className="bg-[#1A1E23] rounded-2xl overflow-hidden text-left hover:bg-[#1F252B] transition-colors"
              >
                <div className="aspect-square bg-[#252C35] flex items-center justify-center">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-white font-semibold text-[13px] truncate">{product.name}</h3>
                  <p className="text-[#6B7280] text-[11px] truncate mt-0.5">{product.description}</p>
                  <p className="text-white font-bold text-base mt-2">{product.priceEth}ETH</p>
                  <p className="text-[#6B7280] text-[11px]">${product.priceUsd.toLocaleString()}</p>
                </div>
              </button>
            ))}
          </section>
        </div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
