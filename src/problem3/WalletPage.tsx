import React, { useMemo, useCallback } from 'react';

// CSS classes - this would typically be imported from a styles file
const classes = {
  row: 'wallet-row',
  emptyState: 'wallet-empty-state'
};

// Placeholder hooks 
const useWalletBalances = (): WalletBalance[] => {
  // Implementation
  return [];
};

// Placeholder hooks 
const usePrices = (): Record<string, number> => {
  // Implementation
  return {};
};

// Define blockchain types for better type safety
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

// Fixed interface with blockchain property
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

// Simplified interface for formatted balance
interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

// Clean props interface without unnecessary BoxProps extension
interface WalletPageProps {
  className?: string;
  children?: React.ReactNode;
}

// Move getPriority outside component to prevent unnecessary re-creations
const getPriority = (blockchain: Blockchain): number => {
  switch (blockchain) {
    case 'Osmosis':
      return 100;
    case 'Ethereum':
      return 50;
    case 'Arbitrum':
      return 30;
    case 'Zilliqa':
      return 20;
    case 'Neo':
      return 20;
    default:
      return -99;
  }
};

// Safe price lookup with fallback
const getPrice = (prices: Record<string, number>, currency: string): number => {
  return prices[currency] || 0;
};

const WalletPage: React.FC<WalletPageProps> = ({ className, children }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // Alternative approach: Map first to add computed properties, then sort
  const processedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const balancePriority = getPriority(balance.blockchain);
        
        // Fixed filter logic: show only positive balances with valid priority
        return balancePriority > -99 && balance.amount > 0;
      })
      .map((balance: WalletBalance): FormattedWalletBalance => {
        const price = getPrice(prices, balance.currency);
        const usdValue = price * balance.amount;
        
        return {
          ...balance,
          formatted: balance.amount.toFixed(2),
          usdValue
        };
      })
      .sort((lhs: FormattedWalletBalance, rhs: FormattedWalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        
        // Fixed sort function with proper handling of equal priorities
        if (leftPriority > rightPriority) {
          return -1;
        } else if (rightPriority > leftPriority) {
          return 1;
        } else {
          return 0; // Equal priorities
        }
      });
  }, [balances, prices]); // Only include actually used dependencies

  // Memoized renderRows function to prevent unnecessary re-renders
  const renderRows = useCallback(() => {
    if (processedBalances.length === 0) {
      return (
        <div className={classes.emptyState}>
          No wallet balances found
        </div>
      );
    }

    return processedBalances.map((balance: FormattedWalletBalance) => (
      <WalletRow
        key={`${balance.blockchain}-${balance.currency}`} // Unique key combining currency and blockchain
        className={classes.row}
        amount={balance.amount}
        usdValue={balance.usdValue}
        formattedAmount={balance.formatted}
      />
    ));
  }, [processedBalances]);

  return (
    <div className={className}>
      {children}
      {renderRows()}
    </div>
  );
};

WalletPage.displayName = 'WalletPage';

export default WalletPage;
