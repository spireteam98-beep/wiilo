
"use client";

import { useState } from 'react';
import { useStore, Product } from '@/lib/store';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  AlertTriangle,
  Download,
  Package,
  ArrowRightLeft,
  RotateCcw,
  History,
  Tag,
  Hash,
  Box
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const categories = ['Groceries', 'Electronics', 'Clothes', 'Cosmetics', 'Hardware'];

export default function InventoryPage() {
  const { products, addProduct } = useStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: 'Groceries',
    brand: '',
    unit: 'Piece',
    purchasePrice: 0,
    price: 0,
    wholesalePrice: 0,
    taxRate: 0,
    description: '',
    stock: 0,
    reorderLevel: 5,
    critical: false,
    popular: false,
    status: 'active'
  });

  const lowStock = products.filter(p => p.stock < p.reorderLevel);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.sku) {
      toast({ title: "Error", description: "Name and SKU are required.", variant: "destructive" });
      return;
    }

    const productToAdd: Product = {
      ...newProduct as Product,
      id: `p-${Math.random().toString(36).substr(2, 9)}`,
    };

    addProduct(productToAdd);
    setIsAddDialogOpen(false);
    toast({ title: "Product Added", description: `${productToAdd.name} has been added to inventory.` });
    setNewProduct({
      name: '',
      sku: '',
      category: 'Groceries',
      brand: '',
      unit: 'Piece',
      purchasePrice: 0,
      price: 0,
      wholesalePrice: 0,
      taxRate: 0,
      description: '',
      stock: 0,
      reorderLevel: 5,
      critical: false,
      popular: false,
      status: 'active'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage stock, transfers, and adjustments across all outlets.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl h-12 bg-white/80 border-white/60 shadow-wiillo gap-2">
            <History className="h-4 w-4" /> History
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 wiillo-grad text-white font-bold gap-2 shadow-lg shadow-primary/20 border-none px-6">
                <Plus className="h-4 w-4" /> New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border-none shadow-wiillo">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Add New Product</DialogTitle>
                <DialogDescription>Enter product details to add it to your shop catalog.</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Product Name</Label>
                    <Input 
                      placeholder="e.g. Arabica Beans" 
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted">SKU / Barcode</Label>
                    <Input 
                      placeholder="SKU-12345" 
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Category</Label>
                      <Select 
                        value={newProduct.category} 
                        onValueChange={(val) => setNewProduct({ ...newProduct, category: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Brand</Label>
                      <Input 
                        placeholder="Brand Name" 
                        value={newProduct.brand}
                        onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Purchase Price</Label>
                      <Input 
                        type="number"
                        placeholder="0.00" 
                        value={newProduct.purchasePrice}
                        onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Selling Price</Label>
                      <Input 
                        type="number"
                        placeholder="0.00" 
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Wholesale Price</Label>
                      <Input 
                        type="number"
                        placeholder="0.00" 
                        value={newProduct.wholesalePrice}
                        onChange={(e) => setNewProduct({ ...newProduct, wholesalePrice: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Tax Rate (%)</Label>
                      <Input 
                        type="number"
                        placeholder="0" 
                        value={newProduct.taxRate}
                        onChange={(e) => setNewProduct({ ...newProduct, taxRate: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Initial Stock</Label>
                      <Input 
                        type="number"
                        placeholder="0" 
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Reorder Level</Label>
                      <Input 
                        type="number"
                        placeholder="5" 
                        value={newProduct.reorderLevel}
                        onChange={(e) => setNewProduct({ ...newProduct, reorderLevel: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted">Description</Label>
                    <Textarea 
                      placeholder="Product specifications..." 
                      className="h-20"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Active Status</Label>
                      <p className="text-[10px] text-muted-foreground">Product is available for sale.</p>
                    </div>
                    <Switch 
                      checked={newProduct.status === 'active'}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, status: checked ? 'active' : 'inactive' })}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl h-12">Cancel</Button>
                <Button onClick={handleAddProduct} className="rounded-xl h-12 wiillo-grad text-white px-8 font-black border-none">Create Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-wiillo bg-white/80 rounded-[24px] p-6">
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest block mb-2">Total SKU</span>
          <div className="text-3xl font-black">{products.length}</div>
          <p className="text-xs text-muted-foreground mt-2">Active items in catalog</p>
        </Card>
        <Card className="border-none shadow-wiillo bg-orange-50/50 border border-orange-100/50 rounded-[24px] p-6">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block mb-2">Low Stock Alerts</span>
          <div className="text-3xl font-black text-orange-700">{lowStock.length}</div>
          <p className="text-xs text-orange-600/70 mt-2">Requires immediate reorder</p>
        </Card>
        <Card className="border-none shadow-wiillo bg-white/80 rounded-[24px] p-6">
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest block mb-2">Total Items</span>
          <div className="text-3xl font-black">{products.reduce((a, b) => a + b.stock, 0)}</div>
          <p className="text-xs text-muted-foreground mt-2">Aggregated stock count</p>
        </Card>
        <Card className="border-none shadow-wiillo bg-primary/5 rounded-[24px] p-6">
          <span className="text-[11px] font-bold text-primary uppercase tracking-widest block mb-2">Inventory Value</span>
          <div className="text-3xl font-black text-primary">${products.reduce((a, b) => a + (b.stock * b.purchasePrice), 0).toLocaleString()}</div>
          <p className="text-xs text-primary/70 mt-2">At cost valuation</p>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-white/80 p-1 rounded-2xl border border-border/50 shadow-sm">
            <TabsTrigger value="all" className="rounded-xl px-6 font-bold">All Products</TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-xl px-6 font-bold">Stock Alerts</TabsTrigger>
            <TabsTrigger value="transfers" className="rounded-xl px-6 font-bold">Transfers</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-3">
            <div className="relative w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-primary transition-colors" />
              <Input placeholder="Search SKU, name..." className="pl-10 h-10 bg-white/80 border-white/60 rounded-xl" />
            </div>
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 bg-white/80"><Filter className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 bg-white/80"><Download className="h-4 w-4" /></Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card className="border-none shadow-wiillo bg-white/80 rounded-[28px] overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted pl-8">Product Details</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted">Category</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted">Cost / Price</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted text-center">In Stock</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted text-center">Status</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-muted text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Box className="h-12 w-12" />
                        <p className="font-bold">No products in catalog.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className="group hover:bg-white/40 transition-colors border-border/30">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black shadow-sm border border-primary/10 overflow-hidden">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              product.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{product.name}</div>
                            <div className="text-[10px] text-muted font-bold tracking-widest uppercase">{product.sku} • {product.brand || 'No Brand'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-xl px-3 py-1 font-bold text-[10px] uppercase tracking-wider bg-primary/5 text-primary border-none">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground">Buy: ${product.purchasePrice.toFixed(2)}</span>
                          <span className="text-sm font-black text-foreground">Sell: ${product.price.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "text-lg font-black",
                            product.stock < product.reorderLevel ? "text-orange-600" : "text-foreground"
                          )}>
                            {product.stock}
                          </span>
                          <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">{product.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <span className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            product.status === 'active' 
                              ? "bg-green-50 text-green-700 border-green-100" 
                              : "bg-muted/50 text-muted-foreground border-border/50"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              product.status === 'active' ? "bg-green-500" : "bg-muted-foreground"
                            )}></span>
                            {product.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary"><ArrowRightLeft className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary"><RotateCcw className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary"><MoreVertical className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lowStock.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-30">
                <Box className="h-16 w-16 mx-auto mb-4" />
                <p className="text-xl font-bold">No stock alerts at this time.</p>
              </div>
            ) : (
              lowStock.map(p => (
                <Card key={p.id} className="border-none shadow-wiillo bg-white/80 rounded-[24px] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <AlertTriangle className="h-8 w-8 text-orange-400 opacity-20" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                  <p className="text-xs text-muted font-bold uppercase mb-4">{p.sku}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-muted font-bold uppercase block">Current Stock</span>
                      <span className="text-3xl font-black text-orange-600">{p.stock}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted font-bold uppercase block">Reorder Point</span>
                      <span className="text-xl font-bold">{p.reorderLevel}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 rounded-xl wiillo-grad border-none font-bold h-11 shadow-lg shadow-primary/10">Create Purchase Order</Button>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
