'use client';

import { Card, CardContent } from '@/components/ui/card';
import { recommendedAssets as fallbackRecommended } from '@/lib/data';
import type { RecommendedAsset } from '@/lib/types';
import AssetSparkline from './asset-sparkline';
import { BnbIcon } from '../icons/bnb';
import { CardanoIcon } from '../icons/cardano';

// Deterministic pseudo-random helper (repeatable across server & client)
const seeded = (key: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  }
  const x = Math.abs(Math.sin(h) * 10000);
  return x - Math.floor(x);
};

const recommendations: RecommendedAsset[] = fallbackRecommended.map((rec, idx) => {
  const mockupData: { [key: string]: { trend: number; value: string } } = {
    'BNB': { trend: 1.37, value: '216.3' },
    'ADL': { trend: 2.72, value: '0.4976' },
  };

  const trend = mockupData[rec.code]?.trend ?? Number((seeded(rec.code + String(idx)) * 5).toFixed(2));
  const value = mockupData[rec.code]?.value ?? (Math.round((seeded(rec.code + String(idx) + 'v') * 300) * 10) / 10).toFixed(1);
  const chartData = Array.from({ length: 10 }, (_, i) => ({ name: `Day ${i}`, value: Math.floor(seeded(rec.code + String(i) + 'c') * 100 + 200) }));

  return {
    ...rec,
    trend,
    value,
    chartData,
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
