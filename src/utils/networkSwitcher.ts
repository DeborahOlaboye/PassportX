import { NetworkType } from '@/types/network';

export class NetworkSwitcher {
  private static readonly RESET_KEYS = [
    'transactionHistory',
    'wallet-session',
    'user-preferences',
    'cache-badges',
    'cache-communities',
    'api-cache',
  ];

  static async switchNetwork(newNetwork: NetworkType): Promise<void> {
    console.log(`Switching to ${newNetwork} network...`);

    // Clear network-specific data
    this.clearNetworkData();

    // Reset application state
    await this.resetApplicationState();

    // Update network manager
    const { networkManager } = await import('@/utils/networkManager');
    networkManager.setNetwork(newNetwork);

    // Update HTTP client
    const { httpClient } = await import('@/utils/networkManager');
    httpClient.updateNetwork(newNetwork);

    // Notify other parts of the application
    this.notifyNetworkChange(newNetwork);

    console.log(`Successfully switched to ${newNetwork} network`);
  }

  private static clearNetworkData(): void {
    // Clear localStorage items
    this.RESET_KEYS.forEach(key => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(key));
      keys.forEach(k => localStorage.removeItem(k));
    });

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear any cached API responses
    if (typeof window !== 'undefined') {
      // Clear fetch cache if available
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('api') || name.includes('stacks')) {
              caches.delete(name);
            }
          });
        });
      }
    }
  }

  private static async resetApplicationState(): Promise<void> {
    // Reset any global state that depends on network
    // This would be expanded based on the application's state management

    // For example, reset transaction contexts
    try {
      // Reset transaction history
      window.dispatchEvent(new CustomEvent('resetTransactionHistory'));

      // Reset wallet connections if needed
      window.dispatchEvent(new CustomEvent('resetWalletConnection'));

      // Reset any cached data
      window.dispatchEvent(new CustomEvent('clearCache'));
    } catch (error) {
      console.warn('Some state reset operations failed:', error);
    }
  }

  private static notifyNetworkChange(network: NetworkType): void {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('networkSwitched', {
      detail: { network }
    }));

    // Update document title or other global indicators
    document.title = `PassportX - ${network.charAt(0).toUpperCase() + network.slice(1)}`;
  }

  static getCurrentNetwork(): NetworkType {
    const saved = localStorage.getItem('passportx-network');
    return (saved === 'mainnet' || saved === 'testnet') ? saved as NetworkType : 'testnet';
  }

  static saveNetworkPreference(network: NetworkType): void {
    localStorage.setItem('passportx-network', network);
  }

  static validateNetworkSwitch(currentNetwork: NetworkType, targetNetwork: NetworkType): boolean {
    // Add any validation logic here
    // For example, warn about unsaved changes, pending transactions, etc.

    if (currentNetwork === targetNetwork) {
      console.warn('Already on target network');
      return false;
    }

    return true;
  }
}

// Hook for components to listen to network switches
export function useNetworkSwitchListener(callback: (network: NetworkType) => void) {
  if (typeof window !== 'undefined') {
    const handleNetworkSwitch = (event: CustomEvent) => {
      callback(event.detail.network);
    };

    window.addEventListener('networkSwitched', handleNetworkSwitch as EventListener);

    return () => {
      window.removeEventListener('networkSwitched', handleNetworkSwitch as EventListener);
    };
  }

  return () => {};
}