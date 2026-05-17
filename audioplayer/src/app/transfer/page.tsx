'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

export default function TransferPage() {
  const router = useRouter();
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = () => {
    router.push('/transfer/confirm');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-background/80 to-background/60 relative">
      {/* Glass blur background accent */}
      <div className="absolute inset-0 bg-[url('/your-brand-pattern.svg')] bg-cover bg-center opacity-10" />

      <header className="container mx-auto max-w-md flex items-center justify-between py-6 px-4 relative z-10">
        <Link href="/" className="z-10">
          <Button variant="ghost" size="icon" className="rounded-lg h-10 w-10 backdrop-blur-md bg-white/10 border border-white/20">
            <ChevronLeft className="h-6 w-6 text-primary" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold absolute left-1/2 -translate-x-1/2 text-white drop-shadow-md">
          Send Money
        </h1>
      </header>

      <main className="flex-1 relative z-10">
        <div className="container mx-auto max-w-md space-y-8 px-4">
          <Card className="border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="receiver-number" className="text-white/90">Receiver Number</Label>
                <Input
                  id="receiver-number"
                  placeholder="Enter receiver's number"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white/90">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 bg-white/10 backdrop-blur-md border border-white/20 text-2xl font-bold text-white placeholder-white/50 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSend}
            className="w-full h-12 text-base font-bold text-black bg-primary hover:bg-primary/90 rounded-xl shadow-lg backdrop-blur-md"
          >
            Send
          </Button>
        </div>
      </main>
    </div>
  );
}
