"use client";

import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users2, 
  Plus, 
  Search, 
  Gift, 
  History, 
  MessageSquare,
  Mail,
  MoreVertical
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function CustomersPage() {
  const { customers } = useStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Customer CRM</h1>
          <p className="text-muted-foreground mt-2 text-lg">Build loyalty and manage purchasing profiles.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl h-12 bg-white/80 border-white/60 shadow-wiillo font-bold gap-2">
            <Mail className="h-4 w-4" /> Bulk SMS
          </Button>
          <Button className="rounded-2xl h-12 wiillo-grad text-white shadow-lg border-none font-bold px-8 gap-2">
            <Plus className="h-4 w-4" /> New Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] p-8">
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest block mb-2">Active Profiles</span>
          <div className="text-3xl font-black">{customers.length}</div>
        </Card>
        <Card className="border-none shadow-wiillo bg-accent/5 rounded-[28px] p-8">
          <span className="text-[11px] font-bold text-accent uppercase tracking-widest block mb-2">Avg. Loyalty Points</span>
          <div className="text-3xl font-black text-accent">1,240</div>
        </Card>
        <Card className="border-none shadow-wiillo bg-primary/5 rounded-[28px] p-8">
          <span className="text-[11px] font-bold text-primary uppercase tracking-widest block mb-2">Top Spend Rate</span>
          <div className="text-3xl font-black text-primary">↗ 14%</div>
        </Card>
      </div>

      <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] overflow-hidden">
        <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-black tracking-tight">Customer Directory</h3>
          <div className="relative w-full max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-primary transition-colors" />
            <Input placeholder="Search by name, phone..." className="pl-11 h-11 bg-white border-border/50 rounded-xl" />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/50">
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted pl-8">Customer</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted">Contact</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted text-center">Loyalty Points</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted text-right">Total Spent</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted">
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <Users2 className="h-12 w-12" />
                    <p className="font-bold">No customer records found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map(c => (
                <TableRow key={c.id} className="border-border/20 group hover:bg-primary/5 transition-colors">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <div className="font-bold text-sm">{c.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted font-bold">{c.phone}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-black text-[10px] uppercase">{c.loyaltyPoints} PTS</Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-primary">${c.totalSpent.toFixed(2)}</TableCell>
                  <TableCell className="text-right pr-8">
                    <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
