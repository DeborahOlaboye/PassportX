# Chainhook Configuration

This directory contains configuration files for integrating Hiro Chainhooks into PassportX.

## Overview

Hiro Chainhooks is a reorg-aware transaction indexing engine that enables real-time blockchain event monitoring. PassportX uses Chainhooks to:

- Monitor badge minting events
- Track badge metadata updates
- Listen for community creation events
- Detect badge revocations
- Trigger real-time notifications
- Power analytics and metrics

## Files

### `types/chainhook.ts`
TypeScript type definitions for Chainhook configuration:
- `ServerOptions` - Local event server configuration
- `ChainhookNodeOptions` - Remote Chainhook node configuration
- `ChainhookConfig` - Combined configuration
- `PredicateType` - Supported predicate types

### `server.config.ts`
Configuration for the local Chainhook event server:
- Default, development, and production configurations
- Environment-based configuration selection
- Server configuration validation

### `node.config.ts`
Configuration for connecting to Chainhook nodes:
- Development (local node)
- Testnet (Hiro hosted)
- Mainnet (Hiro hosted)
- Network-based configuration selection
- Node configuration validation

### `index.ts`
Main configuration module that combines server and node configs:
- `getChainhookConfig()` - Get complete configuration
- `validateChainhookConfig()` - Validate configuration
- `chainhookConfig` - Default configuration export

### `constants.ts`
Constants and default values:
- Default configuration values
- Supported networks and event types
- PassportX contract addresses
- Predicate names
- Error codes

### `utils.ts`
Utility functions:
- Configuration checking helpers
- Network detection and validation
- Error creation and logging
- Contract address formatting
- Environment validation

## Environment Variables

### Server Configuration

```bash
# Local event server
CHAINHOOK_SERVER_HOST=localhost
CHAINHOOK_SERVER_PORT=3010
CHAINHOOK_SERVER_EXTERNAL_URL=http://localhost:3010
CHAINHOOK_SERVER_HTTPS=false
CHAINHOOK_SERVER_SSL_CERT_PATH=
CHAINHOOK_SERVER_SSL_KEY_PATH=
```

### Node Configuration

```bash
# Chainhook node connection
CHAINHOOK_NODE_URL=http://localhost:20456
CHAINHOOK_NODE_API_KEY=
CHAINHOOK_NODE_TIMEOUT=30000
CHAINHOOK_NODE_RETRY_ENABLED=true
CHAINHOOK_NODE_MAX_RETRIES=3
CHAINHOOK_NODE_RETRY_DELAY=1000
```

### Feature Flags

```bash
# Enable/disable Chainhooks
NEXT_PUBLIC_CHAINHOOK_ENABLED=true
NEXT_PUBLIC_CHAINHOOK_DEBUG=false
```

## Usage

### Basic Setup

```typescript
import { getChainhookConfig } from '@/config/chainhook';

// Get configuration for current environment
const config = getChainhookConfig('development', 'mainnet');
```

### Custom Configuration

```typescript
import { chainhookConfig, validateChainhookConfig } from '@/config/chainhook';

// Use default configuration
const config = chainhookConfig;

// Validate before use
try {
  validateChainhookConfig(config);
  console.log('Configuration is valid');
} catch (error) {
  console.error('Invalid configuration:', error);
}
```

### Network Detection

```typescript
import { getCurrentNetwork } from '@/config/chainhook/utils';

const network = getCurrentNetwork(); // 'development' | 'testnet' | 'mainnet'
```

### Environment Validation

```typescript
import { validateChainhookEnvironment } from '@/config/chainhook/utils';

const { valid, errors } = validateChainhookEnvironment();
if (!valid) {
  console.error('Environment validation failed:', errors);
}
```

## Configuration for Different Environments

### Development (Local)

```typescript
import { developmentServerConfig, developmentNodeConfig } from '@/config/chainhook';

const config = {
  server: developmentServerConfig,
  node: developmentNodeConfig,
  debug: true,
  environment: 'development',
};
```

### Production (Mainnet)

```typescript
import { productionServerConfig, mainnetNodeConfig } from '@/config/chainhook';

const config = {
  server: productionServerConfig,
  node: mainnetNodeConfig,
  debug: false,
  environment: 'production',
};
```

## Contract Addresses

PassportX mainnet contracts are defined in `constants.ts`:

```typescript
import { PASSPORTX_CONTRACTS } from '@/config/chainhook/constants';

const nftContract = PASSPORTX_CONTRACTS.MAINNET.PASSPORT_NFT;
// SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft
```

## Error Handling

```typescript
import { createChainhookError, logChainhookError } from '@/config/chainhook/utils';

try {
  // Chainhook operation
} catch (error) {
  const chainhookError = createChainhookError(
    'CONNECTION_FAILED',
    'Failed to connect to Chainhook node',
    error
  );
  logChainhookError('Connection error', chainhookError);
}
```

## Next Steps

After setting up the configuration:

1. Create predicates for PassportX events (see issue #33)
2. Implement ChainhookEventObserver service (see issue #32)
3. Set up event handlers for badge minting, metadata updates, etc.
4. Integrate with notification system
5. Test with local Chainhook node

## Resources

- [Chainhook Documentation](https://docs.hiro.so/chainhook/overview)
- [Chainhook Client NPM](https://www.npmjs.com/package/@hirosystems/chainhook-client)
- [Chainhook GitHub](https://github.com/hirosystems/chainhook)
- [PassportX Issue #31](https://github.com/DeborahOlaboye/PassportX/issues/31)

## Related Issues

- #31 - Set up Hiro Chainhooks infrastructure and dependencies (this issue)
- #32 - Create ChainhookEventObserver service for PassportX
- #33 - Implement predicate for badge minting events
- #34 - Add chainhook predicate for badge metadata updates
- #35 - Monitor community creation events with Chainhooks
