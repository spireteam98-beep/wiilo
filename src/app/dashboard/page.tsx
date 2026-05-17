"use client";

import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  AlertCircle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

export default function DashboardOverview() {
  const { currentTenant, products, transactions } = useStore();

  const totalRevenue = transactions.reduce((acc, tx) => acc + tx.total, 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">Cozy fintech SaaS interface for your {currentTenant?.type.toLowerCase()}.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl h-11 bg-white/80 border-white/60 shadow-wiillo">Export</Button>
          <Button className="rounded-2xl h-11 wiillo-grad text-white shadow-[0_16px_28px_rgba(124,58,237,0.22)] border-none font-bold">Create Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Card */}
        <Card className="lg:col-span-8 border-none shadow-wiillo bg-white/80 backdrop-blur-xl rounded-[28px] overflow-hidden relative">
          <div className="absolute inset-auto -right-20 -bottom-20 w-60 h-60 bg-accent/20 rounded-full blur-[80px] pointer-events-none"></div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 border border-border text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Live platform health
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tighter leading-none">Operate with total calm and trust.</h2>
                <p className="text-muted text-sm leading-relaxed max-w-xs">Manage inventory, sales, and analytics across your workspace without the clutter.</p>
                <div className="flex flex-wrap gap-3">
                  <Button className="wiillo-grad text-white rounded-2xl h-11 px-6 font-bold border-none">Command Center</Button>
                  <Button variant="secondary" className="rounded-2xl h-11 px-6 font-bold bg-white/80 border-white/60">View Reports</Button>
                </div>
              </div>
              <div className="h-[220px] bg-gradient-to-b from-white/80 to-white/45 rounded-3xl border border-border overflow-hidden relative shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 40, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff2d7a" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="sales" stroke="url(#lineGrad)" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#7c3aed', strokeWidth: 2, strokeDasharray: '5 5' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Visual Line Gradient Hack */}
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ff2d7a" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stack */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-wiillo bg-white/80 backdrop-blur-xl rounded-[28px] p-6">
            <h4 className="font-extrabold text-lg tracking-tight">Recent Activity</h4>
            <p className="text-muted text-xs mb-6">Latest workspace events</p>
            <div className="space-y-5">
              {[
                { name: 'POS Sale', detail: 'New transaction #A823', time: '2m ago', initial: 'PS' },
                { name: 'Stock Low', detail: 'Premium Beans (5 left)', time: '18m ago', initial: 'SL' },
                { name: 'System', detail: 'End of day synced', time: '43m ago', initial: 'SY' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center font-extrabold text-xs text-primary transition-colors group-hover:bg-primary/10">
                      {activity.initial}
                    </div>
                    <div>
                      <strong className="block text-sm font-bold leading-tight">{activity.name}</strong>
                      <span className="text-[11px] text-muted">{activity.detail}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/70 border border-border text-muted uppercase tracking-wider">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-none shadow-wiillo bg-white/80 backdrop-blur-xl rounded-[28px] p-6">
            <h4 className="font-extrabold text-lg tracking-tight">AI Insights</h4>
            <div className="mt-4 p-4 rounded-2xl bg-accent/5 border border-accent/10 space-y-2">
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5" /> Next Insight
              </div>
              <p className="text-sm italic leading-relaxed text-muted">"Sales trend suggests doubling weekend inventory for coffee beans."</p>
            </div>
          </Card>
        </div>

        {/* Metrics Grid */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Monthly Volume', value: `$${totalRevenue.toLocaleString()}`, trend: '↗ 18.2%', color: 'text-success' },
            { label: 'Active Orders', value: transactions.length.toString(), trend: '↗ 6 new today', color: 'text-success' },
            { label: 'Stock Items', value: products.length.toString(), trend: `${lowStockCount} low stock`, color: 'text-orange-500' },
            { label: 'System Health', value: '98.4%', trend: 'All services normal', color: 'text-success' },
          ].map((metric, i) => (
            <Card key={i} className="border-none shadow-wiillo bg-white/80 backdrop-blur-xl rounded-[28px] p-6 hover:translate-y-[-2px] transition-transform cursor-pointer">
              <span className="text-[11px] font-bold text-muted uppercase tracking-widest block mb-2">{metric.label}</span>
              <div className="text-3xl font-black tracking-tighter">{metric.value}</div>
              <div className={`text-[11px] font-bold mt-2 ${metric.color}`}>{metric.trend}</div>
            </Card>
          ))}
        </div>

        {/* Table View */}
        <Card className="lg:col-span-12 border-none shadow-wiillo bg-white/80 backdrop-blur-xl rounded-[28px] p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">Product Overview</h3>
              <p className="text-sm text-muted">Real-time inventory visibility and status.</p>
            </div>
            <div className="flex gap-2">
              {['Healthy', 'Low', 'Risk'].map((status) => (
                <div key={status} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-border text-[10px] font-black uppercase tracking-widest text-muted">
                  <span className={`w-2 h-2 rounded-full ${status === 'Healthy' ? 'bg-success' : status === 'Low' ? 'bg-orange-400' : 'bg-destructive'}`}></span>
                  {status}
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted">Product</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted">Category</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted">Stock</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted">Price</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {products.slice(0, 3).map((p) => (
                  <tr key={p.id} className="group hover:bg-white/40 transition-colors">
                    <td className="py-4 font-bold text-sm">{p.name}</td>
                    <td className="py-4 text-xs text-muted font-bold uppercase tracking-wider">{p.category}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-sm font-black">
                        {p.stock}
                        <span className={`w-2 h-2 rounded-full ${p.stock > 10 ? 'bg-success' : 'bg-orange-500'}`}></span>
                      </div>
                    </td>
                    <td className="py-4 font-bold text-sm">${p.price.toFixed(2)}</td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="sm" className="rounded-xl h-8 px-3 font-bold text-xs hover:bg-primary/10 hover:text-primary">
                        Details <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}