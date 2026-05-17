"use client";

import InventoryPage from '@/app/businesses/[id]/inventory/page';
import RestaurantDashboard from '@/components/business/restaurant/Dashboard';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { isBusinessActive, listBusinesses, listCategories, listInventory, listInventoryAlerts, listStockMovements, listSuppliers, listUnits } from '@/lib/business';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  if (loading) return <div>Loading...</div>;
  if (!business) return <div>Business not found or you do not have access.</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold">{business.name}</h1>
      <p className="mt-2 text-sm text-white/70">{business.description}</p>
      {!isBusinessActive(business) && (
        <div className="mt-4 p-4 bg-yellow-900 rounded text-yellow-200">Your business is pending approval by the admin. Once approved, the management modules for your business will become available.</div>
      )}

      {isBusinessActive(business) && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Modules</h2>
          {business.type === 'restaurant' && (
            <div className="mt-2">Restaurant Management Module available (Orders, Menu, Tables).</div>
          )}
          {business.type === 'hotel' && (
            <div className="mt-2">Hotel Management Module available (Reservations, Check-in/out, Rooms).</div>
          )}
          {business.type === 'airline' && (
            <div className="mt-2">Airline Management Module available (Flights, Bookings, Check-in).</div>
          )}
        </div>
      )}

      {(isBusinessActive(business) && business.type === 'restaurant') && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Restaurant Modules</h3>
          <div className="mt-2 flex gap-2">
            <button className="px-3 py-2 rounded bg-[#F97316]" onMouseEnter={() => router.prefetch(`/businesses/${id}/inventory`)} onFocus={() => router.prefetch(`/businesses/${id}/inventory`)} onClick={() => setShowInventoryModal(true)}>Inventory</button>
              <button className="px-3 py-2 rounded bg-[#F97316]" onMouseEnter={() => router.prefetch(`/businesses/${id}/inventory`)} onFocus={() => router.prefetch(`/businesses/${id}/inventory`)} onClick={async () => {
                // warm up route and basic data before opening modal to improve perceived speed
                router.prefetch(`/businesses/${id}/inventory`);
                try {
                  if (user) {
                    // fetch some lists to warm caches
                    listInventory(user, id).catch(console.error);
                    listCategories(user, id).catch(console.error);
                    listUnits(user, id).catch(console.error);
                    listSuppliers(user, id).catch(console.error);
                    listStockMovements(user, id).catch(console.error);
                    listInventoryAlerts(user, id).catch(console.error);
                  }
                } catch (e) { /* ignore */ }
                setShowInventoryModal(true);
              }}>Inventory</button>
            <button className="px-3 py-2 rounded bg-[#0F172A]" onMouseEnter={() => router.prefetch(`/businesses/${id}/billing`)} onFocus={() => router.prefetch(`/businesses/${id}/billing`)} onClick={() => router.push(`/businesses/${id}/billing`)}>Billing</button>
            <button className="px-3 py-2 rounded bg-[#0F172A]" onMouseEnter={() => router.prefetch(`/businesses/${id}/hr`)} onFocus={() => router.prefetch(`/businesses/${id}/hr`)} onClick={() => router.push(`/businesses/${id}/hr`)}>HR & Payroll</button>
          </div>
        </div>
      )}

      {/* Render the specific dashboard for restaurants */}
      {(isBusinessActive(business) && business.type === 'restaurant') && (
        <div className="mt-6">
          <RestaurantDashboard id={id} onOpenInventory={() => setShowInventoryModal(true)} />
        </div>
      )}

      {showInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowInventoryModal(false)}></div>
          <div className="relative w-full max-w-5xl h-[90vh] overflow-auto rounded bg-[#061025] p-4 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Inventory</h2>
              <button className="px-3 py-2 bg-white/5 rounded" onClick={() => setShowInventoryModal(false)}>Close</button>
            </div>
            <InventoryPage params={{ id }} />
          </div>
        </div>
      )}
    </div>
  );
}
