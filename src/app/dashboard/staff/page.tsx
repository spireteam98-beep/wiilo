"use client";

import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  Clock, 
  Calendar,
  MoreVertical,
  Briefcase
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function StaffPage() {
  const { employees, branches } = useStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Staff & Roles</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage employee profiles, shift schedules, and permissions.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl h-12 bg-white/80 border-white/60 shadow-wiillo font-bold gap-2">
            <Clock className="h-4 w-4" /> Shift Calendar
          </Button>
          <Button className="rounded-2xl h-12 wiillo-grad text-white shadow-lg border-none font-bold px-8 gap-2">
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] p-8">
          <div className="flex items-center gap-3 text-primary font-black text-xs uppercase tracking-widest mb-4">
            <Users className="h-4 w-4" /> Workforce
          </div>
          <div className="text-4xl font-black tracking-tighter">{employees.length}</div>
          <p className="text-muted text-xs mt-3 font-bold uppercase tracking-widest">Active staff members</p>
        </Card>
        <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] p-8">
          <div className="flex items-center gap-3 text-success font-black text-xs uppercase tracking-widest mb-4">
            <ShieldCheck className="h-4 w-4" /> Access Levels
          </div>
          <div className="text-4xl font-black tracking-tighter">5</div>
          <p className="text-muted text-xs mt-3 font-bold uppercase tracking-widest">Defined system roles</p>
        </Card>
        <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] p-8">
          <div className="flex items-center gap-3 text-accent font-black text-xs uppercase tracking-widest mb-4">
            <Calendar className="h-4 w-4" /> On Shift
          </div>
          <div className="text-4xl font-black tracking-tighter">3</div>
          <p className="text-muted text-xs mt-3 font-bold uppercase tracking-widest">Currently clocked in</p>
        </Card>
      </div>

      <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] overflow-hidden">
        <div className="p-8 pb-4">
          <h3 className="text-xl font-black tracking-tight">Staff Directory</h3>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/50">
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted pl-8">Employee</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted">Role</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted">Assigned Branch</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted text-center">Status</TableHead>
              <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map(emp => (
              <TableRow key={emp.id} className="border-border/20 group hover:bg-muted/10 transition-colors">
                <TableCell className="pl-8 py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 rounded-xl border border-border/50">
                      <AvatarImage src={`https://picsum.photos/seed/${emp.id}/40/40`} />
                      <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">{emp.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-bold text-sm">{emp.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest px-3 py-1 bg-primary/5">{emp.role}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted font-bold flex items-center gap-2">
                  <Briefcase className="h-3 w-3" />
                  {branches.find(b => b.id === emp.branchId)?.name || 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    emp.status === 'active' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", emp.status === 'active' ? "bg-green-500" : "bg-orange-500")}></span>
                    {emp.status}
                  </span>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-4 w-4 text-muted" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
