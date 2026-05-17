"use client";

import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Plus, 
  Search, 
  ChevronRight, 
  FileText, 
  Clock, 
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function ProcurementPage() {
  const { suppliers } = useStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Procurement</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage suppliers, purchase orders, and inbound inventory.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl h-12 bg-white/80 border-white/60 shadow-wiillo font-bold">Manage Suppliers</Button>
          <Button className="rounded-2xl h-12 wiillo-grad text-white shadow-lg border-none font-bold px-8">New Purchase Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black tracking-tight">Active Suppliers</h3>
              <Button variant="ghost" size="sm" className="rounded-xl text-primary font-bold">View Directory</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers.map(s => (
                <div key={s.id} className="p-5 rounded-[22px] bg-muted/20 border border-transparent hover:border-primary/20 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{s.name}</div>
                      <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Balance: ${s.balance.toFixed(2)}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              ))}
              <button className="p-5 rounded-[22px] border-2 border-dashed border-border/50 hover:border-primary/50 transition-all flex flex-col items-center justify-center text-muted hover:text-primary gap-1">
                <Plus className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-widest">Add Supplier</span>
              </button>
            </div>
          </Card>

          <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] overflow-hidden">
            <div className="p-8 pb-4">
              <h3 className="text-xl font-black tracking-tight">Purchase History</h3>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted pl-8">Order ID</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted">Supplier</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted">Amount</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted">Status</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-border/20">
                  <TableCell className="pl-8 font-bold text-sm text-primary">PO-92831</TableCell>
                  <TableCell className="font-bold text-sm">Global Foods Inc</TableCell>
                  <TableCell className="font-black">$2,450.00</TableCell>
                  <TableCell>
                    <Badge className="bg-green-50 text-green-700 border-green-100 border font-black text-[10px] uppercase tracking-widest px-3 py-1">Received</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs">View GRN</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] p-8">
            <h3 className="text-xl font-black tracking-tight mb-6">Inventory Inflow</h3>
            <div className="space-y-6">
              {[
                { title: 'Goods Received', detail: 'Bulk Coffee (45kg)', time: 'Today, 10:45 AM', icon: PackageCheck, color: 'text-success' },
                { title: 'Pending Order', detail: 'Dairy Order #827', time: 'Exp. Tomorrow', icon: Clock, color: 'text-orange-500' },
                { title: 'Invoice Paid', detail: 'Inv-8272 for $1,200', time: 'Yesterday', icon: FileText, color: 'text-primary' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className={cn("h-10 w-10 rounded-2xl bg-muted/20 flex items-center justify-center shrink-0", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-tight">{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.detail}</div>
                    <div className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1.5">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-8 rounded-2xl bg-primary/5 text-primary border-none font-bold h-12 hover:bg-primary/10 transition-all">
              Procurement Reports
            </Button>
          </Card>

          <Card className="border-none shadow-wiillo bg-primary rounded-[28px] p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <Truck className="h-10 w-10 mb-4 opacity-50" />
              <h4 className="text-2xl font-black tracking-tight leading-tight mb-2">Optimize your supply chain.</h4>
              <p className="text-white/70 text-sm leading-relaxed mb-6">Set up automated purchase requests when stock hits reorder levels.</p>
              <Button className="bg-white text-primary rounded-xl font-black text-xs uppercase tracking-widest px-6 h-11 hover:bg-white/90">
                Setup Automation
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}