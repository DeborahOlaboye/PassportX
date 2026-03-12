'use client';

import { useState } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { TransactionErrorFallback } from '../FallbackUI';

export function TransactionHistory() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <TransactionErrorFallback error={error} reset={reset} />
      )}
    >
      <TransactionHistoryInner />
    </ErrorBoundary>
  );
}

function TransactionHistoryInner() {
  const [filter, _setFilter] = useState('all');

  return (
    <div>
      <h1>Transaction History</h1>
      <p>Filter: {filter}</p>
    </div>
  );
}
