'use client';

import { useState, useMemo } from 'react';
import { useTransactionHistory } from '@/contexts/TransactionContext';
import { Transaction } from '@/types/transaction';

export function TransactionHistory() {
  const { transactions, clearHistory } = useTransactionHistory();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'method' | 'status'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.status === filter);
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter(tx =>
        tx.hash.toLowerCase().includes(search.toLowerCase()) ||
        tx.method.toLowerCase().includes(search.toLowerCase()) ||
        (tx.to && tx.to.toLowerCase().includes(search.toLowerCase())) ||
        (tx.from && tx.from.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'method':
          aValue = a.method;
          bValue = b.method;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [transactions, filter, search, sortBy, sortOrder]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (address?: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatGas = (gasUsed?: string, gasPrice?: string) => {
    if (!gasUsed || !gasPrice) return 'N/A';
    const gasCost = (parseInt(gasUsed) * parseInt(gasPrice)) / 1e18;
    return `${gasCost.toFixed(6)} ETH`;
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(filteredTransactions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `transaction-history-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Export
          </button>
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hash, method, or address"
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort by
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="timestamp">Date</option>
            <option value="method">Method</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions found</p>
        ) : (
          filteredTransactions.map((tx) => (
            <div key={tx.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{tx.method}</p>
                  <p className="text-sm text-gray-600">{formatDate(tx.timestamp)}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                  {tx.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Hash</p>
                  <p className="font-mono text-xs">{formatAddress(tx.hash)}</p>
                </div>
                <div>
                  <p className="text-gray-500">From</p>
                  <p className="font-mono text-xs">{formatAddress(tx.from)}</p>
                </div>
                <div>
                  <p className="text-gray-500">To</p>
                  <p className="font-mono text-xs">{formatAddress(tx.to)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Gas Cost</p>
                  <p className="font-mono text-xs">{formatGas(tx.gasUsed, tx.gasPrice)}</p>
                </div>
              </div>

              {tx.value && (
                <div className="mt-2">
                  <p className="text-gray-500 text-sm">Value</p>
                  <p className="font-mono text-sm">{tx.value} wei</p>
                </div>
              )}

              {tx.confirmations && (
                <div className="mt-2">
                  <p className="text-gray-500 text-sm">Confirmations</p>
                  <p className="text-sm">{tx.confirmations}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}