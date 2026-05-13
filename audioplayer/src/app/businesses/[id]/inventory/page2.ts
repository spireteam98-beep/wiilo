"use client";

import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { createCategory, createInventoryItem, createStockMovement, createSupplier, listCategories, listInventory, listInventoryAlerts, listStockMovements, listSuppliers } from '@/lib/business';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function BusinessInventory({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Next.js / React in App Router may pass params as a Promise in client components.
  // Use React.use() to unwrap the params promise and safely access params.id.
  const { id } = React.use(params as any) as { id: string };
  const { user, userProfile } = useFirebaseAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const router = useRouter();
  const [tab, setTab] = useState<'overview' | 'categories' | 'items' | 'suppliers' | 'movements' | 'alerts' | 'reports'>('overview');
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({ lowStock: [], expirySoon: [], counts: {} });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [reorderLevel, setReorderLevel] = useState<number | ''>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('');

  useEffect(() => {
    (async () => {
      if (!user) return setLoading(false);
      setLoading(true);
      try {
        const it = await listInventory(user, id);
        setItems(it);
        const cats = await listCategories(user, id);
        setCategories(cats);
        const sups = await listSuppliers(user, id);
        setSuppliers(sups);
        const movs = await listStockMovements(user, id);
        setMovements(movs);
        // preload alerts
        try {
          const a = await listInventoryAlerts(user, id);
          setAlerts(a);
        } catch (e) {
          // ignore alerts failure
        }
      } catch (err) {
        console.error('Failed to fetch inventory', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const item = await createInventoryItem(user, id, { name, sku, quantity: Number(quantity || 0), unit: '', categoryId: selectedCategoryId || undefined, reorderLevel: typeof reorderLevel === 'number' ? reorderLevel : undefined });
      setItems(prev => [item, ...prev]);
      setName(''); setSku(''); setQuantity('');
    } catch (err) {
      console.error('Failed to add inventory item', err);
      alert('Failed to add item');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCategoryName) return;
    try {
      const cat = await createCategory(user, id, { name: newCategoryName });
      setCategories(prev => [cat, ...prev]);
      setNewCategoryName('');
    } catch (err) {
      console.error('Failed to create category', err);
      alert('Failed to create category');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSupplierName) return;
    try {
      const sup = await createSupplier(user, id, { name: newSupplierName });
      setSuppliers(prev => [sup, ...prev]);
      setNewSupplierName('');
    } catch (err) {
      console.error('Failed to create supplier', err);
      alert('Failed to create supplier');
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // Simple stock in flow: create movement
    try {
      if (!selectedItemId) return alert('Choose an item');
      const movement = await createStockMovement(user, id, { type: 'IN', itemId: selectedItemId, quantity: Number(quantity || 0), supplierId: selectedSupplierId || undefined, batchNo: batchNo || undefined, expiryDate: expiryDate || undefined, costPerUnit: typeof costPerUnit === 'number' ? costPerUnit : undefined });
      setMovements(prev => [movement, ...prev]);
      // Refresh inventory and movements
      const it = await listInventory(user, id);
      setItems(it);
    } catch (err) {
      console.error('Failed to stock in', err);
      alert('Failed to stock in');
    }
  };

  if (!user) return <div className="p-6 text-white">Please sign in to manage inventory.</div>;
  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <div className="mt-4 flex gap-2 border-b border-white/5 pb-2">
        <button onClick={() => setTab('overview')} className={`px-3 py-2 ${tab === 'overview' ? 'bg-[#F97316]' : ''}`}>Overview</button>
        <button onClick={() => setTab('categories')} className={`px-3 py-2 ${tab === 'categories' ? 'bg-[#F97316]' : ''}`}>Categories</button>
        <button onClick={() => setTab('items')} className={`px-3 py-2 ${tab === 'items' ? 'bg-[#F97316]' : ''}`}>Items</button>
        <button onClick={() => setTab('suppliers')} className={`px-3 py-2 ${tab === 'suppliers' ? 'bg-[#F97316]' : ''}`}>Suppliers</button>
        <button onClick={() => setTab('movements')} className={`px-3 py-2 ${tab === 'movements' ? 'bg-[#F97316]' : ''}`}>Movements</button>
        <button onClick={() => setTab('alerts')} className={`px-3 py-2 ${tab === 'alerts' ? 'bg-[#F97316]' : ''}`}>Alerts</button>
        <button onClick={() => setTab('reports')} className={`px-3 py-2 ${tab === 'reports' ? 'bg-[#F97316]' : ''}`}>Reports</button>
      </div>
      {tab === 'overview' && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Overview</h2>
          <div className="mt-2">Total items: {items.length}</div>
          <div>Categories: {categories.length}</div>
          <div>Suppliers: {suppliers.length}</div>
          <div>Movements: {movements.length}</div>
        </div>
      )}

      {tab === 'items' && (
        <form onSubmit={handleAdd} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" className="px-3 py-2 rounded-lg bg-[#0F0F10]" required />
          <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0F0F10]">
            <option value="">No Category</option>
            {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
        <div className="flex gap-2">
          <input value={String(quantity)} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Quantity" type="number" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
          <input value={String(reorderLevel)} onChange={e => setReorderLevel(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Reorder level" type="number" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
          <Button type="submit" className="bg-[#F97316]">Add</Button>
        </div>
      </form>
      )}

      {tab === 'categories' && (
        <div className="mt-4">
          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Category name" className="px-3 py-2 rounded bg-[#0F0F10]" />
            <Button type="submit" className="bg-[#F97316]">Create</Button>
          </form>
          <ul className="mt-4">
            {categories.map(c => (
              <li key={c.id} className="p-2 border rounded mb-2">{c.name} <div className="text-sm text-white/60">{c.description}</div></li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="mt-4">
          <form onSubmit={handleCreateSupplier} className="flex gap-2">
            <input value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Supplier name" className="px-3 py-2 rounded bg-[#0F0F10]" />
            <Button type="submit" className="bg-[#F97316]">Create</Button>
          </form>
          <ul className="mt-4">
            {suppliers.map(s => (
              <li key={s.id} className="p-2 border rounded mb-2">{s.name} <div className="text-sm text-white/60">{s.contact}</div></li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'items' && (
        <ul className="mt-4">
          {items.map((it) => (
          <li key={it.id} className={`p-3 rounded border border-white/5 mb-2 ${typeof it.reorderLevel === 'number' && (it.quantity ?? 0) <= it.reorderLevel ? 'bg-yellow-900' : ''}`}>
            <div className="font-semibold">{it.name}</div>
            <div className="text-sm text-white/60">SKU: {it.sku || '-' } • Qty: {it.quantity ?? 0} {typeof it.reorderLevel === 'number' ? `• Reorder: ${it.reorderLevel}` : ''}</div>
          </li>
          ))}
        </ul>
      )}

      {tab === 'movements' && (
        <div className="mt-4">
          <form onSubmit={handleStockIn} className="flex gap-2">
            <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="px-3 py-2 rounded bg-[#0F0F10]">
              <option value="">-- Select Item --</option>
              {items.map(it => (<option key={it.id} value={it.id}>{it.name}</option>))}
            </select>
            <input value={String(quantity)} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Qty" type="number" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
            <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="px-3 py-2 rounded bg-[#0F0F10]">
              <option value="">-- Supplier --</option>
              {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <input value={batchNo} onChange={e => setBatchNo(e.target.value)} placeholder="Batch" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
            <input value={expiryDate} onChange={e => setExpiryDate(e.target.value)} placeholder="Expiry YYYY-MM-DD" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
            <input value={String(costPerUnit)} onChange={e => setCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Cost" type="number" step="0.01" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
            <Button type="submit" className="bg-[#F97316]">Stock In</Button>
          </form>
          <ul className="mt-4">
            {movements.map(m => (
              <li key={m.id} className="p-2 border rounded mb-2">{m.type} • {m.itemId} • {m.quantity} {m.unit}</li>
            ))}
          </ul>
        </div>
      )}
      
      {tab === 'alerts' && (
        <div className="mt-4">
          <h2 className="font-semibold">Alerts & Notifications</h2>
          <div className="mt-2">Low stock items: {alerts.lowStock?.length || 0}</div>
          <ul className="mt-2">
            {alerts.lowStock?.map((it: any) => (
              <li key={it.id} className="p-2 border rounded mb-2">{it.name} — Qty: {it.quantity} — Reorder level: {it.reorderLevel}</li>
            ))}
          </ul>

          <div className="mt-4">Expiring batches within 7 days: {alerts.expirySoon?.length || 0}</div>
          <ul className="mt-2">
            {alerts.expirySoon?.map((b: any) => (
              <li key={b.id} className="p-2 border rounded mb-2">Batch: {b.batchNo} — Item: {b.itemId} — Expiry: {b.expiryDate}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
