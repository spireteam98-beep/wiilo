"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
// Import the multi-tenant logic from your business library
import { 
    getBusinessData, 
    saveInvoice, 
    listBusinessStaff, 
    listBusinessTables 
} from '@/lib/business'; 

// --- Glassflow UI Helper Components ---

const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div
    className={`bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-4 ${className}`}
    style={{ backdropFilter: 'blur(10px)' as any }}
  >
    {children}
  </div>
);

const GlassInput = (props: any) => (
  <input
    {...props}
    className={`px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:ring-[#F97316] focus:border-[#F97316] transition-all duration-200 ${props.className || ''}`}
  />
);

const GlassSelect = (props: any) => (
  <select
    {...props}
    className={`px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:ring-[#F97316] focus:border-[#F97316] transition-all duration-200 ${props.className || ''}`}
    style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z' fill='white'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7em top 50%', backgroundSize: '0.65em auto' }}
  >
    {props.children}
  </select>
);

const GlassButton = (props: any) => (
  <Button
    {...props}
    className={`px-3 py-1 text-sm rounded-lg font-semibold transition-all duration-200 ${props.className || ''} ${
      props.variant === 'accent' 
        ? 'bg-[#F97316] hover:bg-orange-500 text-white shadow-lg shadow-orange-700/50' 
        : props.variant === 'danger'
        ? 'bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/50'
        : props.variant === 'quantity'
        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2 py-1 text-base leading-none'
        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
    }`}
  >
    {props.children}
  </Button>
);

// --- Main Component ---

