
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { myAssets } from '@/lib/data';
import AssetSparkline from './asset-sparkline';

export default function MyAssets() {
  return (
    <Card className="bg-transparent shadow-none border-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl font-semibold">My Assets</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-3">
          {myAssets.map((asset) => (
            <Card key={asset.code} className="p-3 bg-card">
                <CardContent className="p-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${asset.code === 'BTC' ? 'bg-primary' : 'bg-gray-700'}`}>
                         <asset.Icon className={`h-6 w-6 ${asset.code === 'BTC' ? 'text-black' : 'text-white'}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold">{asset.name}</span>
                             {asset.trendValue && (
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-16 h-8 -ml-2">
                                        <AssetSparkline data={asset.chartData} trend={asset.trendDirection} />
                                    </div>
                                    <span className={`${asset.trendDirection === 'up' ? 'text-green-500' : 'text-red-500'} font-semibold`}>
                                        {asset.trend.toFixed(1)}%
                                    </span>
                                    <span className="text-muted-foreground">${asset.trendValue.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <p className="font-semibold">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(asset.usdValue)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {asset.balance.toFixed(asset.code === 'USDT' ? 2 : 8)} {asset.code}
                        </p>
                    </div>
                </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
