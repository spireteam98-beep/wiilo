"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';

// --- Glassflow UI Helper Components (Reused for consistency) ---

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

// --- Inventory and Financial Mock Data & Functions ---

const mockTables = [
  { id: 'T01', status: 'Occupied' },
  { id: 'T02', status: 'Available' },
  { id: 'T03', status: 'Occupied' },
];

const mockFinancialSummary = {
  grossRevenue: 15450.00,
  netRevenue: 12500.00,
  cashBalance: 4500.00,
  pendingPayments: 750.00,
  apDue: 1200.00
};

// Mock Menu/Recipe to simulate inventory usage (Inventory Integration)
const mockMenuRecipes = {
    'Cheeseburger': [{ item: 'Beef Patty', qty: 1, unit: 'ea' }, { item: 'Bun', qty: 1, unit: 'ea' }],
    'Shisha (Double Apple)': [{ item: 'Tobacco (DA)', qty: 50, unit: 'g' }, { item: 'Charcoal', qty: 3, unit: 'ea' }],
    'Mint Mojito': [{ item: 'Mint Leaves', qty: 10, unit: 'g' }, { item: 'Lime Juice', qty: 50, unit: 'ml' }],
    'Fries': [{ item: 'Potatoes (Frozen)', qty: 150, unit: 'g' }],
};

/**
 * Mock function to simulate inventory deduction (Step 9: Order Closure)
 * @param orderItems The items sold in the closed order.
 */
const deductInventoryUsage = (orderItems: any[]) => {
    let totalDeductions = 0;
    const usage = new Map<string, number>();

    orderItems.forEach(order => {
        const recipe = (mockMenuRecipes as any)[order.name];
        if (recipe) {
            recipe.forEach((ingredient: any) => {
                const totalQty = ingredient.qty * order.qty;
                usage.set(ingredient.item, (usage.get(ingredient.item) || 0) + totalQty);
                totalDeductions++;
            });
        }
    });

    if (totalDeductions > 0) {
        // console.log("Inventory Deductions Simulated:", Array.from(usage.entries()));
        return totalDeductions;
    }
    return 0;
};


// --- Main Component ---

