'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts';

interface AssetSparklineProps {
  data: { name: string; value: number }[];
  trend: 'up' | 'down';
}

export default function AssetSparkline({ data, trend }: AssetSparklineProps) {
  const trendColor = trend === 'up' ? '#16a34a' : '#dc2626'; // green-600 or red-600

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 5,
          right: 0,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id={`colorUv-${trend}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={trendColor} stopOpacity={0.4}/>
            <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={trendColor}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#colorUv-${trend})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
