# Multi-Account Support - Code Examples

Practical examples for implementing multi-account support.

## Basic Setup

### Initialize Provider

```tsx
// src/app/layout.tsx
import { MultiAccountProvider } from '@/contexts/MultiAccountContext'

export default function RootLayout({ children }) {
  const handleAccountSwitch = (event) => {
    console.log(`Switched from ${event.from.address} to ${event.to.address}`)
    // Perform any necessary cleanup or state updates
  }

  return (
    <html>
      <body>
        <MultiAccountProvider onAccountSwitch={handleAccountSwitch}>
          {children}
        </MultiAccountProvider>
      </body>
    </html>
  )
}
```

## Component Examples

### 1. Simple Account Switcher

```tsx
import { useMultiAccount } from '@/contexts/MultiAccountContext'

export function SimpleAccountSwitcher() {
  const { state, switchAccount } = useMultiAccount()

  if (state.accounts.length === 0) {
    return <p>No accounts connected</p>
  }

  return (
    <select
      value={state.activeAccount?.address || ''}
      onChange={(e) => switchAccount(e.target.value, 'user')}
      className="px-3 py-2 border rounded"
    >
      {state.accounts.map((account) => (
        <option key={account.address} value={account.address}>
          {account.name || account.address.slice(0, 10)}
        </option>
      ))}
    </select>
  )
}
```

### 2. Account Status Display

```tsx
import { useMultiAccount } from '@/contexts/MultiAccountContext'

export function AccountStatus() {
  const { state } = useMultiAccount()

  return (
    <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
      <div>
        <p className="text-sm text-gray-600">Active Account</p>
        <p className="text-lg font-semibold">{state.activeAccount?.name}</p>
        <p className="text-xs text-gray-500">
          {state.activeAccount?.address.slice(0, 10)}...
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm text-gray-600">Connected Accounts</p>
        <p className="text-2xl font-bold text-blue-600">{state.accounts.length}</p>
      </div>
    </div>
  )
}
```

### 3. Account List with Actions

```tsx
import { useMultiAccount } from '@/contexts/MultiAccountContext'
import { Copy, Trash2 } from 'lucide-react'

export function AccountListWithActions() {
  const { state, switchAccount, removeAccount } = useMultiAccount()

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
  }

  return (
    <div className="space-y-2">
      {state.accounts.map((account) => (
        <div
          key={account.address}
          className={`flex items-center justify-between p-3 rounded-lg border ${
            state.activeAccount?.address === account.address
              ? 'bg-blue-50 border-blue-200'
              : 'bg-white border-gray-200'
          }`}
        >
          <div
            className="flex-1 cursor-pointer"
            onClick={() => switchAccount(account.address, 'user')}
          >
            <p className="font-semibold">{account.name}</p>
            <p className="text-xs text-gray-500">{account.address}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopyAddress(account.address)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeAccount(account.address)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## Hook Examples

### 1. Auto-Switch to New Account

```tsx
import { useMultiAccountDetection } from '@/hooks/useMultiAccountDetection'

export function AutoSwitchComponent() {
  const { accounts, activeAccount, isLoading } = useMultiAccountDetection({
    autoSwitch: true,
    onDetected: (newAccounts) => {
      console.log('New accounts detected:', newAccounts)
    },
    onChanged: (account) => {
      console.log('Switched to:', account.address)
    },
  })

  if (isLoading) return <p>Loading accounts...</p>

  return (
    <div>
      <p>Detected {accounts.length} accounts</p>
      <p>Active: {activeAccount?.address}</p>
    </div>
  )
}
```

### 2. Account Preferences Management

```tsx
import { useAccountPreferences } from '@/hooks/useAccountPreferences'

