
"use client";

import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  DollarSign,
  ArrowUpRight,
  Receipt,
  Download
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function FinancePage() {
  const { transactions, expenses } = useStore();

  const totalRevenue = transactions.reduce((acc, tx) => acc + tx.total, 0);
  const totalExpenses = expenses.reduce((acc, ex) => acc + ex.amount, 0);
  const grossProfit = totalRevenue - (transactions.length * 5); // Mock cost of goods

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Financials</h1>
          <p className="text-muted-foreground mt-2 text-lg">Track cash flow, daily sales summaries, and business expenses.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl h-12 bg-white/80 border-white/60 shadow-wiillo font-bold gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Button className="rounded-2xl h-12 wiillo-grad text-white shadow-lg border-none font-bold px-8 gap-2">
            <Plus className="h-4 w-4" /> Record Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] p-8">
          <div className="flex items-center gap-3 text-success font-black text-xs uppercase tracking-widest mb-4">
            <TrendingUp className="h-4 w-4" /> Total Revenue
          </div>
          <div className="text-4xl font-black tracking-tighter">${totalRevenue.toLocaleString()}</div>
          <p className="text-muted text-xs mt-3 font-bold uppercase tracking-widest">Gross sales this month</p>
        </Card>
        <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] p-8">
          <div className="flex items-center gap-3 text-destructive font-black text-xs uppercase tracking-widest mb-4">
            <TrendingDown className="h-4 w-4" /> Total Expenses
          </div>
          <div className="text-4xl font-black tracking-tighter">${totalExpenses.toLocaleString()}</div>
          <p className="text-muted text-xs mt-3 font-bold uppercase tracking-widest">OpEx + Procurement</p>
        </Card>
        <Card className="border-none shadow-wiillo bg-primary/5 rounded-[28px] p-8">
          <div className="flex items-center gap-3 text-primary font-black text-xs uppercase tracking-widest mb-4">
            <DollarSign className="h-4 w-4" /> Estimated Profit
          </div>
          <div className="text-4xl font-black tracking-tighter text-primary">${grossProfit.toLocaleString()}</div>
          <p className="text-muted text-xs mt-3 font-bold uppercase tracking-widest">After estimated COGS</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] overflow-hidden">
          <div className="p-8 pb-4">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" /> Expense Ledger
            </h3>
          </div>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50">
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted pl-8">Date</TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted">Category</TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted text-right pr-8">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted italic">No expenses recorded yet.</TableCell>
                </TableRow>
              ) : (
                expenses.map(ex => (
                  <TableRow key={ex.id} className="border-border/20">
                    <TableCell className="pl-8 text-xs font-bold text-muted">{new Date(ex.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell className="font-bold text-sm">{ex.category}</TableCell>
                    <TableCell className="text-right pr-8 font-black text-destructive">-${ex.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] p-8 flex flex-col justify-center items-center text-center">
          <div className="h-20 w-20 rounded-[24px] bg-primary/5 flex items-center justify-center mb-6">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-black tracking-tight mb-2">Cash Management</h3>
          <p className="text-muted text-sm max-w-xs leading-relaxed mb-8">Maintain a digital petty cash log and daily shift closings for total transparency.</p>
          <div className="flex gap-3 w-full max-w-sm">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/5 transition-all">Daily Closing</Button>
            <Button className="flex-1 h-12 rounded-xl wiillo-grad border-none font-bold text-white shadow-lg">Petty Cash</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
