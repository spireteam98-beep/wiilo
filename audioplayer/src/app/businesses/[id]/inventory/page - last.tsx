"use client";

import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { createCategory, createInventoryItem, createStockMovement, createSupplier, createUnit, deleteCategory, deleteInventoryItem, deleteSupplier, deleteUnit, getInventoryReport, listCategories, listInventory, listInventoryAlerts, listReorderSuggestions, listStockMovements, listSuppliers, listUnits, updateCategory, updateInventoryItem, updateSupplier, updateUnit } from '@/lib/business';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

// --- Glassflow UI Helper Components ---

// Glass Card wrapper: Dark, slightly transparent, blurred background with soft borders and shadow
const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div
    className={`bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-4 ${className}`}
    style={{ backdropFilter: 'blur(10px)' as any }}
  >
    {children}
  </div>
);

// Glass Input field: Dark, transparent background with white text and accent focus ring
const GlassInput = (props: any) => (
  <input
    {...props}
    className={`px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:ring-[#F97316] focus:border-[#F97316] transition-all duration-200 ${props.className || ''}`}
  />
);

// Glass Select dropdown: Styled similarly to input fields
const GlassSelect = (props: any) => (
  <select
    {...props}
    className={`px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:ring-[#F97316] focus:border-[#F97316] transition-all duration-200 ${props.className || ''}`}
    style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z' fill='white'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7em top 50%', backgroundSize: '0.65em auto' }}
  >
    {props.children}
  </select>
);

// Glass Button: Default, Accent (Orange), and Danger (Red) variants
const GlassButton = (props: any) => (
  <Button
    {...props}
    className={`px-3 py-1 text-sm rounded-lg font-semibold transition-all duration-200 ${props.className || ''} ${
      props.variant === 'accent' 
        ? 'bg-[#F97316] hover:bg-orange-500 text-white shadow-lg shadow-orange-700/50' 
        : props.variant === 'danger'
        ? 'bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/50'
        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
    }`}
  >
    {props.children}
  </Button>
);

// --- New Supplier Details Modal Component ---