export function AccountPreferencesManager() {
  const {
    preferences,
    setSortOrder,
    setHideBalances,
    setDisplayName,
    pinAccount,
  } = useAccountPreferences()

  const handleSetDisplayName = async (address: string, name: string) => {
    await setDisplayName(address, name)
    alert(`Account renamed to ${name}`)
  }

  return (
    <div className="space-y-4">
      <div>
        <label>Sort Order</label>
        <select
          defaultValue={preferences.sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="recent">Recent Activity</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="balance">Balance</option>
        </select>
      </div>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          defaultChecked={preferences.hideBalances}
          onChange={(e) => setHideBalances(e.target.checked)}
        />
        <span>Hide balance amounts</span>
      </label>
    </div>
  )
}
```

## Data Isolation Example

### Protect Account-Specific Data

```tsx
import { getAccountIsolationId } from '@/utils/account-validation'
import { useMultiAccount } from '@/contexts/MultiAccountContext'

export function AccountDataManager() {
  const { state } = useMultiAccount()

  const saveAccountData = async (data: any) => {
    if (!state.activeAccount) return

    // Get unique ID for this account
    const isolationId = getAccountIsolationId(state.activeAccount)

    // Store data with account-specific key
    localStorage.setItem(`${isolationId}_data`, JSON.stringify(data))

    console.log(`Data saved for account ${isolationId}`)
  }

  const loadAccountData = async () => {
    if (!state.activeAccount) return null

    const isolationId = getAccountIsolationId(state.activeAccount)
    const stored = localStorage.getItem(`${isolationId}_data`)

    return stored ? JSON.parse(stored) : null
  }

  return (
    <div>
      <button
        onClick={() => saveAccountData({ message: 'Hello' })}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save Data
      </button>
      <button
        onClick={async () => {
          const data = await loadAccountData()
          console.log('Loaded data:', data)
        }}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Load Data
      </button>
    </div>
  )
}
```

## Validation Example

### Validate Account Before Use

```tsx
import { validateAccount } from '@/utils/account-validation'
import { useMultiAccount } from '@/contexts/MultiAccountContext'

export function ValidateAccountComponent() {
  const { state, switchAccount } = useMultiAccount()

  const handleSwitchWithValidation = async (address: string) => {
    const targetAccount = state.accounts.find((a) => a.address === address)

    if (!targetAccount) {
      alert('Account not found')
      return
    }

    // Validate account
    const validation = validateAccount(targetAccount)

    if (!validation.isValid) {
      alert(`Validation errors: ${validation.errors.join(', ')}`)
      return
    }

    if (validation.warnings.length > 0) {
      console.warn('Validation warnings:', validation.warnings)
    }

    // Safe to switch
    await switchAccount(address, 'user')
  }

  return (
    <div>
      {state.accounts.map((account) => (
        <button
          key={account.address}
          onClick={() => handleSwitchWithValidation(account.address)}
          className="block px-4 py-2 my-2 bg-blue-600 text-white rounded"
        >
          Switch to {account.name}
        </button>
      ))}
    </div>
  )
}
```

## Storage Example

### Persist and Restore Accounts

```tsx
import {
  saveAccounts,
  loadAccounts,
  savePreferences,
  loadPreferences,
} from '@/utils/account-storage'
import { useEffect, useState } from 'react'

export function PersistenceExample() {
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    // Load accounts on mount
    const loadSavedAccounts = async () => {
      const saved = await loadAccounts()
      setAccounts(saved)
    }

    loadSavedAccounts()
  }, [])

  const handleAddAccount = async (newAccount) => {
    const updated = [...accounts, newAccount]
    setAccounts(updated)

    // Persist to storage
    await saveAccounts(updated)
  }

  const handleSavePreferences = async (prefs) => {
    // Persist preferences
    await savePreferences(prefs)
  }

  return (
    <div>
      <p>Saved accounts: {accounts.length}</p>
      <button
        onClick={() => handleAddAccount({ address: 'SP...' })}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Add Account
      </button>
    </div>
  )
}
```

## Advanced: Account Switching with Side Effects

```tsx
import { useMultiAccount } from '@/contexts/MultiAccountContext'
import { useEffect } from 'react'

export function AdvancedAccountSwitcher() {
  const { state } = useMultiAccount()

  // React to account changes
  useEffect(() => {
    if (!state.activeAccount) return

    // Clear user-specific data
    console.log('Clearing old account data...')

    // Fetch new account data
    console.log(`Loading data for ${state.activeAccount.address}...`)

    // Update UI
    console.log('Account switched successfully')

    // Cleanup
    return () => {
      console.log('Cleaning up...')
    }
  }, [state.activeAccount])

  return (
    <div>
      <p>Current: {state.activeAccount?.address}</p>
    </div>
  )
}
```

## Complete Feature Example

```tsx
'use client'

import { useState } from 'react'
import { useMultiAccount } from '@/contexts/MultiAccountContext'
import { AccountManagementModal, AccountSelector } from '@/components/wallet'

export function CompleteMultiAccountFeature() {
  const { state, switchAccount } = useMultiAccount()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="font-semibold">{state.activeAccount?.name}</p>
        <p className="text-sm text-gray-600">{state.activeAccount?.address}</p>
      </div>

      {/* Selector */}
      <AccountSelector maxDisplay={3} />

      {/* Management Button */}
      {state.accounts.length > 1 && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Manage Accounts ({state.accounts.length})
        </button>
      )}

      {/* Modal */}
      <AccountManagementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      {/* Error Handling */}
      {state.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      {/* Loading */}
      {state.isLoading && (
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p>Loading accounts...</p>
        </div>
      )}
    </div>
  )
}
```

These examples demonstrate the full range of multi-account functionality available in PassportX.
