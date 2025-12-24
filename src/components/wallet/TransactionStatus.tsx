'use client';

import React from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';

export type TransactionStatusType =
  | 'idle'
  | 'pending'
  | 'broadcasting'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

export interface TransactionStatusProps {
  /** The current status of the transaction */
  status: TransactionStatusType;
  /** Optional transaction hash for external links */
  txHash?: string;
  /** Optional transaction ID for display */
  txId?: string;
  /** Optional error message for failed transactions */
  error?: string;
  /** Optional confirmation count */
  confirmations?: number;
  /** Optional estimated confirmations needed */
  estimatedConfirmations?: number;
  /** Optional callback when status changes */
  onStatusClick?: () => void;
  /** Optional custom className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Custom status labels */
  statusLabels?: Partial<Record<TransactionStatusType, string>>;
}

const DEFAULT_STATUS_LABELS: Record<TransactionStatusType, string> = {
  idle: 'Ready',
  pending: 'Pending',
  broadcasting: 'Broadcasting',
  confirmed: 'Confirmed',
  failed: 'Failed',
  cancelled: 'Cancelled'
};

const STATUS_CONFIG = {
  idle: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Transaction is ready to be submitted'
  },
  pending: {
    icon: Loader2,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Transaction is being prepared'
  },
  broadcasting: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Transaction is being broadcast to the network'
  },
  confirmed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Transaction has been confirmed on the blockchain'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Transaction failed to process'
  },
  cancelled: {
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Transaction was cancelled'
  }
};

export default function TransactionStatus({
  status,
  txHash,
  txId,
  error,
  confirmations = 0,
  estimatedConfirmations = 6,
  onStatusClick,
  className = '',
  size = 'md',
  showDetails = true,
  statusLabels = {}
}: TransactionStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const displayLabel = statusLabels[status] || DEFAULT_STATUS_LABELS[status];

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const isLoading = status === 'pending' || status === 'broadcasting';

  const handleClick = () => {
    if (onStatusClick) {
      onStatusClick();
    }
  };

  const getExplorerUrl = (hash: string) => {
    // This would be configurable based on the current network
    return `https://explorer.stacks.co/txid/${hash}`;
  };

  return (
    <div
      className={`rounded-lg border ${config.bgColor} ${config.borderColor} ${sizeClasses[size]} ${
        onStatusClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      } ${className}`}
      onClick={handleClick}
      role={onStatusClick ? 'button' : undefined}
      tabIndex={onStatusClick ? 0 : undefined}
      onKeyDown={onStatusClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
      aria-label={`Transaction status: ${displayLabel}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 ${config.color}`}>
            <Icon
              className={`${iconSizes[size]} ${isLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </div>

          <div className="flex-grow">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${config.color}`}>
                {displayLabel}
              </span>

              {txId && (
                <span className="text-xs text-gray-500 font-mono">
                  #{txId}
                </span>
              )}
            </div>

            {showDetails && (
              <p className="text-sm text-gray-600 mt-1">
                {config.description}
              </p>
            )}
          </div>
        </div>

        {txHash && (
          <a
            href={getExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 ml-3 p-1 rounded hover:bg-black hover:bg-opacity-5 transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label="View transaction in explorer"
          >
            <ExternalLink className="w-4 h-4 text-gray-500" />
          </a>
        )}
      </div>

      {/* Confirmation Progress */}
      {status === 'confirmed' && confirmations > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Confirmations</span>
            <span>{confirmations} / {estimatedConfirmations}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((confirmations / estimatedConfirmations) * 100, 100)}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === 'failed' && error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Transaction Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Hash */}
      {txHash && showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Transaction Hash</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(txHash);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
              aria-label="Copy transaction hash"
            >
              Copy
            </button>
          </div>
          <p className="text-xs font-mono text-gray-700 mt-1 break-all">
            {txHash}
          </p>
        </div>
      )}
    </div>
  );
}