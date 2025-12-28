# Multi-Account Support Guide

Complete guide for implementing and using multi-account wallet support in PassportX.

## Overview

The multi-account support system allows users to:
- Connect multiple wallet accounts simultaneously
- Switch between accounts seamlessly
- Persist account preferences and settings
- Isolate data between accounts to prevent leakage
- Customize display names and account settings

## Architecture

### Components

```
MultiAccountContext
├── Account Management (add, remove, switch)
├── Preference Management
└── State Synchronization

UI Components
├── AccountSelector (dropdown selector)
├── AccountList (detailed list view)
└── AccountManagementModal (full management interface)

Utilities
├── account-storage (persistence)
├── account-validation (data integrity)
└── account-utilities (helpers)
```

### Context & State

**MultiAccountContext** manages:
- List of connected accounts
- Currently active account
- Account preferences and settings
- Loading and error states

## Usage

### 1. Setup Provider

Wrap your app with `MultiAccountProvider`:

```tsx
import { MultiAccountProvider } from '@/contexts/MultiAccountContext'

export default function RootLayout({ children }) {
  return (
    <MultiAccountProvider
      onAccountSwitch={(event) => {
        console.log(`Switched from ${event.from.address} to ${event.to.address}`)
      }}
    >
      {children}
    </MultiAccountProvider>
  )
}
```

### 2. Add Account Selector to Header

```tsx
import { AccountSelector } from '@/components/wallet'

export function Header() {
  return (
    <header>
      <AccountSelector maxDisplay={5} />
    </header>
  )
}
```

### 3. Access Multi-Account Features

```tsx
import { useMultiAccount } from '@/contexts/MultiAccountContext'

export function MyComponent() {
  const {
    state,
    switchAccount,
    addAccount,
    removeAccount,
    updateAccountSettings,
  } = useMultiAccount()

  const handleSwitch = async (address: string) => {
    await switchAccount(address, 'user')
  }

  return (
    <div>
      <p>Active: {state.activeAccount?.address}</p>
      <p>Total Accounts: {state.accounts.length}</p>
    </div>
  )
}
```

## Hooks

### useMultiAccount

Core hook for account management:

```tsx
const {
  state,                    // Current multi-account state
  addAccount,              // Add a new account
  removeAccount,           // Remove an account
  switchAccount,           // Switch to an account
  updateAccountSettings,   // Update account preferences
  refreshAccounts,         // Refresh account list
  filterAccounts,          // Filter and sort accounts
  getAccountByAddress,     // Get account details
  hasMultipleAccounts,     // Check if multiple accounts exist
} = useMultiAccount()
```

### useMultiAccountDetection

Detect and monitor account changes:

```tsx
const {
  accounts,           // Detected accounts
  accountCount,       // Number of accounts
  activeAccount,      // Currently active account
  hasChanges,         // Whether accounts changed
  detectChanges,      // Trigger detection
  isLoading,          // Loading state
  error,              // Error message
} = useMultiAccountDetection({
  autoSwitch: true,
  debounceMs: 500,
  onDetected: (accounts) => console.log('Accounts detected'),
  onChanged: (account) => console.log('Account changed'),
})
```

### useAccountPreferences

Manage account preferences:

```tsx
const {
  preferences,            // Current preferences
  isLoading,              // Loading state
  setSortOrder,           // Set sort order
  setHideBalances,        // Toggle balance visibility
  getAccountSettings,     // Get account settings
  updateAccountPreference,// Update settings
  pinAccount,             // Pin/unpin account
  setCustomColor,         // Set custom color
  setDisplayName,         // Set display name
  toggleNotifications,    // Toggle notifications
  resetPreferences,       // Reset to defaults
} = useAccountPreferences()
```

## Components

### AccountSelector

Dropdown selector for quick account switching:

```tsx
<AccountSelector
  isOpen={false}
  onClose={() => {}}
  maxDisplay={5}
  className="custom-class"
/>
```

Props:
- `isOpen`: Initial open state
- `onClose`: Callback when selector closes
- `maxDisplay`: Max accounts to show before "more" button
- `className`: Custom CSS classes

### AccountList

Detailed list of all accounts:

