'use client';

import { Card, CardContent } from '@/components/ui/card';
import { recommendedAssets as fallbackRecommended } from '@/lib/data';
import type { RecommendedAsset } from '@/lib/types';
import AssetSparkline from './asset-sparkline';
import { BnbIcon } from '../icons/bnb';
import { CardanoIcon } from '../icons/cardano';

const recommendations: RecommendedAsset[] = fallbackRecommended.map(rec => {
  const mockupData: { [key: string]: { trend: number; value: string } } = {
    'BNB': { trend: 1.37, value: '216.3' },
    'ADL': { trend: 2.72, value: '0.4976' },
  };

  return {
    ...rec,
    trend: mockupData[rec.code]?.trend || (Math.random() * 5),
    value: mockupData[rec.code]?.value || (Math.random() * 300).toFixed(1),
    chartData: Array.from({ length: 10 }, (_, i) => ({ name: `Day ${i}`, value: Math.random() * 100 + 200 })),
    Icon: rec.code === 'BNB' ? BnbIcon : CardanoIcon,
  };
});

export default function RecommendedAssets() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Recommended</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {recommendations.map((asset) => (
          <Card key={asset.name} className="bg-card hover:bg-muted/50 transition-colors">
            <CardContent className="flex flex-col p-4 gap-2">
              <div className="flex items-center gap-2">
                 <div className={`${asset.code === 'BNB' ? 'bg-yellow-400' : 'bg-blue-900'} rounded-full p-1`}>
                    <asset.Icon className="h-6 w-6 text-white" />
                 </div>
                 <p className="font-semibold">{asset.code}</p>
              </div>
              <div className="h-10 w-full">
                <AssetSparkline data={asset.chartData || []} trend="up" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-green-500 font-semibold text-sm">+{asset.trend?.toFixed(2)}%</span>
                <span className="text-foreground font-bold">{asset.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
