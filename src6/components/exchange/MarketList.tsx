
import type { FC } from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { CryptoPair } from '@/services/crypto';

interface MarketListProps {
  pairs: CryptoPair[];
}

const MarketList: FC<MarketListProps> = ({ pairs }) => {
  return (
    <section className="px-4 py-4 grid grid-cols-2 gap-3 bg-background">
      {pairs.map((pair) => (
        <Card key={pair.symbol} className="bg-card border-border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{pair.symbol}</h3>
              <Check className="h-4 w-4 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {pair.price.toLocaleString(undefined, { 
                minimumFractionDigits: pair.price < 1 ? 4 : 2, 
                maximumFractionDigits: pair.price < 1 ? 4 : 2 
              })}
            </p>
            <p className={`text-xs font-medium ${
              pair.changeDirection === 'up' ? 'text-green-500' : 
              pair.changeDirection === 'down' ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {pair.percentageChange >= 0 ? '+' : ''}{pair.percentageChange.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
};

export default MarketList;
