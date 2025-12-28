import React from 'react';

type Props = { message: string; onClose?: () => void };

export const ErrorToast: React.FC<Props> = ({ message, onClose }) => {
  return (
    <div role="alert" style={{ position: 'fixed', bottom: 20, right: 20, background: '#fee', padding: 12, border: '1px solid #f99' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Error</div>
      <div style={{ marginBottom: 8 }}>{message}</div>
      <button onClick={() => onClose && onClose()}>Dismiss</button>
    </div>
  );
};

export default ErrorToast;