export default function BillingPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { user } = useFirebaseAuth();
  const { id } = (params as any) as { id: string };
  const [tab, setTab] = useState<'pos' | 'accounting' | 'reports' | 'discounts'>('pos');
  const [inventoryDeducted, setInventoryDeducted] = useState(0); 

  // Mock POS state
  const [currentTable, setCurrentTable] = useState('T01');
  const [currentOrder, setCurrentOrder] = useState([
    { name: 'Cheeseburger', qty: 2, price: 12.00, discount: 0 },
    { name: 'Shisha (Double Apple)', qty: 1, price: 30.00, discount: 0 },
    { name: 'Fries', qty: 1, price: 4.00, discount: 0 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  
  // Mock item addition state
  const mockMenuItems = Object.keys(mockMenuRecipes).map(name => ({ name, price: (name.includes('Shisha') ? 30 : name.includes('Burger') ? 12 : 5) }));
  const [newItemName, setNewItemName] = useState(mockMenuItems[0].name);
  const [newItemQty, setNewItemQty] = useState(1);


  if (!user) return <div className="p-6 text-white bg-black min-h-screen">Please sign in to view billing.</div>;

  const calculateTotal = () => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.qty * item.price, 0);
    const taxRate = 0.10; 
    const serviceChargeRate = 0.05; 
    const totalDiscount = currentOrder.reduce((sum, item) => sum + item.discount, 0);
    
    const taxableSubtotal = subtotal - totalDiscount;
    const taxAmount = taxableSubtotal * taxRate;
    const serviceCharge = taxableSubtotal * serviceChargeRate;
    
    const finalTotal = taxableSubtotal + taxAmount + serviceCharge;

    return { subtotal, totalDiscount, taxAmount, serviceCharge, finalTotal };
  };
  
  const { subtotal, totalDiscount, taxAmount, serviceCharge, finalTotal } = calculateTotal();

  const handleAddItem = () => {
    const itemDetails = mockMenuItems.find(i => i.name === newItemName);
    if (!itemDetails || newItemQty <= 0) return;

    setCurrentOrder(prev => {
        const existingItemIndex = prev.findIndex(i => i.name === newItemName);
        if (existingItemIndex > -1) {
            // Update quantity for existing item
            const newOrder = [...prev];
            newOrder[existingItemIndex].qty += newItemQty;
            return newOrder;
        } else {
            // Add new item
            return [...prev, { name: newItemName, qty: newItemQty, price: itemDetails.price, discount: 0 }];
        }
    });
    setNewItemQty(1);
  };
  
  // --- NEW: Remove Item Handler ---
  const handleRemoveItem = (indexToRemove: number) => {
    setCurrentOrder(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- NEW: Update Quantity Handler ---
  const handleUpdateQuantity = (indexToUpdate: number, delta: number) => {
    setCurrentOrder(prev => {
        const newOrder = [...prev];
        const currentQty = newOrder[indexToUpdate].qty;
        const newQty = currentQty + delta;

        if (newQty <= 0) {
            // If new quantity is zero or less, remove the item
            return prev.filter((_, index) => index !== indexToUpdate);
        } else {
            // Update the quantity
            newOrder[indexToUpdate].qty = newQty;
            return newOrder;
        }
    });
  };

  
  const handleProcessPayment = () => {
      if (finalTotal <= 0 || currentOrder.length === 0) return alert("Order is empty or total is zero.");
      
      // STEP 7.3: Waiter Enters Payment Details (Simulated)
      alert(`STEP 7: Waiter enters payment details. Total: $${finalTotal.toFixed(2)} via ${paymentMethod}. Pending Cashier Approval...`);

      // STEP 8.2 & 9: Cashier Approval & Order Closure/Accounting Integration
      
      const deductions = deductInventoryUsage(currentOrder);
      setInventoryDeducted(deductions);

      // Simulation of Bill Closed and Ledger Updated (Step 9)
      setTimeout(() => {
          alert(`STEP 8 & 9: Payment Confirmed by Cashier. Order Closed. Ledger Updated. ${deductions} raw item deductions logged to Inventory.`);
          
          // Reset POS state simulation:
          setCurrentOrder([]);
          setCurrentTable('T02');
          setInventoryDeducted(0); 
      }, 500);
  };

  const handlePrintKitchenReceipt = () => {
      // STEP 3.1: Kitchen Receipt Print
      alert(`STEP 3.1: Kitchen Receipt Printed for Table ${currentTable}. Items: ${currentOrder.length}. Inventory checked for reservation.`);
      // In a real system, stock would be RESERVED here.
  };


  const renderTabButton = (key: typeof tab, label: string) => (
    <GlassButton
      onClick={() => setTab(key)}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        tab === key
          ? 'bg-[#F97316] hover:bg-orange-500 text-white shadow-lg shadow-orange-700/50'
          : 'bg-transparent hover:bg-white/10 text-white'
      }`}
    >
      {label}
    </GlassButton>
  );

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-[#F97316]">💰 Financial Management</h1>
      
      {/* Tab Navigation */}
      <div className="mt-4 flex flex-wrap gap-2 p-2 rounded-xl bg-white/5 border border-white/10 shadow-lg">
        {renderTabButton('pos', 'Billing & POS')}
        {renderTabButton('accounting', 'Accounting & Cash')}
        {renderTabButton('reports', 'Reports & Analytics')}
        {renderTabButton('discounts', 'Discounts & Loyalty')}
      </div>

      <div className="mt-6">
        
        {/* TAB 1: Billing & POS Module (2. Order Creation, 3. Receipt, 7. Payment) */}
        {tab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Order Creation & Bill Preview */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Order Creation / Table Management (1.1, 2.1) */}
              <GlassCard>
                <h2 className="text-xl font-bold mb-3">Order Creation & Management</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <GlassSelect value={currentTable} onChange={e => setCurrentTable(e.target.value)}>
                        {mockTables.map(t => (
                            <option key={t.id} value={t.id} className="bg-[#0F0F10]">{t.id} - {t.status}</option>
                        ))}
                    </GlassSelect>
                    <GlassButton className="bg-white/20 hover:bg-white/30 border-none">Split / Transfer Bill (2.1)</GlassButton>
                </div>
                
                {/* Add Items (2.2) */}
                <h3 className="font-semibold mt-4 mb-2">Add Items to Order (2.2)</h3>
                <div className="grid grid-cols-4 gap-3">
                    <GlassSelect value={newItemName} onChange={e => setNewItemName(e.target.value)} className="col-span-2">
                        {mockMenuItems.map(item => (
                            <option key={item.name} value={item.name} className="bg-[#0F0F10]">{item.name} (${item.price.toFixed(2)})</option>
                        ))}
                    </GlassSelect>
                    <GlassInput 
                        value={newItemQty} 
                        onChange={e => setNewItemQty(Number(e.target.value))} 
                        placeholder="Qty" 
                        type="number" 
                        min="1"
                    />
                    <GlassButton variant="accent" onClick={handleAddItem}>Add Item (2.2)</GlassButton>
                </div>
                
                <h3 className="font-semibold mt-4 mb-2">Current Order (Table {currentTable})</h3>
                <div className='max-h-60 overflow-y-auto space-y-2 p-2 rounded-lg border border-white/10'>
                    {currentOrder.map((item, index) => (
                        // --- EDITABLE AND REMOVABLE ITEM ROW ---
                        <div key={index} className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                            <span className='font-medium text-sm'>{item.name}</span>
                            
                            <div className='flex items-center gap-2'>
                                {/* Quantity Controls */}
                                <GlassButton 
                                    variant="quantity" 
                                    onClick={() => handleUpdateQuantity(index, -1)}
                                >
                                    -
                                </GlassButton>
                                <span className='text-base font-bold w-4 text-center'>{item.qty}</span>
                                <GlassButton 
                                    variant="quantity" 
                                    onClick={() => handleUpdateQuantity(index, 1)}
                                >
                                    +
                                </GlassButton>

                                <span className='w-16 text-right font-medium'>${(item.qty * item.price).toFixed(2)}</span>
                                
                                {/* Remove Button */}
                                <GlassButton 
                                    variant="danger" 
                                    className='px-2'
                                    onClick={() => handleRemoveItem(index)}
                                >
                                    ✕
                                </GlassButton>
                            </div>
                        </div>
                        // --- END EDITABLE ITEM ROW ---
                    ))}
                    {currentOrder.length === 0 && <p className='text-white/50 text-center py-4'>Order is empty.</p>}
                </div>

                <div className="mt-4 flex gap-3">
                    <GlassButton 
                        onClick={handlePrintKitchenReceipt} 
                        variant="accent" 
                        disabled={currentOrder.length === 0}
                    >
                        Confirm & Print Kitchen Receipt (3.1)
                    </GlassButton>
                    <GlassButton disabled={currentOrder.length === 0}>
                        Print Customer Ticket (3.2)
                    </GlassButton>
                </div>
              </GlassCard>

              {/* Bill Generation Preview (6. Generate Provisional Bill) */}
              <GlassCard>
                <h2 className="text-xl font-bold mb-4">Bill Generation & Provisional Preview (6)</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70"><span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-red-400"><span>Discounts (Total):</span> <span>-${totalDiscount.toFixed(2)}</span></div>
                    <div className="flex justify-between text-white/70"><span>Tax (10%):</span> <span>+${taxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between text-white/70"><span>Service Charge (5%):</span> <span>+${serviceCharge.toFixed(2)}</span></div>
                    <div className="flex justify-between text-2xl font-bold pt-2 border-t border-white/10">
                        <span>Total Payable:</span> 
                        <span className='text-[#F97316]'>${finalTotal.toFixed(2)}</span>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                    <GlassButton variant="accent" disabled={currentOrder.length === 0}>Print Provisional Bill (6.2)</GlassButton>
                    <GlassButton>Add Special Instructions (2.3)</GlassButton>
                </div>
              </GlassCard>
            </div>
            
            {/* Right Column: Payment Management (7. Payment Workflow, 8. Cashier Approval) */}
            <div className="lg:col-span-1">
                <GlassCard className='h-full'>
                    <h2 className="text-xl font-bold mb-4">Payment & Settlement (7 & 8)</h2>
                    
                    <div className="space-y-4">
                        <div className="text-center text-3xl font-extrabold mb-6">
                            Due: <span className='text-green-400'>${finalTotal.toFixed(2)}</span>
                        </div>
                        
                        <h3 className="font-semibold text-white/70">Select Payment Method (7.2)</h3>
                        <GlassSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full">
                            <option value="Cash" className="bg-[#0F0F10]">Cash</option>
                            <option value="Card" className="bg-[#0F0F10]">Credit/Debit Card</option>
                            <option value="Digital Wallet" className="bg-[#0F0F10]">Digital Wallet / UPI</option>
                            <option value="Credit" className="bg-[#0F0F10]">Customer Credit (AR)</option>
                        </GlassSelect>
                        
                        <GlassInput placeholder="Amount Received (for Cash/Split)" type="number" step="0.01" className="w-full" />
                        
                        <div className="flex gap-2">
                            <GlassButton className="flex-1">Split Payment (7.2)</GlassButton>
                            <GlassButton variant="danger" className="flex-1">Refund / Void</GlassButton>
                        </div>
                        
                        {inventoryDeducted > 0 && (
                            <div className='p-2 bg-green-900/40 rounded-lg text-sm font-semibold'>
                                ✅ Inventory updated for last sale ({inventoryDeducted} raw items deducted).
                            </div>
                        )}

                        <GlassButton 
                            variant="accent" 
                            onClick={handleProcessPayment} 
                            className="w-full mt-4 text-base py-3"
                            disabled={currentOrder.length === 0}
                        >
                            Process & Finalize (9. Integrate Inventory)
                        </GlassButton>
                        <p className='text-xs text-white/50 text-center'>Triggers Cashier Approval, closes bill, posts to ledger, and finalizes inventory deduction.</p>
                    </div>
                </GlassCard>
            </div>
          </div>
        )}

        {/* TAB 2: Accounting & Cash Module (4. Accounting & Finance Module) */}
        {tab === 'accounting' && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
             
            {/* Sales Accounting & AR/AP (4.1, 4.2) */}
            <GlassCard>
              <h2 className="text-xl font-bold mb-4">Ledger & Receivables/Payables (4.1, 4.2)</h2>
              
              <div className="space-y-4">
                <div className='p-3 bg-white/10 rounded-lg'>
                    <h3 className="font-semibold text-white/70 mb-2">Outstanding Balances</h3>
                    <div className="flex justify-between text-sm">
                        <span>Accounts Receivable (Customer Dues):</span> 
                        <span className='text-yellow-400'>${mockFinancialSummary.pendingPayments.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Accounts Payable (Supplier Bills):</span> 
                        <span className='text-red-400'>${mockFinancialSummary.apDue.toFixed(2)}</span>
                    </div>
                </div>
                
                <h3 className="font-semibold text-white/70 mb-2">Transaction Journal (Last 5)</h3>
                <div className='text-xs space-y-1 max-h-40 overflow-y-auto'>
                    <div className='p-2 bg-black/20 rounded-md'>Sale #1005 | Debit: Cash $154.00 | Credit: Sales $140.00, VAT $14.00</div>
                    <div className='p-2 bg-black/20 rounded-md'>Supplier Pay | Debit: AP $500.00 | Credit: Bank $500.00</div>
                    <div className='p-2 bg-black/20 rounded-md'>Sale #1004 | Debit: Card $88.00 | Credit: Sales $80.00, VAT $8.00</div>
                    <div className='p-2 bg-black/20 rounded-md'>Tax Payment | Debit: Tax Liability $1000.00 | Credit: Bank $1000.00</div>
                    <div className='p-2 bg-black/20 rounded-md'>Sale #1003 | Debit: Cash $25.00 | Credit: Sales $22.73, VAT $2.27</div>
                </div>
                
                <GlassButton variant="accent" className="w-full">View Full General Ledger (4.1)</GlassButton>
              </div>
            </GlassCard>
            
            {/* Cash Management & Compliance (4.3, 4.4) */}
            <GlassCard>
              <h2 className="text-xl font-bold mb-4">Cash & Compliance (4.3, 4.4)</h2>
              <div className="space-y-4">
                <div className='p-3 bg-white/10 rounded-lg'>
                    <h3 className="font-semibold text-white/70 mb-2">Cash Register Summary</h3>
                    <div className="flex justify-between text-lg">
                        <span>Current Cash on Hand:</span> 
                        <span className='text-green-400 font-bold'>${mockFinancialSummary.cashBalance.toFixed(2)}</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <GlassButton className='bg-green-700/50 hover:bg-green-700'>Log Petty Cash Expense (4.3)</GlassButton>
                    <GlassButton className='bg-white/20 hover:bg-white/30'>Reconcile Day's Cash (4.3)</GlassButton>
                </div>
                
                <h3 className="font-semibold text-white/70 mt-4">Tax Liability (4.4)</h3>
                <div className='text-sm space-y-1'>
                    <div className="flex justify-between"><span>VAT/GST Collected (Today):</span> <span>$145.50</span></div>
                    <div className="flex justify-between"><span>Tax Liabilities (Total):</span> <span className='text-red-400'>$2,150.00</span></div>
                </div>
                <GlassButton className="w-full bg-white/20 hover:bg-white/30">Generate Tax Reports (4.4)</GlassButton>
              </div>
            </GlassCard>
          </div>
        )}
        
        {/* TAB 3: Reports & Analytics (4.5, 6. Optional Advanced) */}
        {tab === 'reports' && (
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Financial Reports & Analytics (4.5)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-sm text-white/70">Gross Revenue (Today)</div>
                    <div className="text-2xl font-bold text-green-400">${mockFinancialSummary.grossRevenue.toFixed(2)}</div>
                </div>
                 <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-sm text-white/70">Net Revenue (Today)</div>
                    <div className="text-2xl font-bold text-green-500">${mockFinancialSummary.netRevenue.toFixed(2)}</div>
                </div>
                 <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-sm text-white/70">Total Discounts Given</div>
                    <div className="text-2xl font-bold text-red-400">12%</div>
                </div>
                 <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-sm text-white/70">Best Selling Category</div>
                    <div className="text-2xl font-bold text-[#F97316]">Beverages</div>
                </div>
            </div>

            <h3 className="font-semibold mb-3">Report Generation (4.5)</h3>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                <GlassButton className="bg-white/20 hover:bg-white/30">P&L Statement (Monthly)</GlassButton>
                <GlassButton className="bg-white/20 hover:bg-white/30">Detailed Sales Report</GlassButton>
                <GlassButton className="bg-white/20 hover:bg-white/30">Cash Flow Projection</GlassButton>
                <GlassButton className="bg-white/20 hover:bg-white/30">Outstanding AR/AP</GlassButton>
                <GlassButton className="bg-white/20 hover:bg-white/30">Tax Summary</GlassButton>
                <GlassButton className="bg-white/20 hover:bg-white/30">Export All to CSV</GlassButton>
            </div>
            
             <h3 className="font-semibold mt-6 mb-3">Automation (6)</h3>
             <div className="flex flex-wrap gap-3">
                 <GlassButton variant="accent">Automate Weekly Financial Summary Email</GlassButton>
                 <GlassButton>Set Up Multi-Location POS Consolidation</GlassButton>
             </div>

          </GlassCard>
        )}

        {/* TAB 4: Discounts, Offers & Loyalty (3. Discounts, Offers & Loyalty) */}
        {tab === 'discounts' && (
            <GlassCard>
                <h2 className="text-xl font-bold mb-4">Discounts, Offers & Loyalty Management (3)</h2>
                
                <h3 className="font-semibold mb-3">Manage Discounts & Coupons</h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-white/10 rounded-lg'>
                    <GlassInput placeholder="Coupon Code (e.g., LUNCH20)" className='col-span-1' />
                    <GlassSelect className='col-span-1'>
                        <option value="percentage" className="bg-[#0F0F10]">Percentage (%)</option>
                        <option value="fixed" className="bg-[#0F0F10]">Fixed Amount ($)</option>
                    </GlassSelect>
                    <GlassInput placeholder="Value (e.g., 20 or 5.00)" type="number" step="0.01" className='col-span-1' />
                    <div className="col-span-full flex gap-3">
                        <GlassButton variant="accent">Create Discount</GlassButton>
                        <GlassButton>View Active Offers</GlassButton>
                    </div>
                </div>

                <h3 className="font-semibold mb-3">Loyalty Program</h3>
                <div className='p-4 bg-white/10 rounded-lg'>
                    <div className="flex justify-between text-sm mb-2">
                        <span>Active Loyalty Members:</span> 
                        <span className='font-bold'>1,240</span>
                    </div>
                    <GlassButton className="bg-white/20 hover:bg-white/30 w-full">Manage Points & Redemption Rules</GlassButton>
                </div>
            </GlassCard>
        )}

      </div>
    </div>
  );
}