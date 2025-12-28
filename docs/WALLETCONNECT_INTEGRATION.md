# WalletConnect Integration Guide

This document outlines the WalletConnect integration for PassportX, enabling secure wallet connections and transaction signing.

## Overview

WalletConnect provides a bridge between the PassportX application and user wallets, allowing users to securely connect their Stacks wallets and perform transactions without exposing private keys.

## Architecture

### Components

1. **WalletConnectProvider** - Context provider for managing wallet connection state
2. **ConnectButton** - UI button to initiate wallet connection
3. **WalletSelector** - Modal for selecting wallet type
4. **QRCodeDisplay** - QR code for mobile wallet connections
5. **AccountDisplay** - Shows connected account information
6. **ConnectionStatus** - Visual connection status indicator

### Hooks

1. **useWalletConnect** - Access wallet connection state and methods
2. **useWalletSession** - Manage session persistence
3. **useWalletEvents** - Listen to wallet events

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_WALLETCONNECT_RELAY_URL=wss://relay.walletconnect.org
```

### 2. Wrap Your App

In your root layout or app component:

```tsx
import { WalletConnectProvider } from '@/contexts/WalletConnectContext'

export default function RootLayout({ children }) {
  return (
    <WalletConnectProvider>
      {children}
    </WalletConnectProvider>
  )
}
```

### 3. Add Connect Button

Use the ConnectButton component in your header:

```tsx
import { ConnectButton } from '@/components/wallet'

export function Header() {
  return (
    <header>
      <ConnectButton />
    </header>
  )
}
```

## Usage Examples

### Connect Wallet

```tsx
import { useWalletConnect } from '@/contexts/WalletConnectContext'

export function MyComponent() {
  const { connectWallet, isConnecting } = useWalletConnect()

  const handleConnect = async (wallet) => {
    await connectWallet(wallet)
  }

  return <button onClick={() => handleConnect(wallet)}>Connect</button>
}
```

### Display Connected Account

```tsx
import { useWalletConnect } from '@/contexts/WalletConnectContext'

export function AccountInfo() {
  const { connectedWallet, isConnected } = useWalletConnect()

  if (!isConnected) return <p>Not connected</p>

  return <p>Connected: {connectedWallet?.address}</p>
}
```

### Manage Session

```tsx
import { useWalletSession } from '@/hooks/useWalletSession'

export function MyComponent() {
  const { session, clearSession, isSessionExpired } = useWalletSession()

  if (isSessionExpired()) {
    return <p>Session expired. Please reconnect.</p>
  }

  return (
    <>
      <p>Session ID: {session?.sessionId}</p>
      <button onClick={clearSession}>Logout</button>
    </>
  )
}
```

### Listen to Wallet Events

```tsx
import { useWalletEvents } from '@/hooks/useWalletEvents'

export function MyComponent() {
  const { handleAccountChange, handleNetworkChange } = useWalletEvents({
    onConnected: (address) => console.log('Connected:', address),
    onDisconnected: () => console.log('Disconnected'),
    onAccountChanged: (address) => console.log('Account changed:', address),
    onNetworkChanged: (chainId) => console.log('Network changed:', chainId),
    onError: (error) => console.error('Error:', error),
  })

  return <div>...</div>
}
```

## Supported Wallets

1. **Xverse** - Popular Stacks wallet
2. **Hiro Wallet** - Official Stacks wallet
3. **Leather** - Bitcoin-native wallet

## Security Best Practices

1. **Never expose private keys** - WalletConnect handles this securely
2. **Validate addresses** - Use the `validateWalletAddress()` utility
3. **Session expiration** - Sessions expire after 24 hours
4. **Clear session on logout** - Always call `disconnectWallet()`
5. **HTTPS only** - WalletConnect requires HTTPS in production

## Error Handling

The context provides an `error` state for handling connection errors:

```tsx
const { error, clearError } = useWalletConnect()

useEffect(() => {
  if (error) {
    console.error('Connection error:', error)
  }
}, [error])
```

## Testing

Mock the WalletConnectProvider for testing:

```tsx
// In your test setup
jest.mock('@/contexts/WalletConnectContext', () => ({
  useWalletConnect: () => ({
    isConnected: true,
    connectedWallet: { address: '0x123...', name: 'Test Wallet' },
    connectWallet: jest.fn(),
    disconnectWallet: jest.fn(),
  }),
}))
```

## Troubleshooting

### Connection fails
- Check `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
- Ensure wallet is installed and accessible
- Check browser console for detailed errors

### Session not persisting
- Verify localStorage is enabled
- Check browser privacy settings
- Clear cache and try reconnecting

### QR code not generating
- Ensure `qrcode` package is installed
- Check browser console for errors
- Verify `generateQRCodeImage` function works

## References

- [WalletConnect Docs](https://docs.walletconnect.network/)
- [Stacks Blockchain](https://www.stacks.co/)
- [Xverse Wallet](https://www.xverse.app/)
