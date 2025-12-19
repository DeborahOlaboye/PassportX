# Chainhook Quick Reference

Quick reference guide for common Chainhook operations in PassportX.

## Import Configuration

```typescript
// Import everything from central config
import { getChainhookConfig, validateChainhookConfig } from '@/config';

// Or import from chainhook directly
import { getChainhookConfig } from '@/config/chainhook';
```

## Get Configuration

```typescript
import { getChainhookConfig } from '@/config';

// Development environment with mainnet
const config = getChainhookConfig('development', 'mainnet');

// Production environment with mainnet
const config = getChainhookConfig('production', 'mainnet');

// Development with testnet
const config = getChainhookConfig('development', 'testnet');
```

## Validate Configuration

```typescript
import { validateChainhookConfig } from '@/config';

try {
  validateChainhookConfig(config);
  console.log('Configuration is valid');
} catch (error) {
  console.error('Invalid configuration:', error.message);
}
```

## Check if Chainhook is Enabled

```typescript
import { isChainhookEnabled } from '@/config';

if (isChainhookEnabled()) {
  // Initialize Chainhook observer
}
```

## Get Current Network

```typescript
import { getCurrentNetwork } from '@/config';

const network = getCurrentNetwork(); // 'development' | 'testnet' | 'mainnet'
```

## Format Contract Addresses

```typescript
import { formatContractAddress, PASSPORTX_CONTRACTS } from '@/config';

const deployer = PASSPORTX_CONTRACTS.MAINNET.DEPLOYER;
const contractAddress = formatContractAddress(deployer, 'passport-nft');
// Result: "SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft"
```

## Parse Contract Addresses

```typescript
import { parseContractAddress } from '@/config';

const address = "SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft";
const { deployer, contractName } = parseContractAddress(address);
// deployer: "SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0"
// contractName: "passport-nft"
```

## Error Handling

```typescript
import { createChainhookError, logChainhookError } from '@/config';

try {
  // Some Chainhook operation
} catch (error) {
  const chainhookError = createChainhookError(
    'CONNECTION_FAILED',
    'Failed to connect to node',
    error as Error
  );
  logChainhookError('Connection error', chainhookError);
}
```

## Debug Logging

```typescript
import { logChainhook } from '@/config';

// Only logs if debug mode is enabled
logChainhook('Processing event', { eventType: 'badge-mint' });
```

## Environment Variables

```bash
# Required
CHAINHOOK_NODE_URL=http://localhost:20456
CHAINHOOK_SERVER_HOST=localhost
CHAINHOOK_SERVER_PORT=3010

# Optional
CHAINHOOK_NODE_API_KEY=your-api-key
CHAINHOOK_NODE_TIMEOUT=30000
NEXT_PUBLIC_CHAINHOOK_ENABLED=true
NEXT_PUBLIC_CHAINHOOK_DEBUG=false
```

## Constants

```typescript
import {
  CHAINHOOK_DEFAULTS,
  CHAINHOOK_NETWORKS,
  CHAINHOOK_EVENT_TYPES,
  PASSPORTX_CONTRACTS,
  PASSPORTX_PREDICATES,
} from '@/config';

// Server defaults
console.log(CHAINHOOK_DEFAULTS.SERVER.PORT); // 3010

// Networks
console.log(CHAINHOOK_NETWORKS.MAINNET); // 'mainnet'

// Event types
console.log(CHAINHOOK_EVENT_TYPES.CONTRACT_CALL); // 'stacks-contract-call'

// Contract addresses
console.log(PASSPORTX_CONTRACTS.MAINNET.PASSPORT_NFT);

// Predicate names
console.log(PASSPORTX_PREDICATES.BADGE_MINT); // 'passportx-badge-mint'
```

## Testing Configuration

```bash
# Run configuration tests
npm run test:chainhook

# Or manually
npx tsx scripts/test-chainhook-config.ts
```

## Common Patterns

### Initialize Chainhook Observer

```typescript
import { ChainhookEventObserver } from '@hirosystems/chainhook-client';
import { getChainhookConfig, isChainhookEnabled } from '@/config';

if (!isChainhookEnabled()) {
  console.log('Chainhook is disabled');
  return;
}

const config = getChainhookConfig();

const observer = new ChainhookEventObserver(
  config.server,
  config.node
);
```

### Create a Predicate

```typescript
import {
  generatePredicateUUID,
  PASSPORTX_CONTRACTS,
  PASSPORTX_PREDICATES,
} from '@/config';

const predicate = {
  uuid: generatePredicateUUID(PASSPORTX_PREDICATES.BADGE_MINT),
  name: 'Badge Mint Events',
  type: 'stacks-contract-call' as const,
  network: 'mainnet' as const,
  if_this: {
    scope: 'contract_call',
    contract_identifier: PASSPORTX_CONTRACTS.MAINNET.PASSPORT_NFT,
    method: 'mint',
  },
  then_that: {
    http_post: {
      url: 'http://localhost:3010/chainhook/badge-mint',
      authorization_header: 'Bearer YOUR_TOKEN',
    },
  },
};
```

### Validate Environment Before Starting

```typescript
import { validateChainhookEnvironment } from '@/config';

const { valid, errors } = validateChainhookEnvironment();

if (!valid) {
  console.error('Chainhook environment validation failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Environment is valid, starting Chainhook observer...');
```

## Troubleshooting

### Configuration Not Loading

Check environment variables are set:
```bash
node -e "console.log(process.env.CHAINHOOK_NODE_URL)"
```

### Validation Failing

Run the test script to see detailed errors:
```bash
npm run test:chainhook
```

### Types Not Found

Ensure you're importing from the correct path:
```typescript
// ✅ Correct
import { getChainhookConfig } from '@/config';

// ❌ Incorrect
import { getChainhookConfig } from './chainhook';
```

## Resources

- [Full Documentation](../src/config/chainhook/README.md)
- [Setup Guide](../CHAINHOOK_SETUP.md)
- [Chainhook Docs](https://docs.hiro.so/chainhook/overview)
- [Issue #31](https://github.com/DeborahOlaboye/PassportX/issues/31)
