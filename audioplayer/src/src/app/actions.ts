'use server';

import { getPersonalizedAssetRecommendations } from '@/ai/flows/personalized-asset-recommendations';
import { detectFraud, type FraudDetectionInput } from '@/ai/flows/ai-powered-fraud-detection';
import { myAssets, recommendedAssets as fallbackRecommended } from '@/lib/data';
import type { RecommendedAsset } from '@/lib/types';
import { Bitcoin } from 'lucide-react';
import { EthereumIcon } from '@/components/icons/ethereum';
import { SolanaIcon } from '@/components/icons/solana';
import { TetherIcon } from '@/components/icons/tether';

const iconMap: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  'BTC': Bitcoin,
  'ETH': EthereumIcon,
  'SOL': SolanaIcon,
  'USDT': TetherIcon,
};

const getIconForAsset = (assetName: string) => {
    const assetCode = assetName.match(/\(([^)]+)\)/)?.[1] || assetName.slice(0, 3).toUpperCase();
    return iconMap[assetCode] || Bitcoin;
};

export async function getRecommendations(): Promise<RecommendedAsset[]> {
  try {
    // In a real app, user profile would be dynamically determined.
    const investmentProfile = 'A user interested in long-term growth with a moderate risk tolerance, focusing on established and emerging layer-1 blockchain technologies.';
    const result = await getPersonalizedAssetRecommendations({ investmentProfile });
    
    if (result.recommendations && result.recommendations.length > 0) {
      return result.recommendations.map(rec => {
        const name = rec.split('(')[0].trim();
        const code = rec.match(/\(([^)]+)\)/)?.[1] || 'N/A';
        const Icon = getIconForAsset(name);
        return { name, code, Icon };
      });
    }
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    // Fallback to static data on error
  }
  return fallbackRecommended;
}


export async function checkForFraud(transaction: Omit<FraudDetectionInput, 'userProfile'>) {
    try {
        const userProfile = {
            id: 'user123',
            transactionHistory: [
                { amount: 0.1, currency: 'BTC', timestamp: '2023-10-01T10:00:00Z', recipient: 'address1' },
                { amount: 2.5, currency: 'ETH', timestamp: '2023-10-02T14:30:00Z', recipient: 'address2' },
            ],
            typicalLocation: 'New York, USA',
        };

        const input: FraudDetectionInput = {
            ...transaction,
            userProfile: JSON.stringify(userProfile),
        };

        const result = await detectFraud(input);
        return result;

    } catch (error) {
        console.error('Error during fraud detection:', error);
        return {
            isFraudulent: false,
            fraudExplanation: 'Could not process fraud check.',
            suggestedAction: 'Proceed with caution.',
        };
    }
}
