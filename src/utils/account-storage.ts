import { Account, AccountPreferences, AccountSettings } from '@/types/multi-account';

const STORAGE_KEYS = {
  ACCOUNTS: 'wallet_accounts',
  ACTIVE_ACCOUNT: 'active_account',
  PREFERENCES: 'account_preferences',
  ACCOUNT_SETTINGS: 'account_settings_',
};

export async function saveAccounts(accounts: Account[]): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const data = JSON.stringify(accounts);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, data);
  } catch (error) {
    console.error('Failed to save accounts:', error);
    throw new Error('Failed to persist accounts to storage');
  }
}

export async function loadAccounts(): Promise<Account[]> {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load accounts:', error);
    return [];
  }
}

export async function saveActiveAccount(address: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, address);
  } catch (error) {
    console.error('Failed to save active account:', error);
  }
}

export async function loadActiveAccount(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
  } catch (error) {
    console.error('Failed to load active account:', error);
    return null;
  }
}

export async function savePreferences(preferences: AccountPreferences): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const data = JSON.stringify(preferences);
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, data);
  } catch (error) {
    console.error('Failed to save preferences:', error);
    throw new Error('Failed to persist preferences to storage');
  }
}

export async function loadPreferences(): Promise<AccountPreferences | null> {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return null;
  }
}

export async function saveAccountSettings(
  address: string,
  settings: AccountSettings
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const key = `${STORAGE_KEYS.ACCOUNT_SETTINGS}${address}`;
    const data = JSON.stringify(settings);
    localStorage.setItem(key, data);
  } catch (error) {
    console.error('Failed to save account settings:', error);
    throw new Error('Failed to persist account settings');
  }
}

export async function loadAccountSettings(address: string): Promise<AccountSettings | null> {
  if (typeof window === 'undefined') return null;

  try {
    const key = `${STORAGE_KEYS.ACCOUNT_SETTINGS}${address}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load account settings:', error);
    return null;
  }
}

export async function clearAccountData(address: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const key = `${STORAGE_KEYS.ACCOUNT_SETTINGS}${address}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear account data:', error);
  }
}

export async function clearAllAccountData(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);

    // Clear all account settings
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEYS.ACCOUNT_SETTINGS)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Failed to clear all account data:', error);
    throw new Error('Failed to clear account data');
  }
}

export function validateAccountAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;

  // Stacks address validation (starts with SP or SM and is 41 characters)
  const stacksAddressRegex = /^(SP|SM)[A-Z0-9]{39}$/;
  return stacksAddressRegex.test(address);
}

export function validateAccountData(account: Account): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateAccountAddress(account.address)) {
    errors.push('Invalid wallet address format');
  }

  if (!account.chainId || account.chainId < 0) {
    errors.push('Invalid chain ID');
  }

  if (account.isActive === undefined) {
    errors.push('Account must have an active status');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function exportAccountData(accounts: Account[]): Promise<string> {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    accounts: accounts.map((a) => ({
      address: a.address,
      name: a.name,
      chainId: a.chainId,
      metadata: a.metadata,
    })),
  };

  return JSON.stringify(data, null, 2);
}

export async function downloadAccountExport(accounts: Account[], filename?: string): Promise<void> {
  const data = await exportAccountData(accounts);
  const element = document.createElement('a');
  element.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(data)}`);
  element.setAttribute('download', filename || `accounts-${Date.now()}.json`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
