# WalletConnect Provider Setup Guide

Complete guide for setting up and configuring the WalletConnect provider in PassportX.

## Prerequisites

- Node.js 16+
- npm or yarn
- WalletConnect Project ID (from [WalletConnect Dashboard](https://dashboard.walletconnect.com))

## Installation

First, ensure all WalletConnect dependencies are installed:

```bash
npm install @reown/walletkit @walletconnect/utils @walletconnect/core
```

## Environment Configuration

Add these environment variables to your `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_WALLETCONNECT_RELAY_URL=wss://relay.walletconnect.org
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Steps

### 1. Configure Metadata

Metadata in `src/config/metadata.ts` is automatically configured with:
- Application name: "PassportX"
- Description: "Achievement Passport - Verify and manage your digital credentials on Stacks Blockchain"
- Icons: Pulled from `/public/logo*.png`

No additional configuration needed unless you want to customize metadata.

### 2. Configure Chains

Supported chains are defined in `src/config/chains.ts`:
- **Mainnet**: Stacks Mainnet (chainId: 1)
- **Testnet**: Stacks Testnet (chainId: 5050)
- **Devnet**: Stacks Devnet (chainId: 5051) - Development only

To modify chain configuration:

```typescript
import { STACKS_MAINNET } from '@/config/chains';

// Customize if needed
const customMainnet = {
  ...STACKS_MAINNET,
  rpcUrl: 'https://custom-rpc.example.com',
};
```

### 3. Configure Relay Server

Relay configuration in `src/config/relay.ts`:

```typescript
export const RELAY_CONFIG = {
  url: 'wss://relay.walletconnect.org',
  protocol: 'irn',
};
```

Override with environment variable:
```env
NEXT_PUBLIC_WALLETCONNECT_RELAY_URL=wss://custom-relay.example.com
```

### 4. Wrap Application with Provider

In your root layout (`src/app/layout.tsx`):

```tsx
import { EnhancedWalletProvider } from '@/components/wallet'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <EnhancedWalletProvider
          debug={process.env.NODE_ENV === 'development'}
          onInitialized={() => console.log('WalletConnect initialized')}
          onInitError={(error) => console.error('Init error:', error)}
        >
          {children}
        </EnhancedWalletProvider>
      </body>
    </html>
  )
}
```

## Configuration Validation

The provider automatically validates configuration on initialization:

```typescript
import { buildWalletConnectConfig, validateConfig } from '@/config/walletconnect'

const config = buildWalletConnectConfig()
const validation = validateConfig(config)

if (!validation.valid) {
  console.error('Configuration errors:', validation.errors)
}
```

## Accessing Configuration

Use the `useWalletConnectConfig` hook:

```tsx
import { useWalletConnectConfig } from '@/hooks/useWalletConnectConfig'

export function MyComponent() {
  const {
    config,
    isReady,
    getSupportedChains,
    getChainConfig,
    getRpcUrl,
    getExplorerUrl,
  } = useWalletConnectConfig()

  if (!isReady) return <p>Loading...</p>

  const chains = getSupportedChains()
  const mainnet = getChainConfig(1)
  const rpcUrl = getRpcUrl(1)

  return (
    <>
      <p>Supported chains: {chains.length}</p>
      <p>Mainnet RPC: {rpcUrl}</p>
    </>
  )
}
```

## Configuration Objects

### WalletConnectProviderConfig

```typescript
interface WalletConnectProviderConfig {
  projectId: string                    // WalletConnect Project ID
  relayUrl: string                     // Relay server URL
  metadata: MetadataConfig             // App metadata
  chains: ChainConfig[]                // Supported chains
  methods: string[]                    // Supported JSON-RPC methods
  events: string[]                     // Supported events
  rpcMap?: Record<number, string>      // Chain ID to RPC URL mapping
  explorerUrl?: string                 // Block explorer URL
}
```

### ChainConfig

```typescript
interface ChainConfig {
  id: number                           // Chain ID
  name: string                         // Display name
  namespace: string                    // CAIP-2 namespace
  rpcUrl: string                       // RPC endpoint
  explorerUrl: string                  // Block explorer
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  blockExplorerUrls: string[]
  enabled: boolean
}
```

## Supported Methods

```typescript
const STACKS_METHODS = [
  'stacks_call',
  'stacks_signMessage',
  'stacks_signTransaction',
  'stacks_sendTransaction',
];
```

## Supported Events

```typescript
const STACKS_EVENTS = [
  'stacks_chainChanged',
  'stacks_accountsChanged',
  'stacks_connect',
  'stacks_disconnect',
];
```

## Troubleshooting

### Configuration not initializing
1. Check `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
2. Verify relay URL is accessible
3. Check browser console for validation errors
4. Use `printConfigDebug()` to inspect config

### Chains not showing
1. Verify chains are enabled in `src/config/chains.ts`
2. Check `STACKS_MAINNET`, `STACKS_TESTNET` have `enabled: true`
3. Confirm `SUPPORTED_CHAINS` includes desired chains

### RPC errors
1. Verify RPC URLs in chain config are accessible
2. Check network connectivity
3. Review relay server status

## Development Mode

Enable debug logging in development:

```tsx
<EnhancedWalletProvider debug={true}>
  {children}
</EnhancedWalletProvider>
```

This logs configuration details to console on initialization.

## Advanced Configuration

### Custom Chain

```typescript
import { ChainConfig } from '@/types/walletconnect-config'

const customChain: ChainConfig = {
  id: 9999,
  name: 'Custom Chain',
  namespace: 'stacks:9999',
  rpcUrl: 'https://custom.example.com',
  explorerUrl: 'https://explorer.example.com',
  nativeCurrency: {
    name: 'Token',
    symbol: 'TOK',
    decimals: 6,
  },
  blockExplorerUrls: ['https://explorer.example.com'],
  enabled: true,
}
```

### Custom Relay Server

```env
NEXT_PUBLIC_WALLETCONNECT_RELAY_URL=wss://custom-relay.example.com
```

## Testing

Mock the provider in tests:

```typescript
jest.mock('@/hooks/useWalletConnectConfig', () => ({
  useWalletConnectConfig: () => ({
    config: mockConfig,
    isReady: true,
    getSupportedChains: () => mockChains,
    getChainConfig: (id) => mockChains.find(c => c.id === id),
  }),
}))
```

## Next Steps

- [Wallet Connection Flow](./WALLETCONNECT_INTEGRATION.md)
- [Transaction Signing](./WALLETCONNECT_TRANSACTIONS.md)
- [Error Handling](./WALLETCONNECT_ERROR_HANDLING.md)
