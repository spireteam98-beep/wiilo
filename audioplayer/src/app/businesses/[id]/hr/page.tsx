"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/contexts/firebase-auth';
import { 
    listBusinessStaff, 
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
      'bg-white/10 hover:bg-white/20 text-white border border-white/20'
    }`}
  >
    {props.children}
  </Button>
);

export default function HRPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { user } = useFirebaseAuth();
  const { id } = (params as any) as { id: string };

  const [tab, setTab] = useState<'employees' | 'tables' | 'payroll' | 'attendance'>('employees');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  // Form States
  const [newEmployee, setNewEmployee] = useState({ name: '', role: 'Waiter', phone: '', salary: '', status: 'active' });
  const [newTable, setNewTable] = useState({ tableNo: '', capacity: '4', assignedStaff: '' });

  // 1. Initial Data Fetch
  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      setLoading(true);
      try {
        const idToken = await user.getIdToken();
        
        // Fetch Staff
        const staffRes = await fetch(`/api/businesses/${id}/staff`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const staffData = await staffRes.json();
        setEmployees(staffData.staff || []);

        // Fetch Tables
        const tableRes = await fetch(`/api/businesses/${id}/tables`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const tableData = await tableRes.json();
        setTables(tableData.tables || []);

      } catch (err) {
        console.error("Failed to load HR/Table data", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  // 2. Staff Registration Logic
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const generatedId = `STF-${newEmployee.role.substring(0, 1).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = { ...newEmployee, staffId: generatedId };

      const res = await fetch(`/api/businesses/${id}/staff`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save staff');
      const result = await res.json();
      setEmployees(prev => [result.staff, ...prev]);
      setNewEmployee({ name: '', role: 'Waiter', phone: '', salary: '', status: 'active' });
      alert(`Staff registered with ID: ${generatedId}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // 3. Table Creation Logic
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/businesses/${id}/tables`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTable, status: 'Available' }),
      });

      if (!res.ok) throw new Error('Failed to save table');
      const result = await res.json();
      setTables(prev => [result.table, ...prev]);
      setNewTable({ tableNo: '', capacity: '4', assignedStaff: '' });
      alert("Table created and staff assigned!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) return <div className="p-6 text-white bg-black min-h-screen">Please sign in.</div>;

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-[#F97316]">👥 HR & Tables <span className="text-sm font-normal text-white/40">ID: {id}</span></h1>

      <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-white/5 border border-white/10 mb-6">
        <GlassButton onClick={() => setTab('employees')} className={tab === 'employees' ? 'bg-[#F97316]' : ''}>Staff Directory</GlassButton>
        <GlassButton onClick={() => setTab('tables')} className={tab === 'tables' ? 'bg-[#F97316]' : ''}>Table Management</GlassButton>
        <GlassButton onClick={() => setTab('payroll')} className={tab === 'payroll' ? 'bg-[#F97316]' : ''}>Payroll</GlassButton>
      </div>

      {loading ? (
        <div className="text-white/50">Synchronizing data...</div>
      ) : (
        <>
          {/* TAB: EMPLOYEES */}
          {tab === 'employees' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-1">
                <GlassCard>
                  <h2 className="text-xl font-bold mb-4">Register Staff</h2>
                  <form onSubmit={handleAddEmployee} className="space-y-4">
                    <GlassInput required value={newEmployee.name} onChange={(e:any) => setNewEmployee({...newEmployee, name: e.target.value})} placeholder="Full Name" className="w-full" />
                    <GlassSelect className="w-full" value={newEmployee.role} onChange={(e:any) => setNewEmployee({...newEmployee, role: e.target.value})}>
                      <option value="Waiter">Waiter</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Shisha Master">Shisha Master</option>
                    </GlassSelect>
                    <GlassInput type="number" value={newEmployee.salary} onChange={(e:any) => setNewEmployee({...newEmployee, salary: e.target.value})} placeholder="Salary ($)" className="w-full" />
                    <GlassButton variant="accent" type="submit" className="w-full py-3">Generate ID & Save</GlassButton>
                  </form>
                </GlassCard>
              </div>

              <div className="col-span-1 lg:col-span-2">
                <GlassCard className="p-0 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-white/50 uppercase text-[10px]">
                      <tr><th className="p-4">Staff ID</th><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-white/5">
                          <td className="p-4 font-mono text-[#F97316]">{emp.staffId}</td>
                          <td className="p-4 font-semibold">{emp.name}</td>
                          <td className="p-4">{emp.role}</td>
                          <td className="p-4 text-right"><GlassButton variant="danger" size="sm">Remove</GlassButton></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </GlassCard>
              </div>
            </div>
          )}

          {/* TAB: TABLES (NEW MODULE) */}
          {tab === 'tables' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-1">
                <GlassCard>
                  <h2 className="text-xl font-bold mb-4">Add Table</h2>
                  <form onSubmit={handleAddTable} className="space-y-4">
                    <GlassInput required value={newTable.tableNo} onChange={(e:any) => setNewTable({...newTable, tableNo: e.target.value})} placeholder="Table Number (e.g. T-01)" className="w-full" />
                    <GlassInput type="number" value={newTable.capacity} onChange={(e:any) => setNewTable({...newTable, capacity: e.target.value})} placeholder="Capacity" className="w-full" />
                    <GlassSelect className="w-full" value={newTable.assignedStaff} onChange={(e:any) => setNewTable({...newTable, assignedStaff: e.target.value})}>
                      <option value="">-- Assign Staff --</option>
                      {employees.map(emp => <option key={emp.id} value={emp.staffId}>{emp.name} ({emp.staffId})</option>)}
                    </GlassSelect>
                    <GlassButton variant="accent" type="submit" className="w-full py-3">Create Table</GlassButton>
                  </form>
                </GlassCard>
              </div>

              <div className="col-span-1 lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {tables.map((t) => (
                    <GlassCard key={t.id} className="text-center border-orange-500/20">
                      <div className="text-2xl font-black text-[#F97316]">{t.tableNo}</div>
                      <div className="text-[10px] text-white/40 uppercase mb-2">Staff: {t.assignedStaff || 'Unassigned'}</div>
                      <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${t.status === 'Available' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {t.status}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}