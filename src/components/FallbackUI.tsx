import React from 'react';

export const FallbackUI: React.FC<{ message?: string; onRetry?: () => void }> = ({ message = 'Something went wrong.', onRetry }) => (
  <div style={{ padding: 20, textAlign: 'center' }}>
    <div style={{ fontSize: 18, marginBottom: 8 }}>{message}</div>
    {onRetry && <button onClick={onRetry}>Retry</button>}
  </div>
);

export default FallbackUI;
