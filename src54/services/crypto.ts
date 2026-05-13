/**
 * Represents a cryptocurrency pair.
 */
export interface CryptoPair {
  /**
   * The symbol of the cryptocurrency pair (e.g., BTC/USDT).
   */
  symbol: string;
  /**
   * The current price of the pair.
   */
  price: number;
  /**
   * The percentage change in the last 24 hours.
   */
  percentageChange: number;
  /**
   * The direction of the price change.
   */
  changeDirection: 'up' | 'down' | 'neutral';
}

/**
 * Asynchronously retrieves the top N cryptocurrency pairs.
 * This is a mock implementation.
 *
 * @param count The number of top pairs to retrieve.
 * @returns A promise that resolves to an array of CryptoPair objects.
 */
export async function getTopCryptoPairs(count: number = 6): Promise<CryptoPair[]> {
  const allPairs: CryptoPair[] = [
    {
      symbol: 'BTC/USDT',
      price: 94634.50,
      percentageChange: -1.41,
      changeDirection: 'down',
    },
    {
      symbol: 'ETH/USDT',
      price: 1813.50,
      percentageChange: -1.43,
      changeDirection: 'down',
    },
    {
      symbol: 'APEX/USDT',
      price: 0.8092,
      percentageChange: 0.36,
      changeDirection: 'up',
    },
    {
      symbol: 'MNT/USDT',
      price: 0.7204,
      percentageChange: -1.40,
      changeDirection: 'down',
    },
    {
      symbol: 'SOL/USDT',
      price: 144.93,
      percentageChange: -1.33,
      changeDirection: 'down',
    },
    {
      symbol: 'ONDO/USDT',
      price: 0.8662,
      percentageChange: -1.52,
      changeDirection: 'down',
    },
    {
      symbol: 'ADA/USDT',
      price: 0.58,
      percentageChange: 2.15,
      changeDirection: 'up',
    },
    {
      symbol: 'DOGE/USDT',
      price: 0.15,
      percentageChange: -0.50,
      changeDirection: 'down',
    },
  ];
  return allPairs.slice(0, count);
}
