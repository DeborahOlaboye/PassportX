# Multi-Account Support - Quick Reference

Fast lookup guide for multi-account features.

## Setup (30 seconds)

```tsx
// Wrap app with provider
<MultiAccountProvider>
  <App />
</MultiAccountProvider>

// Add selector to header
<AccountSelector />
```

## Common Tasks

### Switch Account

```tsx
const { switchAccount } = useMultiAccount()
await switchAccount(address, 'user')
```

### Get Active Account

```tsx
const { state } = useMultiAccount()
const active = state.activeAccount
```

### List All Accounts

```tsx
const { state } = useMultiAccount()
const accounts = state.accounts
```

### Add Account

```tsx
const { addAccount } = useMultiAccount()
await addAccount({
  address: 'SP...',
  name: 'My Wallet',
  chainId: 5050,
  isActive: true,
})
```

### Remove Account

```tsx
const { removeAccount } = useMultiAccount()
await removeAccount(address)
```

### Update Settings

```tsx
const { updateAccountSettings } = useMultiAccount()
await updateAccountSettings(address, {
  displayName: 'New Name',
})
```

## Components

### AccountSelector (Dropdown)
```tsx
<AccountSelector maxDisplay={5} />
```

### AccountList (Detailed View)
```tsx
<AccountList sortBy="recent" showActions={true} />
```

### AccountManagementModal (Full Dialog)
```tsx
<AccountManagementModal isOpen={true} onClose={() => {}} />
```

## Hooks

### useMultiAccount
```tsx
const { state, switchAccount, addAccount, removeAccount, updateAccountSettings } = useMultiAccount()
```

### useMultiAccountDetection
```tsx
const { accounts, activeAccount, hasChanges, isLoading } = useMultiAccountDetection()
```

### useAccountPreferences
```tsx
const { preferences, setSortOrder, setDisplayName, pinAccount } = useAccountPreferences()
```

## Storage

### Save
```tsx
import { saveAccounts, savePreferences } from '@/utils/account-storage'
await saveAccounts(accounts)
await savePreferences(preferences)
```

### Load
```tsx
import { loadAccounts, loadPreferences } from '@/utils/account-storage'
const accounts = await loadAccounts()
const prefs = await loadPreferences()
```

## Validation

### Validate Single Account
```tsx
import { validateAccount } from '@/utils/account-validation'
const result = validateAccount(account)
if (!result.isValid) console.error(result.errors)
```

### Validate Multiple
```tsx
import { validateAccounts } from '@/utils/account-validation'
const result = validateAccounts(accounts)
```

## Data Isolation

```tsx
import { getAccountIsolationId } from '@/utils/account-validation'
const id = getAccountIsolationId(account)
localStorage.setItem(`${id}_data`, JSON.stringify(data))
```

## Utilities

### Format Address
```tsx
import { formatAccountAddress } from '@/utils/account-utils'
const short = formatAccountAddress('SP...') // 'SP....ZYXW'
```

### Get Display Name
```tsx
import { getAccountDisplayName } from '@/utils/account-utils'
const name = getAccountDisplayName(account)
```

### Check Active Status
```tsx
import { filterAccountsByActive } from '@/utils/account-utils'
const active = filterAccountsByActive(accounts)
```

### Get Account Initials
```tsx
import { getAccountInitials } from '@/utils/account-utils'
const initials = getAccountInitials(account) // 'MW'
```

## Constants

```tsx
import { ACCOUNT_SORT_OPTIONS, ACCOUNT_ACTIONS } from '@/constants/multi-account'

// Sort options
ACCOUNT_SORT_OPTIONS.RECENT // 'recent'
ACCOUNT_SORT_OPTIONS.ALPHABETICAL // 'alphabetical'
ACCOUNT_SORT_OPTIONS.BALANCE // 'balance'

// Actions
ACCOUNT_ACTIONS.ADD // 'add'
ACCOUNT_ACTIONS.SWITCH // 'switch'
ACCOUNT_ACTIONS.REMOVE // 'remove'
ACCOUNT_ACTIONS.RENAME // 'rename'
```

## Error Handling

```tsx
const { state } = useMultiAccount()
if (state.error) {
  console.error('Account error:', state.error)
}
```

## Type Definitions

```tsx
// Account
interface Account {
  address: string
  name?: string
  chainId: number
  balance?: string
  isActive: boolean
  lastUsed?: number
  metadata?: { displayName?: string }
}

// Preferences
interface AccountPreferences {
  selectedAccount: string
  accounts: Record<string, AccountSettings>
  hideBalances: boolean
  sortOrder: 'recent' | 'alphabetical' | 'balance'
}
```

## Event Handling

```tsx
<MultiAccountProvider
  onAccountSwitch={(event) => {
    console.log(`Switched from ${event.from.address} to ${event.to.address}`)
  }}
>
  {children}
</MultiAccountProvider>
```

## Patterns

### Listen for Account Changes
```tsx
useEffect(() => {
  if (state.activeAccount) {
    // Account changed, do something
  }
}, [state.activeAccount])
```

### Auto-save on Switch
```tsx
const handleSwitch = async (address: string) => {
  await switchAccount(address, 'user')
  await savePreferences(state.preferences)
}
```

### Persist Account Data
```tsx
const isolationId = getAccountIsolationId(account)
localStorage.setItem(`${isolationId}_data`, JSON.stringify(data))
```

## Performance

- **Debounce**: 500ms for account detection
- **Session timeout**: 30 minutes
- **Max accounts**: 100

## Limits

- Name: 50 characters max
- Dropdown display: 5 accounts default
- Modal display: 20 accounts

## Files Reference

| File | Purpose |
|------|---------|
| `MultiAccountContext.tsx` | State management |
| `useMultiAccountDetection.ts` | Account change detection |
| `useAccountPreferences.ts` | Preference management |
| `AccountSelector.tsx` | Dropdown selector |
| `AccountList.tsx` | Account list view |
| `AccountManagementModal.tsx` | Management dialog |
| `account-storage.ts` | Persistence utilities |
| `account-validation.ts` | Validation & isolation |
| `account-utils.ts` | Helper functions |
| `multi-account.ts` | Constants |

## Documentation Links

- [Full Guide](./MULTI_ACCOUNT_SUPPORT.md)
- [Code Examples](./MULTI_ACCOUNT_EXAMPLES.md)
- [Type Definitions](../src/types/multi-account.ts)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Accounts not loading | Check `loadAccounts()` in storage |
| UI not updating | Verify component uses `useMultiAccount` |
| Data leaking | Use `getAccountIsolationId()` for keys |
| Preference loss | Call `savePreferences()` after updates |

## Best Practices

1. ✅ Always validate accounts before use
2. ✅ Use isolation IDs for account-specific data
3. ✅ Save preferences after updates
4. ✅ Listen to account change events
5. ✅ Clear data when removing accounts
6. ✅ Handle errors gracefully

---

**Last Updated**: 2025-12-23
**Version**: 1.0
**Status**: ✅ Complete & Ready for Production
