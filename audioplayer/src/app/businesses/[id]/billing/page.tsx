"use client";

import React, { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { 
    getBusinessData, 
    saveInvoice, 
    listBusinessStaff, 
    listBusinessTables,
    listInventory 
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
      props.variant === 'quantity' ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2 py-1 text-base leading-none min-w-[32px]' : 
      'bg-white/10 hover:bg-white/20 text-white border border-white/20'
    }`}
  >
    {props.children}
  </Button>
);

export default function BillingPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useFirebaseAuth();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  // --- Real-time Data States ---
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tab, setTab] = useState<'pos' | 'accounting' | 'reports' | 'discounts'>('pos');
  
  const [staffList, setStaffList] = useState<any[]>([]);
  const [tableList, setTableList] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [businessFinancials, setBusinessFinancials] = useState<any>(null);

  // --- POS Local Session State ---
  const [staffId, setStaffId] = useState('');
  const [currentTable, setCurrentTable] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Multi-Tenant Data Sync
  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      try {
        setLoading(true);
        const [staff, tables, items, bizData] = await Promise.all([
          listBusinessStaff(user, id),
          listBusinessTables(user, id),
          listInventory(user, id),
          getBusinessData(user, id)
        ]);
        setStaffList(staff || []);
        setTableList(tables || []);
        setInventoryItems(items || []);
        setBusinessFinancials(bizData?.financialSummary || { grossRevenue: 0, netRevenue: 0, cashBalance: 0, pendingPayments: 0, apDue: 0 });
      } catch (err) {
        console.error("Multi-tenant sync failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  // --- POS Handlers ---
  const handleAddItem = (e: any) => {
    const itemId = e.target.value;
    if (!itemId) return;
    const product = inventoryItems.find(it => it.id === itemId);
    if (!product) return;

    setCurrentOrder(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) {
        return prev.map(i => i.id === itemId ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: product.unitPrice || 0, qty: 1 }];
    });
    e.target.value = ""; 
  };

  const handleUpdateQuantity = (e: React.MouseEvent, index: number, delta: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevents double-increment
    setCurrentOrder(prev => {
      const newOrder = [...prev];
      const newQty = newOrder[index].qty + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== index);
      newOrder[index] = { ...newOrder[index], qty: newQty };
      return newOrder;
    });
  };

  const calculateTotal = () => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.qty * item.price, 0);
    const tax = subtotal * 0.10; 
    const finalTotal = subtotal + tax;
    return { subtotal, tax, finalTotal };
  };
  
  const { subtotal, tax, finalTotal } = calculateTotal();

  const handlePrintAndSave = async () => {
    if (!staffId || !currentTable) return alert("Select Staff and Table first.");
    if (currentOrder.length === 0) return alert("Basket is empty.");
    if (isSaving) return;

    setIsSaving(true);
    const invoiceData = {
      businessId: id,
      staffId,
      tableId: currentTable,
      orderItems: currentOrder.map(item => ({
        itemId: item.id,
        name: item.name,
        qty: item.qty,
        unitPrice: item.price,
        totalPrice: item.qty * item.price
      })),
      totalAmount: finalTotal,
      paymentMethod,
      status: 'Paid',
      timestamp: new Date().toISOString()
    };

    try {
      await saveInvoice(user, id, invoiceData);
      window.print();
      setCurrentOrder([]);
      setCurrentTable('');
      alert("Bill Saved & Closed.");
    } catch (err) {
      alert("Firestore Error: Transaction failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-white bg-black min-h-screen">Connecting to Business ID {id}...</div>;

  return (
    <div className="p-6 text-white bg-black min-h-screen print:bg-white print:text-black">
      <h1 className="text-3xl font-extrabold mb-6 text-[#F97316] print:hidden">
        💰 Financial & POS Management <span className="text-sm font-normal text-white/40 ml-3">[{id}]</span>
      </h1>

      {/* Primary Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-white/5 border border-white/10 mb-6 print:hidden">
        {['pos', 'accounting', 'reports', 'discounts'].map((t: any) => (
          <GlassButton key={t} onClick={() => setTab(t)} className={tab === t ? 'bg-[#F97316]' : ''}>
            {t.toUpperCase()}
          </GlassButton>
        ))}
      </div>

      <div className="mt-6">
        {/* MODULE 1: POS & BILLING */}
        {tab === 'pos' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <GlassCard>
                <h2 className="text-xl font-bold mb-4 text-[#F97316]">Order Session</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <GlassSelect value={staffId} onChange={(e: any) => setStaffId(e.target.value)}>
                        <option value="">-- Authenticate Staff --</option>
                        {staffList.map(s => <option key={s.id} value={s.staffId} className="bg-black">{s.name} ({s.staffId})</option>)}
                    </GlassSelect>
                    <GlassSelect value={currentTable} onChange={(e: any) => setCurrentTable(e.target.value)}>
                        <option value="">-- Active Table --</option>
                        {tableList.map(t => <option key={t.id} value={t.tableNo} className="bg-black">{t.tableNo} - {t.status}</option>)}
                    </GlassSelect>
                </div>

                <h3 className="font-semibold mb-2 pt-4 border-t border-white/10">Add Items</h3>
                <GlassSelect onChange={handleAddItem} disabled={!staffId || !currentTable}>
                    <option value="">-- Pick from Inventory --</option>
                    {inventoryItems.map(it => (
                        <option key={it.id} value={it.id} className="bg-black">{it.name} (${it.unitPrice?.toFixed(2)})</option>
                    ))}
                </GlassSelect>
              </GlassCard>

              <GlassCard>
                <h3 className="font-semibold text-white/60 mb-3">Live Order Details (Table: {currentTable || 'None'})</h3>
                <div className="space-y-2">
                    {currentOrder.length > 0 ? currentOrder.map((item, idx) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-sm font-medium">{item.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="mr-4 font-mono text-[#F97316]">${(item.qty * item.price).toFixed(2)}</span>
                                <GlassButton variant="quantity" onClick={(e) => handleUpdateQuantity(e, idx, -1)}>-</GlassButton>
                                <span className="w-6 text-center font-bold">{item.qty}</span>
                                <GlassButton variant="quantity" onClick={(e) => handleUpdateQuantity(e, idx, 1)}>+</GlassButton>
                                <GlassButton variant="danger" className="ml-2" onClick={() => setCurrentOrder(currentOrder.filter((_, i) => i !== idx))}>✕</GlassButton>
                            </div>
                        </div>
                    )) : <p className="text-center text-white/20 py-10">Assign staff & table to start order.</p>}
                </div>
              </GlassCard>
            </div>

            <div className="col-span-1">
              <GlassCard className="sticky top-4 border-[#F97316]/30">
                <h2 className="text-xl font-bold mb-4">Total Settlement</h2>
                <div className="text-center text-5xl font-black mb-8 text-green-400">
                  ${finalTotal.toFixed(2)}
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] uppercase text-white/40 tracking-widest block">Payment Method</label>
                    <GlassSelect value={paymentMethod} onChange={(e:any) => setPaymentMethod(e.target.value)} className="w-full">
                        <option value="Cash">Cash</option>
                        <option value="Card">Credit Card</option>
                        <option value="Mobile">Mobile Wallet</option>
                    </GlassSelect>
                    <GlassButton 
                        variant="accent" 
                        className="w-full py-5 text-xl" 
                        onClick={handlePrintAndSave} 
                        disabled={currentOrder.length === 0 || !staffId || isSaving}
                    >
                      {isSaving ? "Saving..." : "PRINT & FINALIZE"}
                    </GlassButton>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* MODULE 2: ACCOUNTING & CASH */}
        {tab === 'accounting' && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <GlassCard>
              <h2 className="text-xl font-bold mb-4 text-[#F97316]">General Ledger Summary</h2>
              <div className="space-y-4">
                <div className='p-4 bg-white/5 rounded-xl border border-white/10'>
                    <div className="flex justify-between text-sm mb-2"><span className='text-white/50'>Cash Balance:</span> <span className='text-green-400 font-bold'>${businessFinancials?.cashBalance.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className='text-white/50'>Customer Dues (AR):</span> <span className='text-yellow-400 font-bold'>${businessFinancials?.pendingPayments.toFixed(2)}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <GlassButton className="w-full">Log Expense</GlassButton>
                    <GlassButton className="w-full">Cash Reconciliation</GlassButton>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
                <h2 className="text-xl font-bold mb-4">Receivables / Payables</h2>
                <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs text-red-200">Current AP Liability: ${businessFinancials?.apDue.toFixed(2)}</p>
                    <GlassButton variant="danger" className="mt-3 w-full">Pay Suppliers</GlassButton>
                </div>
            </GlassCard>
          </div>
        )}

        {/* MODULE 3: REPORTS */}
        {tab === 'reports' && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold mb-6 text-[#F97316]">Financial Intelligence</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                    <div className="text-[10px] text-white/40 uppercase">Gross Sales</div>
                    <div className="text-2xl font-bold text-green-400">${businessFinancials?.grossRevenue.toFixed(2)}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                    <div className="text-[10px] text-white/40 uppercase">Net Profit</div>
                    <div className="text-2xl font-bold">${businessFinancials?.netRevenue.toFixed(2)}</div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <GlassButton className="w-full py-4">Daily Sales Report</GlassButton>
                <GlassButton className="w-full py-4">Inventory Valuation</GlassButton>
                <GlassButton className="w-full py-4" variant="accent">Download Tax Summary</GlassButton>
            </div>
          </GlassCard>
        )}

        {/* MODULE 4: DISCOUNTS */}
        {tab === 'discounts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard>
                    <h2 className="text-xl font-bold mb-4 text-[#F97316]">Promotions & Loyalty</h2>
                    <div className="space-y-4">
                        <GlassInput placeholder="Coupon Code (e.g. SAVE20)" className="w-full" />
                        <GlassSelect className="w-full">
                            <option value="pct">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                        </GlassSelect>
                        <GlassButton variant="accent" className="w-full">Create Promotion</GlassButton>
                    </div>
                </GlassCard>
            </div>
        )}
      </div>
    </div>
  );
}