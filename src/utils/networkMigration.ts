import { NetworkType, NetworkConfig } from '@/types/network';

export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  errors: string[];
  timestamp: number;
}

export interface LegacyNetworkData {
  network?: string;
  selectedNetwork?: string;
  currentNetwork?: string;
  networkConfig?: any;
  [key: string]: any;
}

export class NetworkMigration {
  private static instance: NetworkMigration;
  private readonly LEGACY_KEYS = [
    'network-preference',
    'selected-network',
    'current-network',
    'network-config',
    'stacks-network',
    'passport-network',
  ];

  private readonly MIGRATION_VERSION = '1.0.0';

  private constructor() {}

  public static getInstance(): NetworkMigration {
    if (!NetworkMigration.instance) {
      NetworkMigration.instance = new NetworkMigration();
    }
    return NetworkMigration.instance;
  }

  public migrateLegacyData(): MigrationResult {
    const result: MigrationResult = {
      success: true,
      migratedKeys: [],
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // Check if migration has already been performed
      const migrationStatus = localStorage.getItem('network-migration-status');
      if (migrationStatus) {
        const parsed = JSON.parse(migrationStatus);
        if (parsed.version === this.MIGRATION_VERSION && parsed.success) {
          return {
            success: true,
            migratedKeys: [],
            errors: ['Migration already completed'],
            timestamp: Date.now(),
          };
        }
      }

      // Collect all legacy data
      const legacyData: Record<string, any> = {};

      for (const key of this.LEGACY_KEYS) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            legacyData[key] = JSON.parse(value);
            result.migratedKeys.push(key);
          } catch (parseError) {
            result.errors.push(`Failed to parse ${key}: ${parseError}`);
          }
        }
      }

      // Perform migration
      const migratedData = this.performMigration(legacyData);

      // Store migrated data
      if (migratedData.network) {
        localStorage.setItem('network-preference', JSON.stringify(migratedData.network));
      }

      // Clean up legacy keys
      for (const key of result.migratedKeys) {
        localStorage.removeItem(key);
      }

      // Mark migration as completed
      localStorage.setItem('network-migration-status', JSON.stringify({
        version: this.MIGRATION_VERSION,
        success: true,
        timestamp: result.timestamp,
        migratedKeys: result.migratedKeys,
      }));

    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
    }

    return result;
  }

  private performMigration(legacyData: Record<string, any>): { network?: any } {
    let networkPreference: NetworkType = 'testnet'; // Default fallback
    let networkConfig: Partial<NetworkConfig> = {};

    // Extract network preference from various legacy keys
    for (const [key, data] of Object.entries(legacyData)) {
      if (this.isValidNetworkType(data)) {
        networkPreference = data as NetworkType;
        break;
      }

      if (typeof data === 'object' && data !== null) {
        if (this.isValidNetworkType(data.network)) {
          networkPreference = data.network as NetworkType;
        }
        if (this.isValidNetworkType(data.selectedNetwork)) {
          networkPreference = data.selectedNetwork as NetworkType;
        }
        if (this.isValidNetworkType(data.currentNetwork)) {
          networkPreference = data.currentNetwork as NetworkType;
        }

        // Extract any additional config
        if (data.config) {
          networkConfig = { ...networkConfig, ...data.config };
        }
        if (data.settings) {
          networkConfig = { ...networkConfig, ...data.settings };
        }
      }
    }

    return {
      network: {
        network: networkPreference,
        config: networkConfig,
        migrated: true,
        migrationTimestamp: Date.now(),
      },
    };
  }

  private isValidNetworkType(value: any): value is NetworkType {
    return typeof value === 'string' && (value === 'mainnet' || value === 'testnet');
  }

  public rollbackMigration(): MigrationResult {
    const result: MigrationResult = {
      success: false,
      migratedKeys: [],
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // Get migration status
      const migrationStatus = localStorage.getItem('network-migration-status');
      if (!migrationStatus) {
        result.errors.push('No migration status found');
        return result;
      }

      const status = JSON.parse(migrationStatus);
      if (!status.migratedKeys || !Array.isArray(status.migratedKeys)) {
        result.errors.push('Invalid migration status');
        return result;
      }

      // Get current network preference
      const currentPreference = localStorage.getItem('network-preference');
      if (!currentPreference) {
        result.errors.push('No current network preference to rollback');
        return result;
      }

      const preference = JSON.parse(currentPreference);

      // Restore legacy data (as much as possible)
      for (const key of status.migratedKeys) {
        // This is a simplified rollback - in practice, you'd need to store
        // the original values during migration
        localStorage.setItem(key, JSON.stringify({
          network: preference.network,
          migrated: false,
        }));
      }

      // Remove migrated data
      localStorage.removeItem('network-preference');
      localStorage.removeItem('network-migration-status');

      result.success = true;
      result.migratedKeys = status.migratedKeys;

    } catch (error) {
      result.errors.push(`Rollback failed: ${error}`);
    }

    return result;
  }

  public getMigrationStatus(): {
    migrated: boolean;
    version?: string;
    timestamp?: number;
    migratedKeys?: string[];
  } {
    try {
      const status = localStorage.getItem('network-migration-status');
      if (status) {
        return { migrated: true, ...JSON.parse(status) };
      }
    } catch (error) {
      console.warn('Failed to parse migration status:', error);
    }

    return { migrated: false };
  }

  public exportMigrationData(): string {
    const data = {
      migrationStatus: this.getMigrationStatus(),
      currentNetworkPreference: localStorage.getItem('network-preference'),
      legacyKeys: this.LEGACY_KEYS.map(key => ({
        key,
        exists: localStorage.getItem(key) !== null,
      })),
      exportTimestamp: Date.now(),
    };

    return JSON.stringify(data, null, 2);
  }

  public clearMigrationData(): void {
    localStorage.removeItem('network-migration-status');

    // Note: This doesn't restore legacy data, just removes migration tracking
    // Use rollbackMigration() if you want to restore legacy format
  }

  public validateMigration(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const status = this.getMigrationStatus();

    if (!status.migrated) {
      return { valid: true, issues: [] }; // No migration performed, nothing to validate
    }

    // Check if current network preference exists
    const currentPreference = localStorage.getItem('network-preference');
    if (!currentPreference) {
      issues.push('Network preference missing after migration');
    } else {
      try {
        const preference = JSON.parse(currentPreference);
        if (!this.isValidNetworkType(preference.network)) {
          issues.push('Invalid network type in migrated preference');
        }
      } catch (error) {
        issues.push('Failed to parse migrated network preference');
      }
    }

    // Check for any remaining legacy keys
    for (const key of this.LEGACY_KEYS) {
      if (localStorage.getItem(key)) {
        issues.push(`Legacy key '${key}' still exists after migration`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

// Convenience functions
export const migrateNetworkData = (): MigrationResult => {
  return NetworkMigration.getInstance().migrateLegacyData();
};

export const rollbackNetworkMigration = (): MigrationResult => {
  return NetworkMigration.getInstance().rollbackMigration();
};

export const getNetworkMigrationStatus = () => {
  return NetworkMigration.getInstance().getMigrationStatus();
};

export const validateNetworkMigration = () => {
  return NetworkMigration.getInstance().validateMigration();
};