import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useAnalytics } from '@/hooks/useAnalytics';

export function WalletConnectTracker() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { trackWalletConnect, setWalletAddress } = useAnalytics();

  // Track wallet connection
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
      trackWalletConnect();
    }
  }, [isConnected, address, trackWalletConnect, setWalletAddress]);

  // Track wallet disconnection
  useEffect(() => {
    const handleDisconnect = () => {
      // You can add additional tracking for disconnections if needed
      console.log('Wallet disconnected');
    };

    window.addEventListener('beforeunload', handleDisconnect);
    return () => {
      window.removeEventListener('beforeunload', handleDisconnect);
    };
  }, []);

  return null; // This is a utility component that doesn't render anything
}

export default WalletConnectTracker;
