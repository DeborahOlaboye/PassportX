import { Account, AccountValidation, AccountFilter } from '@/types/multi-account';

export function validateAccount(account: Account): AccountValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate address
  if (!account.address || typeof account.address !== 'string') {
    errors.push('Address is required and must be a string');
  } else {
    // Stacks address format: starts with SP or SM, followed by 39 alphanumeric characters
    const stacksAddressRegex = /^(SP|SM)[A-Z0-9]{39}$/;
    if (!stacksAddressRegex.test(account.address)) {
      errors.push('Invalid Stacks wallet address format');
    }
  }

  // Validate chain ID
  if (typeof account.chainId !== 'number' || account.chainId < 0) {
    errors.push('Chain ID must be a non-negative number');
  }

  // Validate active status
  if (typeof account.isActive !== 'boolean') {
    errors.push('Active status must be a boolean');
  }

  // Validate optional fields
  if (account.name && typeof account.name !== 'string') {
    warnings.push('Account name should be a string');
  }

  if (account.balance) {
    if (typeof account.balance !== 'string' || isNaN(parseFloat(account.balance))) {
      warnings.push('Balance should be a valid numeric string');
    }
  }

  if (account.lastUsed && typeof account.lastUsed !== 'number') {
    warnings.push('Last used timestamp should be a number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateAccounts(accounts: Account[]): { valid: boolean; errors: Map<string, string[]> } {
  const errors = new Map<string, string[]>();

  for (const account of accounts) {
    const validation = validateAccount(account);
    if (!validation.isValid) {
      errors.set(account.address, validation.errors);
    }
  }

  return {
    valid: errors.size === 0,
    errors,
  };
}

export function isDuplicateAccount(accounts: Account[], newAccount: Account): boolean {
  return accounts.some((a) => a.address === newAccount.address);
}

export function canSwitchAccount(
  currentAccount: Account | null,
  targetAccount: Account
): { canSwitch: boolean; reason?: string } {
  if (!currentAccount) {
    return { canSwitch: true };
  }

  if (currentAccount.address === targetAccount.address) {
    return { canSwitch: false, reason: 'Already on this account' };
  }

  if (!targetAccount.isActive) {
    return { canSwitch: false, reason: 'Target account is not active' };
  }

  return { canSwitch: true };
}

export function shouldIsolateAccountData(
  previousAccount: Account | null,
  newAccount: Account
): boolean {
  if (!previousAccount) return false;

  // Isolate data if switching between accounts
  return previousAccount.address !== newAccount.address;
}

export function getAccountIsolationId(account: Account): string {
  // Create unique isolation ID for data compartmentalization
  return `account_${account.address}_chain_${account.chainId}`;
}

export function filterAccountsByChain(accounts: Account[], chainId: number): Account[] {
  return accounts.filter((a) => a.chainId === chainId);
}

export function getCompatibleAccounts(
  accounts: Account[],
  filter?: AccountFilter
): Account[] {
  let filtered = accounts.filter((a) => a.isActive);

  if (filter?.chainId !== undefined) {
    filtered = filterAccountsByChain(filtered, filter.chainId);
  }

  if (filter?.searchTerm) {
    const term = filter.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.address.toLowerCase().includes(term) ||
        a.name?.toLowerCase().includes(term) ||
        a.metadata?.displayName?.toLowerCase().includes(term)
    );
  }

  return filtered;
}

export function mergeAccountChanges(
  existingAccounts: Account[],
  newAccounts: Account[]
): Account[] {
  const merged = new Map<string, Account>();

  // Keep existing accounts
  existingAccounts.forEach((a) => merged.set(a.address, a));

  // Add/update new accounts
  newAccounts.forEach((a) => {
    const existing = merged.get(a.address);
    merged.set(a.address, {
      ...existing,
      ...a,
      lastUsed: existing?.lastUsed || a.lastUsed,
    });
  });

  return Array.from(merged.values());
}

export function sortAccounts(
  accounts: Account[],
  sortBy: 'recent' | 'alphabetical' | 'balance' = 'recent'
): Account[] {
  const sorted = [...accounts];

  switch (sortBy) {
    case 'alphabetical':
      return sorted.sort((a, b) => (a.name || a.address).localeCompare(b.name || b.address));

    case 'balance':
      return sorted.sort((a, b) => {
        const balA = parseFloat(a.balance || '0');
        const balB = parseFloat(b.balance || '0');
        return balB - balA;
      });

    case 'recent':
    default:
      return sorted.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
  }
}
