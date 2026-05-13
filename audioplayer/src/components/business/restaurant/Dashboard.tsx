"use client";

import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { listInventory } from '@/lib/business';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RestaurantDashboard({ id, onOpenInventory }: { id: string; onOpenInventory?: () => void }) {
  const { user } = useFirebaseAuth();
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!user) return setLoading(false);
      setLoading(true);
      try {
        const items = await listInventory(user, id);
        setInventoryCount(items.length);
      } catch (err) {
        console.error('Failed to load inventory', err);
      } finally { setLoading(false); }
    })();
  }, [user, id]);

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-semibold">Restaurant Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="p-4 rounded-lg bg-[#0F172A] border border-white/5">
          <div className="text-sm text-white/60">Inventory</div>
          <div className="text-3xl font-bold">{loading ? '...' : (inventoryCount ?? 0)}</div>
        </div>
        <div className="p-4 rounded-lg bg-[#0F172A] border border-white/5">
          <div className="text-sm text-white/60">Orders (placeholder)</div>
          <div className="text-3xl font-bold">0</div>
        </div>
        <div className="p-4 rounded-lg bg-[#0F172A] border border-white/5">
          <div className="text-sm text-white/60">Employees (placeholder)</div>
          <div className="text-3xl font-bold">0</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button className="bg-[#F97316]" onMouseEnter={() => router.prefetch(`/businesses/${id}/inventory`)} onFocus={() => router.prefetch(`/businesses/${id}/inventory`)} onClick={() => onOpenInventory ? onOpenInventory() : router.push(`/businesses/${id}/inventory`)}>Inventory</Button>
        <Button onMouseEnter={() => router.prefetch(`/businesses/${id}/billing`)} onFocus={() => router.prefetch(`/businesses/${id}/billing`)} onClick={() => router.push(`/businesses/${id}/billing`)} variant="ghost">Billing</Button>
        <Button onMouseEnter={() => router.prefetch(`/businesses/${id}/hr`)} onFocus={() => router.prefetch(`/businesses/${id}/hr`)} onClick={() => router.push(`/businesses/${id}/hr`)} variant="ghost">HR & Payroll</Button>
      </div>
    </div>
  );
}
