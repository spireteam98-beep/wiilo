"use client";

import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { createCategory, createInventoryItem, createStockMovement, createSupplier, createUnit, deleteCategory, deleteInventoryItem, deleteSupplier, deleteUnit, getInventoryReport, listCategories, listInventory, listInventoryAlerts, listReorderSuggestions, listStockMovements, listSuppliers, listUnits, updateCategory, updateInventoryItem, updateSupplier, updateUnit } from '@/lib/business';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function BusinessInventory({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Access params directly in this client component.
  const { id } = (params as any) as { id: string };
  const { user, userProfile } = useFirebaseAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const router = useRouter();
  const [tab, setTab] = useState<'overview' | 'categories' | 'items' | 'suppliers' | 'movements' | 'alerts' | 'reports' | 'units' | 'purchase-orders' | 'grn'>('overview');
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [poSupplierId, setPoSupplierId] = useState<string>('');
  const [poItems, setPoItems] = useState<{ itemId: string; quantity: number; unitPrice?: number | null }[]>([]);
  const [poAddItemId, setPoAddItemId] = useState<string>('');
  const [poAddQty, setPoAddQty] = useState<number | ''>('');
  const [poAddPrice, setPoAddPrice] = useState<number | ''>('');
  const [selectedPOId, setSelectedPOId] = useState<string>('');
  const [units, setUnits] = useState<any[]>([]);
  const [unitSearch, setUnitSearch] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [enabled, setEnabled] = useState(true);
  const [editingUnitId, setEditingUnitId] = useState<string>('');
  const [editingUnitName, setEditingUnitName] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [movements, setMovements] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({ lowStock: [], expirySoon: [], counts: {} });
  const [reportType, setReportType] = useState<'stock' | 'stock-in' | 'stock-out' | 'movements' | 'audit'>('stock');
  const [reportData, setReportData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierStatus, setNewSupplierStatus] = useState<'active'|'inactive'>('active');
  const [reorderLevel, setReorderLevel] = useState<number | ''>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'>('IN');
  const [transferTo, setTransferTo] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('');
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>('');
  const [reportUnitFilter, setReportUnitFilter] = useState<string>('');
  const [reportGroupByCategory, setReportGroupByCategory] = useState<boolean>(false);

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
        const us = await listUnits(user, id);
        setUnits(us);
        if (us && us.length > 0 && !selectedUnit) setSelectedUnit(us[0].name);
        const movs = await listStockMovements(user, id);
        setMovements(movs);
        // preload alerts
        try {
          const a = await listInventoryAlerts(user, id);
          setAlerts(a);
        } catch (e) {
          // ignore alerts failure
        }
        try {
          const s = await listReorderSuggestions(user, id);
          setSuggestions(s.suggestions || []);
        } catch (e) {
          // ignore suggestions
        }
        try { const pos = await listPurchaseOrders(user, id); setPurchaseOrders(pos || []); } catch (e) { }
        try {
          const r = await getInventoryReport(user, id, 'stock');
          setReportData(r);
        } catch (e) { /* ignore */ }
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
    if (!selectedCategoryId) return alert('Choose a category for the item');
    try {
      const item = await createInventoryItem(user, id, { name, sku, quantity: Number(quantity || 0), unit: selectedUnit || '', categoryId: selectedCategoryId || undefined, reorderLevel: typeof reorderLevel === 'number' ? reorderLevel : undefined, unitPrice: typeof unitPrice === 'number' ? unitPrice : undefined, enabled: Boolean(enabled) });
      setItems(prev => [item, ...prev]);
      setName(''); setSku(''); setQuantity(''); setSelectedUnit(''); setSelectedCategoryId(''); setReorderLevel(''); setUnitPrice(''); setEnabled(true);
    } catch (err) {
      console.error('Failed to add inventory item', err);
      alert('Failed to add item');
    }
  };

  const loadReport = async (type: typeof reportType) => {
    if (!user) return;
    try {
      setReportData(null);
      const r = await getInventoryReport(user, id, type, { categoryId: reportCategoryFilter || undefined, unit: reportUnitFilter || undefined, group: reportGroupByCategory ? 'category' : undefined });
      setReportData(r);
    } catch (err) {
      console.error('Failed to load report', err);
      alert('Failed to load report');
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
      const sup = await createSupplier(user, id, { name: newSupplierName, status: newSupplierStatus });
      setSuppliers(prev => [sup, ...prev]);
      setNewSupplierName('');
      setNewSupplierStatus('active');
    } catch (err) {
      console.error('Failed to create supplier', err);
      alert('Failed to create supplier');
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newUnitName) return;
    try {
      const u = await createUnit(user, id, { name: newUnitName });
      setUnits(prev => [u, ...prev]);
      setNewUnitName('');
    } catch (err) {
      console.error('Failed to create unit', err);
      alert('Failed to create unit');
    }
  };

  const handleUpdateUnit = async (u: any) => {
    if (!user) return;
    try {
      await updateUnit(user, id, { id: u.id, name: u.name });
      const all = await listUnits(user, id);
      setUnits(all);
      setEditingUnitId(''); setEditingUnitName('');
    } catch (err) {
      console.error('Failed to update unit', err);
      alert('Failed to update unit');
    }
  };

  const handleDeleteUnit = async (u: any) => {
    if (!user) return;
    if (!confirm(`Delete unit ${u.name}?`)) return;
    try {
      await deleteUnit(user, id, u.id);
      setUnits(prev => prev.filter(x => x.id !== u.id));
    } catch (err) {
      console.error('Failed to delete unit', err);
      alert('Failed to delete unit');
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // Simple stock in flow: create movement
    try {
      if (!selectedItemId) return alert('Choose an item');
      let movement;
      if (movementType === 'TRANSFER') {
        if (!transferTo) return alert('Specify transfer target');
        movement = await createStockMovement(user, id, { type: movementType, itemId: selectedItemId, quantity: Number(quantity || 0), transferTo, reason: '' });
      } else {
        movement = await createStockMovement(user, id, { type: movementType, itemId: selectedItemId, quantity: Number(quantity || 0), supplierId: selectedSupplierId || undefined, batchNo: batchNo || undefined, expiryDate: expiryDate || undefined, costPerUnit: typeof costPerUnit === 'number' ? costPerUnit : undefined, reason: movementType === 'OUT' ? 'consumption' : '' });
      }
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
        <button onClick={() => setTab('units')} className={`px-3 py-2 ${tab === 'units' ? 'bg-[#F97316]' : ''}`}>Units</button>
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
            <option value="">Select Category</option>
            {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0F0F10]">
            <option value="">Unit</option>
            {units.map(u => (<option key={u.id} value={u.name}>{u.name}</option>))}
          </select>
          <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
          <input value={String(unitPrice)} onChange={e => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Unit price" type="number" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
        <div className="flex gap-2">
          <input value={String(quantity)} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Quantity" type="number" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
          <input value={String(reorderLevel)} onChange={e => setReorderLevel(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Reorder level" type="number" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
          <label className="flex items-center gap-2 px-2 py-1">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="h-4 w-4" /> Enabled
          </label>
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
          <div className="mt-2">
            <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="Search categories" className="px-3 py-2 rounded bg-[#0F0F10]" />
          </div>
          <ul className="mt-4">
            {categories.filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(c => (
              <li key={c.id} className="p-2 border rounded mb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-sm text-white/60">{c.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 bg-white/5 rounded" onClick={() => {
                      const newName = prompt('Category name', c.name);
                      if (!newName) return;
                      updateCategory(user, id, { id: c.id, name: newName, description: c.description });
                      // refresh
                      listCategories(user, id).then(setCategories).catch(console.error);
                    }}>Edit</button>
                    <button className="px-2 py-1 bg-red-700 rounded" onClick={() => { if (confirm('Delete category?')) { deleteCategory(user, id, c.id).then(() => setCategories(prev => prev.filter(x => x.id !== c.id))).catch((e: any) => { console.error(e); alert(e.message || 'Failed to delete category'); }); } }}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="mt-4">
          <form onSubmit={handleCreateSupplier} className="flex gap-2">
            <input value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Supplier name" className="px-3 py-2 rounded bg-[#0F0F10]" />
            <select value={newSupplierStatus} onChange={e => setNewSupplierStatus(e.target.value as any)} className="px-3 py-2 rounded bg-[#0F0F10]">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button type="submit" className="bg-[#F97316]">Create</Button>
          </form>
          <div className="mt-2">
            <input value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} placeholder="Search suppliers" className="px-3 py-2 rounded bg-[#0F0F10]" />
          </div>
          <ul className="mt-4">
            {suppliers.filter(s => !supplierSearch || s.name.toLowerCase().includes(supplierSearch.toLowerCase())).map(s => (
              <li key={s.id} className="p-2 border rounded mb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-sm text-white/60">{s.contact} {s.status ? `• ${s.status}` : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 bg-white/5 rounded" onClick={() => {
                      const newName = prompt('Supplier name', s.name);
                      if (!newName) return;
                      const newStatus = confirm('Should the supplier be active? (OK for active, Cancel for inactive)') ? 'active' : 'inactive';
                      updateSupplier(user, id, { id: s.id, name: newName, contact: s.contact, address: s.address, priceList: s.priceList, status: newStatus });
                      listSuppliers(user, id).then(setSuppliers).catch(console.error);
                    }}>Edit</button>
                    <button className="px-2 py-1 bg-red-700 rounded" onClick={() => { if (confirm('Delete supplier?')) { deleteSupplier(user, id, s.id).then(() => setSuppliers(prev => prev.filter(x => x.id !== s.id))).catch((e: any) => { console.error(e); alert(e.message || 'Failed to delete supplier'); }); } }}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'items' && (
        <ul className="mt-4">
          {items.map((it) => (
          <li key={it.id} className={`p-3 rounded border border-white/5 mb-2 ${typeof it.reorderLevel === 'number' && (it.quantity ?? 0) <= it.reorderLevel ? 'bg-yellow-900' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{it.name}</div>
                <div className="text-sm text-white/60">SKU: {it.sku || '-' } • Qty: {it.quantity ?? 0} {it.unit ? it.unit : ''} {typeof it.reorderLevel === 'number' ? `• Reorder: ${it.reorderLevel}` : ''} {it.unitPrice ? `• Price: ${it.unitPrice}` : ''} { typeof it.enabled === 'boolean' ? (it.enabled ? '• Enabled' : '• Disabled') : '' }</div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 bg-white/5 rounded" onClick={async () => {
                  const newName = prompt('Item name', it.name);
                  if (!newName) return;
                  const newPrice = prompt('Unit price', it.unitPrice ? String(it.unitPrice) : '');
                  const newEnabled = confirm('Should the item be enabled? (OK for enabled, Cancel for disabled)');
                  await updateInventoryItem(user, id, { id: it.id, name: newName, sku: it.sku, quantity: it.quantity, unit: it.unit, categoryId: it.categoryId, reorderLevel: it.reorderLevel, description: it.description, storageLocation: it.storageLocation, unitPrice: newPrice === null || newPrice === '' ? undefined : Number(newPrice), enabled: newEnabled });
                  listInventory(user, id).then(setItems).catch(console.error);
                }}>Edit</button>
                <button className="px-2 py-1 bg-red-700 rounded" onClick={() => { if (confirm('Delete item?')) { deleteInventoryItem(user, id, it.id).then(() => setItems(prev => prev.filter(x => x.id !== it.id))).catch((e: any) => { console.error(e); alert(e.message || 'Failed to delete item'); }); } }}>Delete</button>
                <button className="px-2 py-1 bg-white/5 rounded" onClick={async () => {
                  try {
                    await updateInventoryItem(user, id, { id: it.id, name: it.name, sku: it.sku, quantity: it.quantity, unit: it.unit, categoryId: it.categoryId, reorderLevel: it.reorderLevel, description: it.description, storageLocation: it.storageLocation, unitPrice: it.unitPrice, enabled: !it.enabled });
                    const all = await listInventory(user, id);
                    setItems(all);
                  } catch (e) { console.error(e); }
                }}>{it.enabled ? 'Disable' : 'Enable'}</button>
              </div>
            </div>
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
            <select value={movementType} onChange={(e) => setMovementType(e.target.value as any)} className="px-3 py-2 rounded bg-[#0F0F10]">
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="ADJUST">ADJUST</option>
            </select>
            <input value={String(quantity)} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Qty" type="number" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
            <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="px-3 py-2 rounded bg-[#0F0F10]">
              <option value="">-- Supplier --</option>
              {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <input value={batchNo} onChange={e => setBatchNo(e.target.value)} placeholder="Batch" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
            <input value={expiryDate} onChange={e => setExpiryDate(e.target.value)} placeholder="Expiry YYYY-MM-DD" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
            <input value={String(costPerUnit)} onChange={e => setCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Cost" type="number" step="0.01" className="px-3 py-2 rounded-lg bg-[#0F0F10]" />
            <Button type="submit" className="bg-[#F97316]">Save Movement</Button>
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
          <div className="mt-4">Reorder suggestions: {suggestions.length}</div>
          <ul className="mt-2">
            {suggestions.map(s => (
              <li key={s.id} className="p-2 border rounded mb-2">{s.name} — Current: {s.currentQty} — Suggested: {s.suggestedQty}</li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'reports' && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Reports</h2>
          <div className="mt-2 flex gap-2">
            <select value={reportType} onChange={e => setReportType(e.target.value as any)} className="px-3 py-2 rounded bg-[#0F0F10]">
              <option value="stock">Stock</option>
              <option value="stock-in">Stock In</option>
              <option value="stock-out">Stock Out</option>
              <option value="movements">Movements</option>
              <option value="audit">Audit</option>
            </select>
            <select value={reportCategoryFilter} onChange={e => setReportCategoryFilter(e.target.value)} className="px-3 py-2 rounded bg-[#0F0F10]">
              <option value="">All categories</option>
              {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <select value={reportUnitFilter} onChange={e => setReportUnitFilter(e.target.value)} className="px-3 py-2 rounded bg-[#0F0F10]">
              <option value="">All units</option>
              {units.map(u => (<option key={u.id} value={u.name}>{u.name}</option>))}
            </select>
            <label className="flex items-center gap-2 px-2 py-1">
              <input type="checkbox" checked={reportGroupByCategory} onChange={e => setReportGroupByCategory(e.target.checked)} /> Group by Category
            </label>
            <Button onClick={() => loadReport(reportType)} className="bg-[#F97316]">Load</Button>
          </div>
          <div className="mt-3">
            {reportData ? (
              reportData.grouped ? (
                <div>
                  {reportData.grouped.map((g: any, i: number) => (
                    <div key={i} className="p-2 border rounded mb-2">
                      <div className="font-semibold">{g.categoryId || 'Uncategorized'}</div>
                      <div>Total value: {g.totalValue}</div>
                      <ul>
                        {g.items.map((it: any) => (
                          <li key={it.id}>{it.name} — Qty: {it.quantity} — Value: {it.stockValue}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(reportData, null, 2)}</pre>
              )
            ) : (
              <div className="text-sm text-white/60">No report loaded</div>
            )}
          </div>
        </div>
      )}
      {tab === 'units' && (
        <div className="mt-4">
          <form onSubmit={handleCreateUnit} className="flex gap-2">
            <input value={newUnitName} onChange={e => setNewUnitName(e.target.value)} placeholder="Unit name (e.g. kg)" className="px-3 py-2 rounded bg-[#0F0F10]" />
            <Button type="submit" className="bg-[#F97316]">Create Unit</Button>
          </form>
          <div className="mt-2">
            <input value={unitSearch} onChange={e => setUnitSearch(e.target.value)} placeholder="Search units" className="px-3 py-2 rounded bg-[#0F0F10]" />
          </div>
          <ul className="mt-4">
            {units.filter(u => !unitSearch || (u.name || '').toLowerCase().includes(unitSearch.toLowerCase())).map(u => (
              <li key={u.id} className="p-2 border rounded mb-2 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-sm text-white/60">{u.symbol || ''}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-white/5 rounded" onClick={() => { setEditingUnitId(u.id); setEditingUnitName(u.name); const newName = prompt('Unit name', u.name); if (newName) { updateUnit(user, id, { id: u.id, name: newName }).then(() => listUnits(user, id).then(setUnits).catch(console.error)).catch(console.error); } }}>Edit</button>
                  <button className="px-2 py-1 bg-red-700 rounded" onClick={() => { if (confirm('Delete unit?')) { deleteUnit(user, id, u.id).then(() => setUnits(prev => prev.filter(x => x.id !== u.id))).catch((e: any) => { console.error(e); alert(e.message || 'Failed to delete unit'); }); } }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
