import { NetworkType } from '@/types/network';

export class NetworkPersistence {
  private static readonly STORAGE_KEY = 'passportx-network';
  private static readonly MIGRATION_KEY = 'network-migration-completed';

  static saveNetwork(network: NetworkType): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, network);
      console.log(`Network preference saved: ${network}`);
    } catch (error) {
      console.error('Failed to save network preference:', error);
    }
  }

  static getSavedNetwork(): NetworkType | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === 'mainnet' || saved === 'testnet') {
        return saved as NetworkType;
      }
    } catch (error) {
      console.error('Failed to load network preference:', error);
    }
    return null;
  }

  static clearSavedNetwork(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Network preference cleared');
    } catch (error) {
      console.error('Failed to clear network preference:', error);
    }
  }

  static migrateLegacySettings(): void {
    // Check if migration already completed
    if (localStorage.getItem(this.MIGRATION_KEY)) {
      return;
    }

    try {
      // Migrate from old settings if they exist
      const oldNetwork = localStorage.getItem('network');
      if (oldNetwork === 'mainnet' || oldNetwork === 'testnet') {
        this.saveNetwork(oldNetwork as NetworkType);
        localStorage.removeItem('network'); // Clean up old key
        console.log('Migrated legacy network setting');
      }

      // Mark migration as completed
      localStorage.setItem(this.MIGRATION_KEY, 'true');
    } catch (error) {
      console.error('Network migration failed:', error);
    }
  }

  static exportSettings(): Record<string, any> {
    const settings: Record<string, any> = {};

    try {
      const network = this.getSavedNetwork();
      if (network) {
        settings.network = network;
      }

      // Add other network-related settings here
      settings.exportedAt = new Date().toISOString();
      settings.version = '1.0';
    } catch (error) {
      console.error('Failed to export network settings:', error);
    }

    return settings;
  }

  static importSettings(settings: Record<string, any>): boolean {
    try {
      if (settings.network && (settings.network === 'mainnet' || settings.network === 'testnet')) {
        this.saveNetwork(settings.network);
        console.log('Network settings imported successfully');
        return true;
      }
    } catch (error) {
      console.error('Failed to import network settings:', error);
    }
    return false;
  }

  static getStorageSize(): number {
    try {
      const network = localStorage.getItem(this.STORAGE_KEY);
      return network ? network.length : 0;
    } catch (error) {
      return 0;
    }
  }

  static cleanupOrphanedData(): void {
    // Clean up any orphaned network-related data
    const keysToCheck = [
      'network-cache',
      'network-preferences',
      'old-network-setting'
    ];

    keysToCheck.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        // Ignore errors for cleanup
      }
    });
  }
}

// Initialize migration on module load
if (typeof window !== 'undefined') {
  NetworkPersistence.migrateLegacySettings();
}