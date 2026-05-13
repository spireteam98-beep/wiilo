"use client";

import InventoryPage from '@/app/businesses/[id]/inventory/page';
import RestaurantDashboard from '@/components/business/restaurant/Dashboard';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { isBusinessActive, listBusinesses, listCategories, listInventory, listInventoryAlerts, listStockMovements, listSuppliers, listUnits } from '@/lib/business';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// --- Glassflow UI Helper Components (Reused from previous component) ---

// Glass Card wrapper: Dark, slightly transparent, blurred background with soft borders and shadow
const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div
    className={`bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-4 ${className}`}
    style={{ backdropFilter: 'blur(10px)' as any }}
  >
    {children}
  </div>
);

// Glass Button: Default, Accent (Orange), and Danger (Red) variants
const GlassButton = (props: any) => (
  <button
    {...props}
    className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all duration-200 ${props.className || ''} ${
      props.variant === 'accent' 
        ? 'bg-[#F97316] hover:bg-orange-500 text-white shadow-lg shadow-orange-700/50' 
        : props.variant === 'danger'
        ? 'bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/50'
        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
    }`}
  >
    {props.children}
  </button>
);

// --- Main Component ---

export default function BusinessPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Access params directly in this client component (Next.js allows this for now).
  const { id } = (params as any) as { id: string };
  const { user, userProfile } = useFirebaseAuth();
  const [business, setBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const businesses = await listBusinesses(user);
        const b = businesses.find(b => b.id === id) || null;
        setBusiness(b);
      } catch (e) {
        console.error('Error fetching businesses', e);
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  const router = useRouter();

  if (loading) return <div className="p-6 text-white bg-black min-h-screen text-xl font-semibold">Loading business details...</div>;
  if (!business) return <div className="p-6 text-white bg-black min-h-screen text-xl font-semibold text-red-400">Business not found or you do not have access.</div>;

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      
      {/* Business Header Card */}
      <GlassCard className="mb-6 p-6">
        <h1 className="text-4xl font-extrabold text-[#F97316]">{business.name}</h1>
        <p className="mt-2 text-base text-white/70">{business.description}</p>
        <p className="mt-1 text-sm text-white/50">Type: {business.type ? business.type.charAt(0).toUpperCase() + business.type.slice(1) : 'General'}</p>
      </GlassCard>

      {/* Pending Approval Message */}
      {!isBusinessActive(business) && (
        <GlassCard className="mt-4 p-4 bg-yellow-900/30 border-yellow-700/50 text-yellow-200">
          <div className="font-semibold text-lg">⚠️ Approval Pending</div>
          <div className="text-sm mt-1">Your business is pending approval by the admin. Once approved, the management modules for your business will become available.</div>
        </GlassCard>
      )}

      {/* Active Modules Section */}
      {isBusinessActive(business) && (
        <GlassCard className="mt-6">
          <h2 className="text-xl font-bold mb-3">Available Modules</h2>
          
          <div className="space-y-3">
            {business.type === 'restaurant' && (
              <div className="p-3 bg-white/10 rounded-lg">Restaurant Management Module available (Orders, Menu, Tables).</div>
            )}
            {business.type === 'hotel' && (
              <div className="p-3 bg-white/10 rounded-lg">Hotel Management Module available (Reservations, Check-in/out, Rooms).</div>
            )}
            {business.type === 'airline' && (
              <div className="p-3 bg-white/10 rounded-lg">Airline Management Module available (Flights, Bookings, Check-in).</div>
            )}
            {/* Fallback or general modules */}
            {!(business.type === 'restaurant' || business.type === 'hotel' || business.type === 'airline') && (
              <div className="p-3 bg-white/10 rounded-lg">General Business Management Modules are available.</div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Restaurant Specific Actions */}
      {(isBusinessActive(business) && business.type === 'restaurant') && (
        <GlassCard className="mt-6">
          <h3 className="text-xl font-bold mb-4">Restaurant Operations</h3>
          <div className="flex flex-wrap gap-4">
            
            {/* Inventory Button (Accent Style) */}
            <GlassButton 
              variant="accent" 
              onMouseEnter={() => router.prefetch(`/businesses/${id}/inventory`)} 
              onFocus={() => router.prefetch(`/businesses/${id}/inventory`)} 
              onClick={async () => {
                // warm up route and basic data before opening modal to improve perceived speed
                router.prefetch(`/businesses/${id}/inventory`);
                try {
                  if (user) {
                    // Pre-fetch some lists to warm caches
                    listInventory(user, id).catch(console.error);
                    listCategories(user, id).catch(console.error);
                    listUnits(user, id).catch(console.error);
                  }
                } catch (e) { /* ignore */ }
                setShowInventoryModal(true);
              }}
              className="min-w-[120px]"
            >
              Inventory
            </GlassButton>
            
            {/* Billing Button (Default Style) */}
            <GlassButton 
              onMouseEnter={() => router.prefetch(`/businesses/${id}/billing`)} 
              onFocus={() => router.prefetch(`/businesses/${id}/billing`)} 
              onClick={() => router.push(`/businesses/${id}/billing`)}
              className="min-w-[120px]"
            >
              Billing
            </GlassButton>
            
            {/* HR Button (Default Style) */}
            <GlassButton 
              onMouseEnter={() => router.prefetch(`/businesses/${id}/hr`)} 
              onFocus={() => router.prefetch(`/businesses/${id}/hr`)} 
              onClick={() => router.push(`/businesses/${id}/hr`)}
              className="min-w-[120px]"
            >
              HR & Payroll
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Render the specific dashboard for restaurants */}
      {(isBusinessActive(business) && business.type === 'restaurant') && (
        <div className="mt-6">
          {/* Note: Assuming RestaurantDashboard handles its own Glassflow styling internally */}
          <RestaurantDashboard id={id} onOpenInventory={() => setShowInventoryModal(true)} />
        </div>
      )}

      {/* Inventory Modal (Fixed Glass Overlay) */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6">
          {/* Backdrop Blur/Overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInventoryModal(false)}></div>
          
          {/* Modal Content - Glass Card container */}
          <div className="relative w-full max-w-5xl h-[95vh] overflow-hidden rounded-xl bg-white/5 border border-white/10 shadow-2xl p-0">
            <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-black/50 border-b border-white/10">
              <h2 className="text-xl font-bold">Inventory Management</h2>
              <GlassButton 
                onClick={() => setShowInventoryModal(false)}
                className="bg-red-700 hover:bg-red-600 border-none"
              >
                Close (X)
              </GlassButton>
            </div>
            
            {/* Inventory Page Content */}
            <div className="h-[calc(95vh-60px)] overflow-y-auto">
              <InventoryPage params={{ id }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}