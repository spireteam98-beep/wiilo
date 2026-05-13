"use client";

import React, { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
// Import existing logic from your business library
import { 
    getBusinessData, 
    saveInvoice, 
    listBusinessStaff, 
    listBusinessTables,
    listInventory // Added to fetch products/items
} from '@/lib/business'; 

// --- Glassflow UI Helper Components ---
const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-4 ${className}`} style={{ backdropFilter: 'blur(10px)' as any }}>
    {children}
  </div>
);

const GlassInput = (props: any) => (
  <input {...props} className={`px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:ring-[#F97316] focus:border-[#F97316] transition-all duration-200 ${props.className || ''}`} />
);

const GlassSelect = (props: any) => (
  <select {...props} className={`px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:ring-[#F97316] focus:border-[#F97316] transition-all duration-200 ${props.className || ''}`} style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z' fill='white'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7em top 50%', backgroundSize: '0.65em auto' }}>
    {props.children}
  </select>
);

const GlassButton = (props: any) => (
  <Button {...props} className={`px-3 py-1 text-sm rounded-lg font-semibold transition-all duration-200 ${props.className || ''} ${
      props.variant === 'accent' ? 'bg-[#F97316] hover:bg-orange-500 text-white shadow-lg shadow-orange-700/50' : 
      props.variant === 'danger' ? 'bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/50' : 
      props.variant === 'quantity' ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2 py-1' : 
      'bg-white/10 hover:bg-white/20 text-white border border-white/20'
    }`}
  >
    {props.children}
  </Button>
);

export default function BillingPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useFirebaseAuth();
  const resolvedParams = use(params); // Next.js 15 Param Unwrap
  const id = resolvedParams.id;

  // --- Real-time Data State ---
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [tableList, setTableList] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  // --- POS Local Session State ---
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Load Data for current Tenant
  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      setLoading(true);
      try {
        const [staff, tables, items] = await Promise.all([
            listBusinessStaff(user, id),
            listBusinessTables(user, id),
            listInventory(user, id) // Get items from Inventory module
        ]);
        setStaffList(staff || []);
        setTableList(tables || []);
        setInventoryItems(items || []);
      } catch (err) {
        console.error("Failed to load multi-tenant financial data", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  const handleAddItem = (e: any) => {
    const itemId = e.target.value;
    if (!itemId) return;

    const item = inventoryItems.find(it => it.id === itemId);
    if (!item) return;

    setCurrentOrder(prev => {
        const existing = prev.find(i => i.id === itemId);
        if (existing) {
            return prev.map(i => i.id === itemId ? { ...i, qty: i.qty + 1 } : i);
        }
        return [...prev, { 
            id: item.id, 
            name: item.name, 
            price: item.unitPrice || 0, 
            qty: 1 
        }];
    });
    e.target.value = ""; // Reset select
  };

  const calculateTotal = () => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.qty * item.price, 0);
    const tax = subtotal * 0.15; 
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };
  
  const { subtotal, tax, total } = calculateTotal();

  const handlePrintAndSave = async () => {
    if (!selectedStaffId || !selectedTable || currentOrder.length === 0) {
        alert("Selection Required: Staff, Table, and Items.");
        return;
    }

    const invoiceData = {
        businessId: id,
        staffId: selectedStaffId,
        tableId: selectedTable,
        items: currentOrder,
        total,
        paymentMethod,
        status: 'Paid',
        createdAt: new Date().toISOString()
    };

    try {
        await saveInvoice(user, id, invoiceData);
        window.print();
        setCurrentOrder([]);
        setSelectedTable('');
        alert("Bill processed and table cleared.");
    } catch (err) {
        alert("Error saving bill.");
    }
  };

  if (loading) return <div className="p-10 text-white bg-black min-h-screen">Syncing Inventory & Staff...</div>;

  return (
    <div className="p-6 text-white bg-black min-h-screen print:bg-white print:text-black">
      <h1 className="text-3xl font-extrabold mb-6 text-[#F97316] print:hidden">
        💰 Terminal POS <span className="text-sm font-normal text-white/40">Tenant: {id}</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">1. Assign Waiter & Table</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <GlassSelect value={selectedStaffId} onChange={(e: any) => setSelectedStaffId(e.target.value)}>
                    <option value="">-- Select Staff ID --</option>
                    {staffList.map(s => <option key={s.id} value={s.staffId} className="bg-black">{s.staffId} - {s.name}</option>)}
                </GlassSelect>
                <GlassSelect value={selectedTable} onChange={(e: any) => setSelectedTable(e.target.value)}>
                    <option value="">-- Select Table --</option>
                    {tableList.map(t => <option key={t.id} value={t.tableNo} className="bg-black">{t.tableNo} ({t.status})</option>)}
                </GlassSelect>
            </div>

            <h2 className="text-xl font-bold mb-4 border-t border-white/10 pt-4">2. Add Inventory Items</h2>
            <GlassSelect onChange={handleAddItem}>
                <option value="">-- Add Item from Inventory --</option>
                {inventoryItems.map(it => (
                    <option key={it.id} value={it.id} className="bg-black">
                        {it.name} - ${it.unitPrice?.toFixed(2) || '0.00'} (Stock: {it.quantity})
                    </option>
                ))}
            </GlassSelect>
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold text-white/60 mb-3">Order Basket</h3>
            <div className="space-y-2">
                {currentOrder.length > 0 ? (
                    currentOrder.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-sm font-medium">{item.name}</span>
                        <div className="flex items-center gap-6">
                            <span className="text-xs text-white/40">${item.price.toFixed(2)} ea</span>
                            <span className="font-bold text-[#F97316]">x{item.qty}</span>
                            <span className="w-16 text-right font-mono">${(item.qty * item.price).toFixed(2)}</span>
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="py-10 text-center text-white/20 italic">Empty basket. Select items above.</div>
                )}
            </div>
          </GlassCard>
        </div>

        <div className="col-span-1">
          <GlassCard className="sticky top-6 border-[#F97316]/20">
            <h2 className="text-xl font-bold mb-6">3. Summary</h2>
            <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm"><span className="text-white/50">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/50">Tax (15%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-3xl font-black pt-4 border-t border-white/10">
                    <span>Total</span><span className="text-[#F97316]">${total.toFixed(2)}</span>
                </div>
            </div>

            <div className="space-y-4">
                <GlassSelect value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="w-full">
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Mobile">Mobile Wallet</option>
                </GlassSelect>
                <GlassButton 
                    variant="accent" 
                    className="w-full py-5 text-xl" 
                    onClick={handlePrintAndSave}
                    disabled={!selectedStaffId || currentOrder.length === 0}
                >
                    Print Bill & Finalize
                </GlassButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}