
"use client";

import { useState } from 'react';
import { useStore, Product } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2,
  CreditCard,
  Banknote,
  LayoutGrid,
  List,
  Package,
  Smartphone,
  History,
  UserPlus
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function POSPage() {
  const { products, addTransaction, currentTenant } = useStore();
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'transfer'>('cash');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = products.filter(p => 
    p.status === 'active' && (
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    )
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({ title: "Out of Stock", description: `${product.name} is currently unavailable.`, variant: "destructive" });
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  const tax = subtotal * (currentTenant?.taxRate || 0.15);
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    cart.forEach(item => {
      addTransaction({
        id: `TX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.qty,
        total: item.product.price * item.qty,
        timestamp: new Date().toISOString(),
        paymentMethod: paymentMethod,
        branchId: 'b1', // Default branch for now
      });
    });

    setCart([]);
    toast({
      title: "Transaction Complete",
      description: `Order processed via ${paymentMethod}.`,
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Scan barcode or search items..." 
              className="pl-12 h-14 bg-white shadow-wiillo border-none rounded-2xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl h-12 gap-2 bg-white/80">
              <UserPlus className="h-4 w-4" /> Guest Customer
            </Button>
            <div className="flex bg-white/80 p-1 rounded-2xl shadow-sm border border-border/50">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="rounded-xl h-10 w-10"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="rounded-xl h-10 w-10"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8" 
              : "flex flex-col gap-2 pb-8"
          )}>
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className={cn(
                  "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all border-none shadow-wiillo rounded-[24px] overflow-hidden bg-white/80",
                  viewMode === 'list' && "flex items-center p-3"
                )}
                onClick={() => addToCart(product)}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square bg-primary/5 flex items-center justify-center p-8 relative">
                      <Package className="h-12 w-12 text-primary/20" />
                      {product.stock < product.reorderLevel && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="destructive" className="rounded-full">Low Stock</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5">
                      <div className="font-bold text-lg leading-tight truncate">{product.name}</div>
                      <div className="text-xs text-muted font-bold mt-1 uppercase tracking-wider">{product.category}</div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="font-black text-xl text-primary">${product.price.toFixed(2)}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-muted font-bold uppercase">{product.sku}</span>
                          <span className="text-[11px] font-bold text-muted-foreground">{product.stock} {product.unit} left</span>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full px-4 py-1">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/5 p-3 rounded-xl">
                        <Package className="h-5 w-5 text-primary/50" />
                      </div>
                      <div>
                        <div className="font-bold">{product.name}</div>
                        <div className="text-xs text-muted font-bold uppercase tracking-widest">{product.category} • {product.sku}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <span className="block font-black text-primary">${product.price.toFixed(2)}</span>
                        <span className="text-[10px] text-muted-foreground">{product.stock} in stock</span>
                      </div>
                      <Button size="icon" variant="secondary" className="h-10 w-10 rounded-xl bg-primary/5 text-primary">
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Card className="w-[440px] flex flex-col shadow-2xl border-none rounded-[28px] bg-white/90 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1.5 wiillo-grad"></div>
        <CardHeader className="py-6 px-8 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" /> Active Order
            </CardTitle>
            <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Cashier: Jane Admin</p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary font-bold px-3 py-1 text-sm border-none">{cart.length} items</Badge>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-6 space-y-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 text-center">
              <ShoppingCart className="h-20 w-20 mb-6" />
              <p className="text-xl font-bold">Your cart is empty.</p>
              <p className="text-sm mt-2">Scan an item to start checkout.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between group bg-muted/20 p-4 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                <div className="flex-1">
                  <div className="font-bold text-sm">{item.product.name}</div>
                  <div className="text-xs text-muted font-bold uppercase tracking-wider mt-0.5">${item.product.price.toFixed(2)} / {item.product.unit}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-border/50">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-lg" 
                      onClick={() => updateQty(item.product.id, -1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center font-black text-sm">{item.qty}</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-lg" 
                      onClick={() => updateQty(item.product.id, 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="w-20 text-right font-black text-primary">
                    ${(item.product.price * item.qty).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
        <CardFooter className="flex flex-col p-8 bg-muted/30 border-t border-border/50">
          <div className="w-full space-y-3 mb-8">
            <div className="flex justify-between text-sm font-bold text-muted">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-muted/60">
              <span>Tax ({(currentTenant?.taxRate || 0.15) * 100}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black pt-4 border-t border-dashed border-border text-foreground">
              <span>Total</span>
              <span className="wiillo-grad-text">${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="space-y-4 w-full">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted text-center">Payment Method</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash', icon: Banknote },
                { id: 'card', icon: CreditCard },
                { id: 'mobile', icon: Smartphone },
                { id: 'transfer', icon: History }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                    paymentMethod === method.id 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-transparent bg-white text-muted hover:bg-white/80"
                  )}
                >
                  <method.icon className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase">{method.id}</span>
                </button>
              ))}
            </div>
          </div>

          <Button 
            className="w-full h-16 mt-8 text-xl font-black shadow-xl shadow-primary/30 rounded-2xl wiillo-grad border-none" 
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            Complete Order
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