export default function BillingPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { user } = useFirebaseAuth();
  const { id } = (params as any) as { id: string }; // Business ID

  // --- Real-time Data States ---
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [tableList, setTableList] = useState<any[]>([]);
  const [businessFinancials, setBusinessFinancials] = useState<any>(null);

  // --- POS Local States ---
  const [tab, setTab] = useState<'pos' | 'accounting' | 'reports' | 'discounts'>('pos');
  const [selectedStaffId, setSelectedStaffId] = useState(''); 
  const [currentTable, setCurrentTable] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [inventoryDeducted, setInventoryDeducted] = useState(0); 

  // --- Multi-Tenant Data Fetching ---
  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      setLoading(true);
      try {
        // Fetch all dynamic data keyed to this Business ID
        const [staffData, tables, bizInfo] = await Promise.all([
          listBusinessStaff(user, id),
          listBusinessTables(user, id),
          getBusinessData(user, id)
        ]);

        setStaffList(staffData || []);
        setTableList(tables || []);
        setBusinessFinancials(bizInfo?.financialSummary || { grossRevenue: 0, netRevenue: 0, cashBalance: 0, pendingPayments: 0, apDue: 0 });
      } catch (err) {
        console.error("Failed to load multi-tenant data", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  const calculateTotal = () => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.qty * item.price, 0);
    const taxRate = 0.10; 
    const serviceChargeRate = 0.05; 
    const totalDiscount = currentOrder.reduce((sum, item) => sum + (item.discount || 0), 0);
    const taxableSubtotal = subtotal - totalDiscount;
    const taxAmount = taxableSubtotal * taxRate;
    const serviceCharge = taxableSubtotal * serviceChargeRate;
    const finalTotal = taxableSubtotal + taxAmount + serviceCharge;

    return { subtotal, totalDiscount, taxAmount, serviceCharge, finalTotal };
  };
  
  const { subtotal, totalDiscount, taxAmount, serviceCharge, finalTotal } = calculateTotal();

  // --- Handlers ---

  const handleUpdateQuantity = (index: number, delta: number) => {
    const newOrder = [...currentOrder];
    const newQty = newOrder[index].qty + delta;
    if (newQty <= 0) {
      setCurrentOrder(currentOrder.filter((_, i) => i !== index));
    } else {
      newOrder[index].qty = newQty;
      setCurrentOrder(newOrder);
    }
  };

  const handleProcessPayment = async () => {
      if (finalTotal <= 0 || currentOrder.length === 0) return alert("Order is empty.");
      if (!selectedStaffId) return alert("ERROR: Staff ID must be selected.");

      const invoiceData = {
          businessId: id,
          staffId: selectedStaffId,
          tableId: currentTable,
          items: currentOrder,
          total: finalTotal,
          paymentMethod,
          status: 'Paid',
          timestamp: new Date().toISOString()
      };

      try {
          // Dynamic Save to Firestore
          await saveInvoice(user, id, invoiceData);
          
          window.print(); // Step 8.3: Final Bill Print
          
          alert(`Transaction finalized for Business ${id}. Table ${currentTable} is now available.`);
          
          // Reset State
          setCurrentOrder([]);
          setSelectedStaffId('');
          setCurrentTable('');
      } catch (err) {
          alert("Error saving transaction to database.");
      }
  };

  if (loading) return <div className="p-6 text-white bg-black min-h-screen">Loading Business Environment...</div>;

  return (
    <div className="p-6 text-white bg-black min-h-screen print:bg-white print:text-black">
      <h1 className="text-3xl font-extrabold mb-6 text-[#F97316] print:hidden">
        💰 Dynamic Billing <span className='text-xl text-white/50 ml-3'>[ID: {id}]</span>
      </h1>
      
      {/* Tab Navigation - Hidden on Print */}
      <div className="mt-4 flex flex-wrap gap-2 p-2 rounded-xl bg-white/5 border border-white/10 shadow-lg print:hidden">
        {['pos', 'accounting', 'reports', 'discounts'].map((t: any) => (
          <GlassButton 
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? 'bg-[#F97316]' : 'bg-transparent hover:bg-white/10'}
          >
            {t.toUpperCase()}
          </GlassButton>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'pos' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left: Order Management */}
            <div className="col-span-1 md:col-span-2 space-y-6">
              <GlassCard>
                <h2 className="text-xl font-bold mb-3">POS Operations</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {/* Staff selection linked to HR records */}
                    <GlassSelect value={selectedStaffId} onChange={(e: any) => setSelectedStaffId(e.target.value)}>
                        <option value="">-- Authenticate Staff --</option>
                        {staffList.map(s => (
                            <option key={s.id} value={s.staffId} className="bg-black">
                                {s.staffId} - {s.name}
                            </option>
                        ))}
                    </GlassSelect>

                    <GlassSelect value={currentTable} onChange={(e: any) => setCurrentTable(e.target.value)}>
                        <option value="">-- Select Table --</option>
                        {tableList.map(t => (
                            <option key={t.id} value={t.id} className="bg-black">{t.id} ({t.status})</option>
                        ))}
                    </GlassSelect>
                </div>

                <div className='mt-6 border-t border-white/10 pt-4'>
                    <h3 className="font-semibold mb-3">Live Order Details</h3>
                    <div className='space-y-2'>
                        {currentOrder.length > 0 ? currentOrder.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                                <span className='text-sm'>{item.name}</span>
                                <div className='flex items-center gap-4'>
                                    <div className='flex items-center gap-2'>
                                        <GlassButton variant="quantity" onClick={() => handleUpdateQuantity(index, -1)}>-</GlassButton>
                                        <span className='font-mono w-4 text-center'>{item.qty}</span>
                                        <GlassButton variant="quantity" onClick={() => handleUpdateQuantity(index, 1)}>+</GlassButton>
                                    </div>
                                    <span className='font-bold w-16 text-right'>${(item.qty * item.price).toFixed(2)}</span>
                                </div>
                            </div>
                        )) : <div className='text-center py-4 text-white/30 italic'>No items in current session</div>}
                    </div>
                </div>
              </GlassCard>

              {/* Summary Preview */}
              <GlassCard className="print:block">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70"><span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-white/70"><span>Taxes & Service:</span> <span>+${(taxAmount + serviceCharge).toFixed(2)}</span></div>
                    <div className="flex justify-between text-2xl font-black pt-2 border-t border-white/10">
                        <span>Grand Total:</span> 
                        <span className='text-[#F97316]'>${finalTotal.toFixed(2)}</span>
                    </div>
                </div>
              </GlassCard>
            </div>
            
            {/* Right: Payment Sidebar */}
            <div className="col-span-1">
                <GlassCard className='sticky top-4'>
                    <h2 className="text-xl font-bold mb-6">Settlement (Step 7-9)</h2>
                    <div className="space-y-4">
                        <label className='text-xs text-white/40 uppercase tracking-widest'>Select Payment Method</label>
                        <GlassSelect value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="w-full">
                            <option value="Cash">Cash</option>
                            <option value="Card">Credit/Debit Card</option>
                            <option value="Mobile">Mobile Wallet / UPI</option>
                        </GlassSelect>
                        
                        <GlassButton 
                            variant="accent" 
                            onClick={handleProcessPayment} 
                            className="w-full mt-4 py-4 text-lg"
                            disabled={currentOrder.length === 0 || !selectedStaffId}
                        >
                            Print & Close Order
                        </GlassButton>
                        {!selectedStaffId && <p className='text-red-400 text-[10px] text-center'>Staff authentication required to print.</p>}
                    </div>
                </GlassCard>
            </div>
          </div>
        )}

        {/* Dynamic Financials Tab */}
        {tab === 'accounting' && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <GlassCard>
              <h2 className="text-xl font-bold mb-4">Live Ledger (Tenant: {id})</h2>
              <div className="space-y-4">
                <div className='p-4 bg-white/5 rounded-xl'>
                    <div className="flex justify-between text-sm mb-2">
                        <span className='text-white/50'>Accounts Receivable:</span> 
                        <span className='text-yellow-400 font-bold'>${businessFinancials?.pendingPayments.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className='text-white/50'>Cash in Hand:</span> 
                        <span className='text-green-400 font-bold'>${businessFinancials?.cashBalance.toFixed(2)}</span>
                    </div>
                </div>
                <GlassButton className='w-full'>Download Full Sales Ledger</GlassButton>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Tab Placeholders - Multi-tenant enabled */}
        {['reports', 'discounts'].includes(tab) && (
            <GlassCard className="py-20 text-center text-white/30">
                <p>Generating Dynamic {tab.toUpperCase()} Data for Business {id}...</p>
            </GlassCard>
        )}
      </div>
    </div>
  );
}