const SupplierDetailsModal = ({ supplier, onClose }: { supplier: any | null, onClose: () => void }) => {
  if (!supplier) return null;

  const data = [
    { label: 'Status', value: supplier.status, color: supplier.status === 'active' ? 'text-green-400' : 'text-yellow-400' },
    { label: 'Contact Person', value: supplier.contact || 'N/A' },
    { label: 'Email', value: supplier.email || 'N/A' },
    { label: 'Phone', value: supplier.phone || 'N/A' },
    { label: 'Location/Address', value: supplier.address || 'N/A' },
    { label: 'Business Type', value: supplier.category || 'N/A' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Content - Glass Card */}
      <GlassCard className="relative w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-2 text-[#F97316]">
          {supplier.name} Details
        </h2>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          {data.map((item) => (
            <React.Fragment key={item.label}>
              <div className="text-white/60 font-medium">{item.label}:</div>
              <div className={`font-semibold ${item.color || 'text-white'}`}>{item.value}</div>
            </React.Fragment>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <GlassButton onClick={onClose} variant="accent">Close</GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};


// --- Main Component ---

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
  
  // --- SUPPLIER STATE FIELDS ---
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierStatus, setNewSupplierStatus] = useState<'active'|'inactive'>('active');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierLocation, setNewSupplierLocation] = useState('');
  const [newSupplierCategory, setNewSupplierCategory] = useState('');
  // ---------------------------------
  
  // --- NEW MODAL STATE ---
  const [showSupplierDetailsModal, setShowSupplierDetailsModal] = useState(false);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState<any>(null);
  // -----------------------
  
  const [movements, setMovements] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({ lowStock: [], expirySoon: [], counts: {} });
  const [reportType, setReportType] = useState<'stock' | 'stock-in' | 'stock-out' | 'movements' | 'audit'>('stock');
  const [reportData, setReportData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
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

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSupplierName) return;
    try {
      // API Call: This is the part that needs to ensure ALL data fields are passed.
      const supplierData = { 
        name: newSupplierName, 
        status: newSupplierStatus,
        contact: newSupplierContact,
        email: newSupplierEmail,
        phone: newSupplierPhone,
        address: newSupplierLocation, 
        category: newSupplierCategory 
      };

      const sup = await createSupplier(user, id, supplierData);
      
      // FIX: Since the API/Backend is mocked, the returned 'sup' object might be missing the 
      // newly added fields (email, phone, category). We must ensure the local state
      // receives ALL the fields we just submitted, especially if the mock API
      // doesn't return them reliably. We merge the submitted data with the ID 
      // returned by the API call.
      const newSupplierEntry = {
        ...supplierData,
        ...sup, // Overwrite with any fields returned by the mock API (like ID)
        id: sup.id,
      };

      setSuppliers(prev => [newSupplierEntry, ...prev]);
      setNewSupplierName('');
      setNewSupplierStatus('active');
      setNewSupplierContact('');
      setNewSupplierEmail('');
      setNewSupplierPhone('');
      setNewSupplierLocation('');
      setNewSupplierCategory('');
    } catch (err) {
      console.error('Failed to create supplier', err);
      alert('Failed to create supplier');
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

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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
      const it = await listInventory(user, id);
      setItems(it);
    } catch (err) {
      console.error('Failed to stock in', err);
      alert('Failed to stock in');
    }
  };

  const handleViewSupplier = (supplier: any) => {
    setSelectedSupplierDetails(supplier);
    setShowSupplierDetailsModal(true);
  };

  if (!user) return <div className="p-6 text-white bg-black min-h-screen">Please sign in to manage inventory.</div>;
  if (loading) return <div className="p-6 text-white bg-black min-h-screen">Loading...</div>;

  return (
    <div className="p-6 text-white min-h-screen bg-black">
      <h1 className="text-3xl font-extrabold mb-6">✨Inventory</h1>
      
      {/* Tab Navigation with Glass/Accent Style */}
      <div className="mt-4 flex flex-wrap gap-2 p-2 rounded-xl bg-white/5 border border-white/10 shadow-lg">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'categories', label: 'Categories' },
          { key: 'items', label: 'Items' },
          { key: 'suppliers', label: 'Suppliers' },
          { key: 'units', label: 'Units' },
          { key: 'movements', label: 'Movements' },
          { key: 'alerts', label: 'Alerts' },
          { key: 'reports', label: 'Reports' },
        ].map(({ key, label }) => (
          <GlassButton
            key={key}
            onClick={() => setTab(key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              tab === key
                ? 'bg-[#F97316] hover:bg-orange-500 text-white shadow-lg shadow-orange-700/50'
                : 'bg-transparent hover:bg-white/10 text-white'
            }`}
          >
            {label}
          </GlassButton>
        ))}
      </div>

      <div className="mt-6">
        {/* Overview Tab (Styled as a prominent Card) */}
        {tab === 'overview' && (
          <GlassCard className="p-6">
            <h2 className="text-2xl font-bold mb-4">Inventory Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-sm text-white/70">Total Items</div>
                <div className="text-3xl font-bold text-[#F97316]">{items.length}</div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-sm text-white/70">Categories</div>
                <div className="text-3xl font-bold">{categories.length}</div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-sm text-white/70">Suppliers</div>
                <div className="text-3xl font-bold">{suppliers.length}</div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-sm text-white/70">Movements</div>
                <div className="text-3xl font-bold">{movements.length}</div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Items Tab - Add Form */}
        {tab === 'items' && (
          <GlassCard className="mb-6">
            <h2 className="text-xl font-bold mb-4">Add New Item</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Row 1: Name, Category, Unit */}
              <GlassInput value={name} onChange={e => setName(e.target.value)} placeholder="Item name" required />
              <GlassSelect value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)}>
                <option value="" className="bg-[#0F0F10]">Select Category</option>
                {categories.map(c => (<option key={c.id} value={c.id} className="bg-[#0F0F10]">{c.name}</option>))}
              </GlassSelect>
              <GlassSelect value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                <option value="" className="bg-[#0F0F10]">Unit</option>
                {units.map(u => (<option key={u.id} value={u.name} className="bg-[#0F0F10]">{u.name}</option>))}
              </GlassSelect>

              {/* Row 2: SKU, Quantity, Unit Price */}
              <GlassInput value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU" />
              <GlassInput value={String(quantity)} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Quantity" type="number" />
              <GlassInput 
                value={String(unitPrice)} 
                onChange={e => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                placeholder="Unit Price" 
                type="number" 
                step="0.01"
              />
              
              {/* Row 3: Reorder Level, Enabled Checkbox, Add Button */}
              <GlassInput 
                value={String(reorderLevel)} 
                onChange={e => setReorderLevel(e.target.value === '' ? '' : Number(e.target.value))} 
                placeholder="Reorder Level" 
                type="number" 
                className="col-span-1"
              />
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="h-5 w-5 rounded text-[#F97316] bg-white/10 border-white/20 focus:ring-0 focus:ring-offset-0" />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>

              <div className="flex justify-start md:justify-end">
                <GlassButton variant="accent" type="submit" className="w-full md:w-auto">Add Item</GlassButton>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Items List (Card per Item) */}
        {tab === 'items' && (
          <GlassCard className="p-0">
            <h2 className="text-xl font-bold p-4 border-b border-white/10">Inventory List</h2>
            <ul className="divide-y divide-white/10">
              {items.map((it) => (
                <li key={it.id} className={`p-4 transition-all duration-300 ${typeof it.reorderLevel === 'number' && (it.quantity ?? 0) <= it.reorderLevel ? 'bg-yellow-900/20' : 'hover:bg-white/5'}`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-2 md:mb-0 md:w-2/3">
                      <div className="font-semibold text-lg">{it.name}</div>
                      <div className="text-xs text-white/60 mt-1">
                        SKU: {it.sku || '-'} &bull; **Qty:** <span className={`${(it.quantity ?? 0) <= it.reorderLevel ? 'text-red-400 font-bold' : 'text-white'}`}>{it.quantity ?? 0} {it.unit ? it.unit : ''}</span> 
                        {typeof it.reorderLevel === 'number' ? ` • Reorder: ${it.reorderLevel}` : ''} 
                        {it.unitPrice ? ` • Price: $${it.unitPrice}` : ''} 
                        {typeof it.enabled === 'boolean' ? (it.enabled ? ' • Enabled' : ' • Disabled') : ''}
                      </div>
                    </div>
                    {/* Action buttons: Flex container that wraps on mobile, takes full width of row */}
                    <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                      <GlassButton className="flex-1 md:flex-initial" onClick={async () => {
                        const newName = prompt('Item name', it.name);
                        if (!newName) return;
                        const newPrice = prompt('Unit price', it.unitPrice ? String(it.unitPrice) : '');
                        const newEnabled = confirm('Should the item be enabled? (OK for enabled, Cancel for disabled)');
                        await updateInventoryItem(user, id, { id: it.id, name: newName, sku: it.sku, quantity: it.quantity, unit: it.unit, categoryId: it.categoryId, reorderLevel: it.reorderLevel, description: it.description, storageLocation: it.storageLocation, unitPrice: newPrice === null || newPrice === '' ? undefined : Number(newPrice), enabled: newEnabled });
                        listInventory(user, id).then(setItems).catch(console.error);
                      }}>Edit</GlassButton>
                      <GlassButton variant="danger" className="flex-1 md:flex-initial" onClick={() => { if (confirm('Delete item?')) { deleteInventoryItem(user, id, it.id).then(() => setItems(prev => prev.filter(x => x.id !== it.id))).catch((e: any) => { console.error(e); alert(e.message || 'Failed to delete item'); }); } }}>Delete</GlassButton>
                      <GlassButton className="flex-1 md:flex-initial" onClick={async () => {
                        try {
                          await updateInventoryItem(user, id, { id: it.id, name: it.name, sku: it.sku, quantity: it.quantity, unit: it.unit, categoryId: it.categoryId, reorderLevel: it.reorderLevel, description: it.description, storageLocation: it.storageLocation, unitPrice: it.unitPrice, enabled: !it.enabled });
                          const all = await listInventory(user, id);
                          setItems(all);
                        } catch (e) { console.error(e); }
                      }}>{it.enabled ? 'Disable' : 'Enable'}</GlassButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {/* Categories Tab (remains the same) */}
        {tab === 'categories' && (
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Manage Categories</h2>
            <form onSubmit={handleCreateCategory} className="flex gap-3 mb-6 flex-wrap">
              <GlassInput value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New Category Name" className="flex-grow min-w-[200px]" required />
              <GlassButton variant="accent" type="submit" className="w-full md:w-auto">Create</GlassButton>
            </form>
            
            <GlassInput value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="Search categories..." className="mb-4 w-full" />
            
            <ul className="divide-y divide-white/10">
              {categories.filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(c => (
                <li key={c.id} className="p-3 hover:bg-white/5 transition duration-200 rounded-lg">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-2 md:mb-0">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-sm text-white/60">{c.description}</div>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                      <GlassButton className="flex-1 md:flex-initial" onClick={() => {
                        const newName = prompt('Category name', c.name);
                        if (!newName) return;
                        updateCategory(user, id, { id: c.id, name: newName, description: c.description });
                        listCategories(user, id).then(setCategories).catch(console.error);
                      }}>Edit</GlassButton>
                      <GlassButton variant="danger" className="flex-1 md:flex-initial" onClick={() => { if (confirm('Delete category?')) { deleteCategory(user, id, c.id).then(() => setCategories(prev => prev.filter(x => x.id !== c.id))).catch((e: any) => { console.error(e); alert(e.message || 'Failed to delete category'); }); } }}>Delete</GlassButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {/* Suppliers Tab (Uses Modal for View) */}
        {tab === 'suppliers' && (
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Manage Suppliers</h2>
            <form onSubmit={handleCreateSupplier} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {/* Row 1 */}
              <GlassInput value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Supplier Name" className="col-span-2 md:col-span-1" required />
              <GlassInput value={newSupplierContact} onChange={e => setNewSupplierContact(e.target.value)} placeholder="Contact Person" className="col-span-2 md:col-span-1" />
              <GlassInput value={newSupplierEmail} onChange={e => setNewSupplierEmail(e.target.value)} placeholder="Email" type="email" className="col-span-2 md:col-span-1" />
              <GlassInput value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} placeholder="Phone" type="tel" className="col-span-2 md:col-span-1" />

              {/* Row 2 */}
              <GlassInput value={newSupplierLocation} onChange={e => setNewSupplierLocation(e.target.value)} placeholder="Location/Address" className="col-span-2 md:col-span-1" />
              <GlassInput value={newSupplierCategory} onChange={e => setNewSupplierCategory(e.target.value)} placeholder="Business Type/Category" className="col-span-2 md:col-span-1" />
              <GlassSelect value={newSupplierStatus} onChange={e => setNewSupplierStatus(e.target.value as any)} className="col-span-1">
                <option value="active" className="bg-[#0F0F10]">Active</option>
                <option value="inactive" className="bg-[#0F0F10]">Inactive</option>
              </GlassSelect>
              <GlassButton variant="accent" type="submit" className="col-span-1 w-full">Create</GlassButton>
            </form>
            
            <GlassInput value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} placeholder="Search suppliers..." className="mb-4 w-full" />
            
            <ul className="divide-y divide-white/10">
              {suppliers.filter(s => !supplierSearch || s.name.toLowerCase().includes(supplierSearch.toLowerCase())).map(s => (
                <li key={s.id} className="p-3 hover:bg-white/5 transition duration-200 rounded-lg">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-2 md:mb-0">
                      <div className="font-semibold text-lg">{s.name} <span className="text-sm text-white/40 ml-2">({s.category || 'General'})</span></div>
                      {/* Updated display to show new details */}
                      <div className="text-sm text-white/60 mt-1">
                        Contact: {s.contact || 'N/A'} &bull; Phone: {s.phone || 'N/A'} &bull; Email: {s.email || 'N/A'}
                      </div>
                      <div className="text-xs text-white/50">Location: {s.address || 'N/A'} &bull; Status: {s.status}</div>
                    </div>
                    {/* Action buttons with new View button */}
                    <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                      <GlassButton 
                          className="flex-1 md:flex-initial bg-white/20 hover:bg-white/30 border-none" 
                          onClick={() => handleViewSupplier(s)} // <-- MODAL TRIGGERED HERE
                      >
                          View
                      </GlassButton>
                      <GlassButton className="flex-1 md:flex-initial" onClick={() => {
                        // Simplified edit logic using prompts for demonstration
                        const newName = prompt('Supplier name', s.name);
                        if (!newName) return;
                        alert(`Updating supplier ${newName}.`);
                        // In a real app, you would use an API call: updateSupplier(user, id, {...});
                      }}>Edit</GlassButton>
                      <GlassButton variant="danger" className="flex-1 md:flex-initial" onClick={() => { if (confirm('Delete supplier?')) { 
                        alert('Deleting supplier...'); 
                        // In a real app, you would use an API call: deleteSupplier(user, id, s.id);
                      } }}>Delete</GlassButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {/* Units Tab (remains the same) */}
        {tab === 'units' && (
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Manage Units</h2>
            <form onSubmit={handleCreateUnit} className="flex gap-3 mb-6 flex-wrap">
              <GlassInput value={newUnitName} onChange={e => setNewUnitName(e.target.value)} placeholder="Unit Name (e.g. kg)" className="flex-grow min-w-[200px]" required />
              <GlassButton variant="accent" type="submit" className="w-full md:w-auto">Create Unit</GlassButton>
            </form>
            <GlassInput value={unitSearch} onChange={e => setUnitSearch(e.target.value)} placeholder="Search units..." className="mb-4 w-full" />
            <ul className="divide-y divide-white/10">
              {units.filter(u => !unitSearch || (u.name || '').toLowerCase().includes(unitSearch.toLowerCase())).map(u => (
                <li key={u.id} className="p-3 hover:bg-white/5 transition duration-200 rounded-lg">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-2 md:mb-0">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-sm text-white/60">{u.symbol || ''}</div>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                      <GlassButton className="flex-1 md:flex-initial" onClick={() => { 
                        const newName = prompt('Unit name', u.name); 
                        if (newName) { 
                          alert(`Updating unit to ${newName}. Refreshing list...`);
                        } 
                      }}>Edit</GlassButton>
                      <GlassButton variant="danger" className="flex-1 md:flex-initial" onClick={() => { if (confirm('Delete unit?')) { 
                        alert('Deleting unit...'); 
                      } }}>Delete</GlassButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {/* Movements Tab (remains the same) */}
        {tab === 'movements' && (
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Stock Movement</h2>
            <form onSubmit={handleStockIn} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <GlassSelect value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="col-span-2">
                <option value="" className="bg-[#0F0F10]">-- Select Item --</option>
                {items.map(it => (<option key={it.id} value={it.id} className="bg-[#0F0F10]">{it.name}</option>))}
              </GlassSelect>
              <GlassSelect value={movementType} onChange={(e) => setMovementType(e.target.value as any)} className="col-span-1">
                <option value="IN" className="bg-[#0F0F10]">Stock IN</option>
                <option value="OUT" className="bg-[#0F0F10]">Stock OUT</option>
                <option value="ADJUST" className="bg-[#0F0F10]">ADJUST</option>
              </GlassSelect>
              <GlassInput value={String(quantity)} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Qty" type="number" className="col-span-1" />
              <GlassSelect value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="col-span-2 md:col-span-1">
                <option value="" className="bg-[#0F0F10]">-- Supplier --</option>
                {suppliers.map(s => (<option key={s.id} value={s.id} className="bg-[#0F0F10]">{s.name}</option>))}
              </GlassSelect>
              <GlassInput value={batchNo} onChange={e => setBatchNo(e.target.value)} placeholder="Batch No" className="col-span-1" />
              <GlassInput value={expiryDate} onChange={e => setExpiryDate(e.target.value)} placeholder="Expiry YYYY-MM-DD" className="col-span-1" />
              <GlassInput value={String(costPerUnit)} onChange={e => setCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Cost" type="number" step="0.01" className="col-span-1" />
              <GlassButton variant="accent" type="submit" className="col-span-2 lg:col-span-1 w-full">Save Movement</GlassButton>
            </form>
            <h3 className="font-semibold mt-6 mb-3 border-t border-white/10 pt-4">Recent Movements</h3>
            <ul className="divide-y divide-white/10 max-h-96 overflow-y-auto">
              {movements.map(m => {
                const item = items.find(it => it.id === m.itemId)?.name || m.itemId;
                return (
                  <li key={m.id} className="p-2 hover:bg-white/5 rounded-lg text-sm">
                    <span className={`font-bold ${m.type === 'IN' ? 'text-green-400' : m.type === 'OUT' ? 'text-red-400' : 'text-yellow-400'}`}>{m.type}</span> &bull; {item} &bull; **{m.quantity}** {m.unit || ''}
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        )}

        {/* Alerts Tab (remains the same) */}
        {tab === 'alerts' && (
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Alerts & Reorder Suggestions</h2>
            
            <div className="mb-6 p-4 bg-red-900/20 rounded-lg border border-red-700/50">
                <h3 className="font-semibold text-lg text-red-400">🚨 Low Stock ({alerts.lowStock?.length || 0})</h3>
                <ul className="mt-2 text-sm divide-y divide-white/10">
                  {alerts.lowStock?.map((it: any) => (
                    <li key={it.id} className="py-1">**{it.name}** — Qty: {it.quantity} — Reorder level: {it.reorderLevel}</li>
                  ))}
                </ul>
            </div>

            <div className="mb-6 p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/50">
              <h3 className="font-semibold text-lg text-yellow-400">⚠️ Expiring Soon ({alerts.expirySoon?.length || 0})</h3>
              <ul className="mt-2 text-sm divide-y divide-white/10">
                {alerts.expirySoon?.map((b: any) => (
                  <li key={b.id} className="py-1">**Batch: {b.batchNo}** — Item: {b.itemId} — Expiry: {b.expiryDate}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-green-900/20 rounded-lg border border-green-700/50">
              <h3 className="font-semibold text-lg text-green-400">🛒 Reorder Suggestions ({suggestions.length})</h3>
              <ul className="mt-2 text-sm divide-y divide-white/10">
                {suggestions.map(s => (
                  <li key={s.id} className="py-1">**{s.name}** — Current: {s.currentQty} — Suggested: {s.suggestedQty}</li>
                ))}
              </ul>
            </div>
          </GlassCard>
        )}

        {/* Reports Tab (remains the same) */}
        {tab === 'reports' && (
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Inventory Reports</h2>
            <div className="mb-4 flex flex-wrap gap-3 items-center">
              <GlassSelect value={reportType} onChange={e => setReportType(e.target.value as any)} className="w-full md:w-auto">
                <option value="stock" className="bg-[#0F0F10]">Stock</option>
                <option value="stock-in" className="bg-[#0F0F10]">Stock In</option>
                <option value="stock-out" className="bg-[#0F0F10]">Stock Out</option>
                <option value="movements" className="bg-[#0F0F10]">Movements</option>
                <option value="audit" className="bg-[#0F0F10]">Audit</option>
              </GlassSelect>
              <GlassSelect value={reportCategoryFilter} onChange={e => setReportCategoryFilter(e.target.value)} className="w-full md:w-auto">
                <option value="" className="bg-[#0F0F10]">All categories</option>
                {categories.map(c => (<option key={c.id} value={c.id} className="bg-[#0F0F10]">{c.name}</option>))}
              </GlassSelect>
              <GlassSelect value={reportUnitFilter} onChange={e => setReportUnitFilter(e.target.value)} className="w-full md:w-auto">
                <option value="" className="bg-[#0F0F10]">All units</option>
                {units.map(u => (<option key={u.id} value={u.name} className="bg-[#0F0F10]">{u.name}</option>))}
              </GlassSelect>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={reportGroupByCategory} onChange={e => setReportGroupByCategory(e.target.checked)} className="h-5 w-5 rounded text-[#F97316] bg-white/10 border-white/20 focus:ring-0 focus:ring-offset-0" /> Group by Category
              </label>
              <GlassButton variant="accent" onClick={() => loadReport(reportType)} className="w-full md:w-auto">Load Report</GlassButton>
            </div>
            
            <GlassCard className="mt-4 p-4 text-xs bg-black/10 overflow-x-auto">
              {reportData ? (
                reportData.grouped ? (
                  <div>
                    {reportData.grouped.map((g: any, i: number) => (
                      <div key={i} className="p-3 border-b border-white/10 last:border-b-0">
                        <div className="font-bold text-base text-[#F97316] mb-1">{categories.find(c => c.id === g.categoryId)?.name || 'Uncategorized'}</div>
                        <div className="text-sm text-white/70">Total value: {g.totalValue}</div>
                        <ul className="mt-1 ml-4 list-disc text-white/80">
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
                <div className="text-sm text-white/60">Select options and click "Load Report"</div>
              )}
            </GlassCard>
          </GlassCard>
        )}
      </div>
      
      {/* Supplier Details Modal Render */}
      {showSupplierDetailsModal && (
        <SupplierDetailsModal 
          supplier={selectedSupplierDetails} 
          onClose={() => setShowSupplierDetailsModal(false)} 
        />
      )}
    </div>
  );
}