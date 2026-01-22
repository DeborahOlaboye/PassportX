import React from 'react';

export const FallbackUI: React.FC<{ message?: string; onRetry?: () => void }> = ({ message = 'Something went wrong.', onRetry }) => (
  <div style={{ padding: 20, textAlign: 'center', border: '1px solid #eaeaea', borderRadius: 8, margin: 10 }}>
    <div style={{ fontSize: 16, marginBottom: 8, color: '#666' }}>{message}</div>
    {onRetry && (
      <button 
        onClick={onRetry}
        style={{ padding: '8px 16px', background: '#555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        Retry
      </button>
    )}
  </div>
);

export const WalletErrorFallback: React.FC<{ error?: Error; reset?: () => void }> = ({ error, reset }) => (
  <FallbackUI 
    message={`Wallet connection failed: ${error?.message || 'Unknown error'}`} 
    onRetry={reset} 
  />
);

export const BadgeErrorFallback: React.FC<{ error?: Error; reset?: () => void }> = ({ error, reset }) => (
  <FallbackUI 
    message={`Failed to load badges: ${error?.message || 'Unknown error'}`} 
    onRetry={reset} 
  />
);

export const CommunityErrorFallback: React.FC<{ error?: Error; reset?: () => void }> = ({ error, reset }) => (
  <FallbackUI 
    message={`Community feature error: ${error?.message || 'Unknown error'}`} 
    onRetry={reset} 
  />
);

export default FallbackUI;
