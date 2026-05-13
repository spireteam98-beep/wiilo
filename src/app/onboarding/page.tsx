"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, BusinessType } from '@/lib/store';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Utensils, Coffee, Pill, Globe, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const businessTypes: { type: BusinessType; icon: any; description: string }[] = [
  { type: 'Shop', icon: ShoppingBag, description: 'Retail stores, boutiques, supermarkets' },
  { type: 'Restaurant', icon: Utensils, description: 'Fine dining, fast food, casual eateries' },
  { type: 'Coffee shop', icon: Coffee, description: 'Cafes, bakeries, juice bars' },
  { type: 'Pharmacy', icon: Pill, description: 'Medical stores, healthcare outlets' },
  { type: 'E-commerce', icon: Globe, description: 'Online only or omni-channel businesses' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { setTenant } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/signup');
    }
  }, [user, isUserLoading, router]);

  const handleComplete = async () => {
    if (!selectedType || !businessName || !user || !firestore) return;
    
    setLoading(true);
    const businessId = Math.random().toString(36).substr(2, 9);
    
    try {
      // 1. Create global user map (required for security rules bootstrap)
      await setDoc(doc(firestore, 'users_global', user.uid), {
        id: user.uid,
        tenantId: businessId,
        email: user.email,
        updatedAt: serverTimestamp(),
      });

      // 2. Create tenant document
      await setDoc(doc(firestore, 'tenants', businessId), {
        id: businessId,
        name: businessName,
        industryType: selectedType,
        onboardingDate: new Date().toISOString(),
        isEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Create tenant-specific user profile
      await setDoc(doc(firestore, 'tenants', businessId, 'users', user.uid), {
        id: user.uid,
        tenantId: businessId,
        email: user.email,
        firstName: user.email?.split('@')[0] || 'New',
        lastName: 'User',
        roleIds: ['admin'],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setTenant({
        id: businessId,
        name: businessName,
        type: selectedType,
      });

      toast({ title: "Setup Complete", description: "Welcome to your new workspace!" });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Setup failed", 
        description: error.message || "Something went wrong during onboarding.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="brand-mark scale-125">
            <span className="brand-dot brand-dot-1"></span>
            <span className="brand-dot brand-dot-2"></span>
            <span className="brand-dot brand-dot-3"></span>
          </div>
          <span className="text-3xl font-black wiillo-grad-text tracking-tighter">wiillo</span>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight mb-3">What do you sell?</h1>
              <p className="text-muted text-lg">Select your industry to personalize your calm command center.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {businessTypes.map(({ type, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "flex flex-col items-start p-8 rounded-[28px] border-2 text-left transition-all duration-300 group shadow-wiillo",
                    selectedType === type 
                      ? "border-primary bg-white ring-4 ring-primary/5" 
                      : "border-transparent bg-white/70 hover:bg-white/90 hover:border-primary/20"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
                    selectedType === type ? "wiillo-grad text-white scale-110 shadow-lg" : "bg-primary/5 text-muted group-hover:scale-105"
                  )}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-extrabold text-xl mb-2 tracking-tight">{type}</h3>
                  <p className="text-sm text-muted leading-relaxed">{description}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-center pt-6">
              <Button 
                size="lg" 
                disabled={!selectedType} 
                onClick={() => setStep(2)}
                className="h-14 px-10 rounded-[20px] wiillo-grad text-white font-bold text-lg shadow-[0_16px_28px_rgba(124,58,237,0.22)] border-none gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Next Step <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <Card className="animate-in fade-in slide-in-from-bottom-6 duration-700 shadow-wiillo border-none bg-white/80 backdrop-blur-xl rounded-[28px] overflow-hidden">
            <CardHeader className="p-10 pb-4">
              <CardTitle className="text-3xl font-extrabold tracking-tight">Set up your profile</CardTitle>
              <CardDescription className="text-lg text-muted">Give your {selectedType?.toLowerCase()} a name and launch your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="space-y-3">
                <Label htmlFor="businessName" className="text-xs font-black uppercase tracking-widest text-muted">Business Name</Label>
                <Input 
                  id="businessName" 
                  placeholder="e.g. Northstar Capital" 
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-14 bg-white/80 border-border rounded-2xl px-6 text-lg focus-visible:ring-primary/20"
                />
              </div>
              <div className="p-6 bg-primary/5 border border-primary/10 rounded-[24px] space-y-4">
                <h4 className="text-xs font-black flex items-center gap-2 uppercase tracking-widest text-primary">
                  <Sparkles className="h-4 w-4" /> Smart Modules Activated:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Inventory', 'Sales', 'POS', 'AI Assistant'].map(mod => (
                    <span key={mod} className="bg-white/80 px-4 py-2 rounded-xl text-[11px] font-bold border border-primary/5 shadow-sm text-muted uppercase tracking-wider">
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-10 bg-white/40 border-t border-white/20 flex justify-between gap-4">
              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-2xl h-14 px-8 font-bold text-muted hover:bg-white/60">Back</Button>
              <Button size="lg" disabled={!businessName || loading} onClick={handleComplete} className="min-w-[180px] h-14 rounded-[20px] wiillo-grad text-white font-bold text-lg shadow-[0_16px_28px_rgba(124,58,237,0.22)] border-none">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Launch wiillo'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