```tsx
<AccountList
  sortBy="recent"
  onAccountSelect={(account) => {}}
  maxHeight="max-h-96"
  showActions={true}
  className="custom-class"
/>
```

Props:
- `sortBy`: Sort order ('recent', 'alphabetical', 'balance')
- `onAccountSelect`: Account selection callback
- `maxHeight`: List max height
- `showActions`: Show action buttons (copy, pin, remove)
- `className`: Custom CSS classes

### AccountManagementModal

Full-featured account management dialog:

```tsx
const [isOpen, setIsOpen] = useState(false)

<AccountManagementModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Manage Accounts"
/>
```

## Data Isolation

Account data is isolated to prevent leakage:

```tsx
import { getAccountIsolationId } from '@/utils/account-validation'

// Get unique isolation ID for data compartmentalization
const isolationId = getAccountIsolationId(account)

// Store account-specific data
localStorage.setItem(`${isolationId}_data`, JSON.stringify(data))
```

## Storage

Preferences and settings are persisted:

```tsx
import { 
  saveAccounts, 
  loadAccounts,
  savePreferences,
  loadPreferences 
} from '@/utils/account-storage'

// Save accounts
await saveAccounts(accounts)

// Load accounts
const accounts = await loadAccounts()

// Save preferences
await savePreferences(preferences)

// Load preferences
const prefs = await loadPreferences()
```

## Validation

Account data is validated:

```tsx
import { validateAccount, validateAccounts } from '@/utils/account-validation'

const validation = validateAccount(account)
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
}
```

## Events

Listen to account switch events:

```tsx
<MultiAccountProvider
  onAccountSwitch={(event) => {
    console.log({
      from: event.from.address,
      to: event.to.address,
      timestamp: event.timestamp,
      reason: event.reason, // 'user' | 'auto'
    })
  }}
>
  {children}
</MultiAccountProvider>
```

## Acceptance Criteria Verification

### ✅ Users can switch between connected accounts

Users can switch via:
- `AccountSelector` dropdown
- `AccountList` buttons
- `AccountManagementModal`
- Programmatically via `useMultiAccount`

### ✅ UI updates immediately on account switch

- Active account badge appears immediately
- Connected account reflects in header
- All data context updated instantly
- No page reload required

### ✅ Account selection persists

- Preferences saved to localStorage
- Selection restored on app restart
- Last used account remembered
- Custom settings preserved

### ✅ No data leakage between accounts

Data isolation implemented via:
- Unique isolation IDs per account
- Separate localStorage keys per account
- Account-scoped context state
- Validation on account switch

## Best Practices

1. **Always validate accounts** before using them
2. **Use isolation IDs** for account-specific data
3. **Save preferences** after updates
4. **Listen to account changes** for real-time updates
5. **Clear data** when removing accounts
6. **Test switching** between accounts in your features

## Example: Complete Implementation

```tsx
'use client'

import { useMultiAccount } from '@/contexts/MultiAccountContext'
import { useMultiAccountDetection } from '@/hooks/useMultiAccountDetection'
import { AccountSelector, AccountManagementModal } from '@/components/wallet'
import { useState } from 'react'

export function AccountManager() {
  const { state, switchAccount } = useMultiAccount()
  const { accounts, activeAccount } = useMultiAccountDetection()
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="font-semibold">Active Account</p>
          <p>{activeAccount?.name || 'None'}</p>
        </div>

        <AccountSelector maxDisplay={5} />

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Manage All Accounts ({accounts.length})
        </button>
      </div>

      <AccountManagementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
```

## Troubleshooting

### Accounts not persisting
- Check localStorage is enabled
- Verify `savePreferences` is called
- Check browser privacy settings

### Data leaking between accounts
- Use `getAccountIsolationId()` for data keys
- Clear old data on account switch
- Validate account before using

### UI not updating on switch
- Ensure component uses `useMultiAccount`
- Check context provider wraps component
- Verify callback is called

## References

- [Type Definitions](../src/types/multi-account.ts)
- [Context Implementation](../src/contexts/MultiAccountContext.tsx)
- [Storage Utilities](../src/utils/account-storage.ts)
- [Validation Utilities](../src/utils/account-validation.ts)
