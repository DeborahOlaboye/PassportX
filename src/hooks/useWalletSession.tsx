import { useContext } from 'react';
import { WalletSessionContext } from '../context/WalletSessionContext';

export const useWalletSession = () => {
  const ctx = useContext(WalletSessionContext);
  if (!ctx) throw new Error('useWalletSession must be used within WalletSessionProvider');
  return ctx;
};

export default useWalletSession;
