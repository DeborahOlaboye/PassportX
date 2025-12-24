'use client';

import { useState, useMemo } from 'react';
import { useTransactionHistory } from '@/contexts/TransactionContext';
import { Transaction } from '@/types/transaction';

export function TransactionHistory() {
  const { transactions, clearHistory } = useTransactionHistory();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.status === filter);
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom).getTime();
      filtered = filtered.filter(tx => tx.timestamp >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000; // End of day
      filtered = filtered.filter(tx => tx.timestamp <= toDate);
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

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalTransactions = filteredTransactions.length;
  const confirmedTransactions = filteredTransactions.filter(tx => tx.status === 'confirmed').length;
  const pendingTransactions = filteredTransactions.filter(tx => tx.status === 'pending').length;
  const failedTransactions = filteredTransactions.filter(tx => tx.status === 'failed').length;
  const totalGasCost = filteredTransactions
    .filter(tx => tx.gasUsed && tx.gasPrice)
    .reduce((sum, tx) => sum + (parseInt(tx.gasUsed!) * parseInt(tx.gasPrice!)) / 1e18, 0);

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

  const exportHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dataStr = JSON.stringify(filteredTransactions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `transaction-history-${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      setError('Failed to export transaction history');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportHistory}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export transaction history as JSON file"
          >
            {isLoading ? 'Exporting...' : 'Export'}
          </button>
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            aria-label="Clear all transaction history"
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
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {paginatedTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions found</p>
        ) : (
          paginatedTransactions.map((tx) => (
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

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total</p>
            <p className="text-2xl font-bold">{totalTransactions}</p>
          </div>
          <div>
            <p className="text-gray-500">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{confirmedTransactions}</p>
          </div>
          <div>
            <p className="text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingTransactions}</p>
          </div>
          <div>
            <p className="text-gray-500">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failedTransactions}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Gas Cost</p>
            <p className="text-lg font-bold">{totalGasCost.toFixed(4)} ETH</p>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}