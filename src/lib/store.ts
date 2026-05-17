
import { create } from 'zustand';

export type BusinessType = 'Shop' | 'Restaurant' | 'Coffee shop' | 'Pharmacy' | 'E-commerce';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand?: string;
  unit: string;
  purchasePrice: number;
  price: number;
  wholesalePrice: number;
  taxRate: number;
  description?: string;
  imageUrl?: string;
  stock: number;
  reorderLevel: number;
  critical: boolean;
  popular: boolean;
  status: 'active' | 'inactive';
  size?: string;
  color?: string;
  expiryDate?: string;
  serialNumber?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: string;
}

export interface OmniBizStore {
  currentTenant: {
    id: string;
    name: string;
    type: BusinessType;
    modules: string[];
    currency: string;
    taxRate: number;
  } | null;
  products: Product[];
  transactions: any[];
  expenses: any[];
  
  // Music State
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  volume: number;
  
  setTenant: (tenant: any) => void;
  addProduct: (product: Product) => void;
  addTransaction: (transaction: any) => void;
  reset: () => void;
  
  // Music Actions
  setCurrentTrack: (track: MusicTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (vol: number) => void;
}

const mockProducts: Product[] = [
  { 
    id: 'p1', 
    name: 'Premium Coffee Beans', 
    sku: 'CB-001', 
    category: 'Groceries', 
    brand: 'Arabica', 
    unit: 'kg', 
    purchasePrice: 18.0, 
    price: 25.0, 
    wholesalePrice: 20.0,
    taxRate: 5,
    description: 'Freshly roasted whole beans.',
    stock: 45, 
    reorderLevel: 10, 
    critical: true, 
    popular: true, 
    status: 'active' 
  }
];

export const useStore = create<OmniBizStore>((set) => ({
  currentTenant: null,
  products: mockProducts,
  transactions: [],
  expenses: [],
  
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  
  setTenant: (tenant) => set({ 
    currentTenant: { 
      ...tenant, 
      currency: 'USD',
      taxRate: 0.15,
      modules: ['POS', 'Inventory', 'Finance', 'Music'] 
    } 
  }),
  
  addProduct: (product) => set((state) => ({ products: [product, ...state.products] })),
  addTransaction: (tx) => set((state) => ({ transactions: [tx, ...state.transactions] })),
  reset: () => set({ currentTenant: null, transactions: [], products: mockProducts, currentTrack: null, isPlaying: false }),
  
  setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: !!track }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (vol) => set({ volume: vol }),
}));
