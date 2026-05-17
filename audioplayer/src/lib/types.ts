
import type { FC, SVGProps } from 'react';

export interface Asset {
  name: string;
  code: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
  balance: number;
  usdValue: number;
  trend: number;
  trendDirection: 'up' | 'down';
  trendValue?: number;
  chartData: { name: string; value: number }[];
}

export interface RecommendedAsset {
  name: string;
  code: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
  trend?: number;
  value?: string;
  chartData?: { name: string; value: number }[];
}
