import { Account, AccountPreferences } from '@/types/multi-account';
import { ACCOUNT_VALIDATION_RULES } from '@/constants/multi-account';

export function formatAccountAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function getAccountDisplayName(account: Account): string {
  return (
    account.metadata?.displayName ||
    account.name ||
    formatAccountAddress(account.address)
  );
}

export function getAccountInitials(account: Account): string {
  const displayName = getAccountDisplayName(account);
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function isValidStacksAddress(address: string): boolean {
  return ACCOUNT_VALIDATION_RULES.ADDRESS_PATTERN.test(address);
}

export function isValidAccountName(name: string): boolean {
  return (
    typeof name === 'string' &&
    name.length >= ACCOUNT_VALIDATION_RULES.NAME_MIN_LENGTH &&
    name.length <= ACCOUNT_VALIDATION_RULES.NAME_MAX_LENGTH
  );
}

export function isValidColor(color: string): boolean {
  return ACCOUNT_VALIDATION_RULES.COLOR_PATTERN.test(color);
}

export function compareAccounts(a: Account, b: Account): number {
  // Primary: active status
  if (a.isActive !== b.isActive) {
    return a.isActive ? -1 : 1;
  }

  // Secondary: last used
  const lastUsedA = a.lastUsed || 0;
  const lastUsedB = b.lastUsed || 0;
  if (lastUsedA !== lastUsedB) {
    return lastUsedB - lastUsedA;
  }

  // Tertiary: name/address
  const nameA = getAccountDisplayName(a);
  const nameB = getAccountDisplayName(b);
  return nameA.localeCompare(nameB);
}

export function groupAccountsByChain(accounts: Account[]): Map<number, Account[]> {
  const grouped = new Map<number, Account[]>();

  for (const account of accounts) {
    if (!grouped.has(account.chainId)) {
      grouped.set(account.chainId, []);
    }
    grouped.get(account.chainId)!.push(account);
  }

  return grouped;
}

export function getAccountsWithoutActive(
  accounts: Account[],
  activeAddress?: string
): Account[] {
  return accounts.filter((a) => a.address !== activeAddress);
}

export function getRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // emerald
    '#F59E0B', // amber
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#14B8A6', // teal
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function shouldRefreshAccounts(lastRefresh?: number, intervalMs: number = 60000): boolean {
  if (!lastRefresh) return true;
  return Date.now() - lastRefresh > intervalMs;
}

export function calculateAccountScore(account: Account): number {
  let score = 0;

  // Active account gets higher score
  if (account.isActive) score += 100;

  // Recently used accounts get higher score
  if (account.lastUsed) {
    const daysSinceUse = (Date.now() - account.lastUsed) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 50 - daysSinceUse * 5);
  }

  // Account with balance gets higher score
  if (account.balance) {
    const balance = parseFloat(account.balance);
    if (balance > 0) {
      score += Math.min(25, balance / 100);
    }
  }

  return Math.round(score);
}

export function getPrioritizedAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) => calculateAccountScore(b) - calculateAccountScore(a));
}

export function filterAccountsByActive(accounts: Account[]): Account[] {
  return accounts.filter((a) => a.isActive);
}

export function createAccountSnapshot(account: Account): Account {
  return JSON.parse(JSON.stringify(account));
}

export function mergeAccountData(
  existing: Account,
  updates: Partial<Account>
): Account {
  return {
    ...existing,
    ...updates,
    // Preserve critical fields
    address: existing.address,
    chainId: existing.chainId,
    isActive: updates.isActive !== undefined ? updates.isActive : existing.isActive,
  };
}

export function getAccountChangesSummary(
  oldAccount: Account,
  newAccount: Account
): string[] {
  const changes: string[] = [];

  if (oldAccount.name !== newAccount.name) {
    changes.push(`Name changed from "${oldAccount.name}" to "${newAccount.name}"`);
  }

  if (oldAccount.balance !== newAccount.balance) {
    changes.push(`Balance changed from ${oldAccount.balance} to ${newAccount.balance}`);
  }

  if (oldAccount.isActive !== newAccount.isActive) {
    changes.push(`Active status changed to ${newAccount.isActive}`);
  }

  return changes;
}

export function shouldNotifyAccountChange(
  oldAccount: Account | null,
  newAccount: Account
): boolean {
  if (!oldAccount) return true;
  if (oldAccount.address !== newAccount.address) return true;
  if (oldAccount.isActive !== newAccount.isActive) return true;
  return false;
}

export function logAccountActivity(
  action: string,
  account: Account,
  details?: Record<string, any>
): void {
  if (process.env.NODE_ENV !== 'development') return;

  console.log(`[Account Activity] ${action}`, {
    address: formatAccountAddress(account.address),
    name: getAccountDisplayName(account),
    timestamp: new Date().toISOString(),
    ...details,
  });
}

export function sanitizeAccountData(account: Account): Account {
  // Create a safe copy without sensitive data
  return {
    address: account.address,
    name: account.name,
    chainId: account.chainId,
    balance: account.balance,
    isActive: account.isActive,
    lastUsed: account.lastUsed,
    metadata: account.metadata ? { displayName: account.metadata.displayName } : undefined,
  };
}
