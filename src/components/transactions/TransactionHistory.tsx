'use client';

import { useState } from 'react';

export function TransactionHistory() {
  const [filter, setFilter] = useState('all');

  return (
    <div>
      <h1>Transaction History</h1>
      <p>Filter: {filter}</p>
    </div>
  );
}