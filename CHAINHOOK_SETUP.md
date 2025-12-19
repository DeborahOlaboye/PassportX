# Chainhook Setup Guide

Complete guide for setting up Hiro Chainhooks in PassportX.

## Prerequisites

- Node.js 18+ installed
- PassportX repository cloned
- Basic understanding of blockchain events

## Installation Steps

### 1. Install Dependencies

The `@hirosystems/chainhook-client` package is already installed. Verify:

```bash
npm list @hirosystems/chainhook-client
```

### 2. Configure Environment Variables

Copy the example environment files:

```bash
cp .env.example .env
cp .env.local.example .env.local
```

Edit `.env` and configure Chainhook settings:

```bash
# Chainhook Node Configuration
CHAINHOOK_NODE_URL=http://localhost:20456
CHAINHOOK_NODE_API_KEY=your-api-key-here
CHAINHOOK_NODE_TIMEOUT=30000
CHAINHOOK_NODE_RETRY_ENABLED=true
CHAINHOOK_NODE_MAX_RETRIES=3
CHAINHOOK_NODE_RETRY_DELAY=1000

# Chainhook Server Configuration
CHAINHOOK_SERVER_HOST=localhost
CHAINHOOK_SERVER_PORT=3010
CHAINHOOK_SERVER_EXTERNAL_URL=http://localhost:3010
CHAINHOOK_SERVER_HTTPS=false
```

Edit `.env.local` for Next.js public variables:

```bash
NEXT_PUBLIC_CHAINHOOK_ENABLED=true
NEXT_PUBLIC_CHAINHOOK_DEBUG=true
```

### 3. Verify Configuration

The configuration files are located in `src/config/chainhook/`:

- ✅ `types/chainhook.ts` - Type definitions
- ✅ `server.config.ts` - Server configuration
- ✅ `node.config.ts` - Node configuration
- ✅ `index.ts` - Main config module
- ✅ `constants.ts` - Constants
- ✅ `utils.ts` - Utilities
- ✅ `README.md` - Documentation

## Local Development Setup

### Option 1: Using Hiro Platform (Recommended for Testing)

1. Sign up for a free account at [platform.hiro.so](https://platform.hiro.so)
2. Get your API key from the dashboard
3. Update `.env`:
   ```bash
   CHAINHOOK_NODE_URL=https://api.hiro.so
   CHAINHOOK_NODE_API_KEY=your-api-key
   ```

### Option 2: Running Local Chainhook Node

1. Install Chainhook CLI:
   ```bash
   # macOS
   brew install hirosystems/clarinet/chainhook

   # Or download from GitHub releases
   # https://github.com/hirosystems/chainhook/releases
   ```

2. Initialize Chainhook configuration:
   ```bash
   chainhook init
   ```

3. Start the Chainhook node:
   ```bash
   chainhook start --config-path=chainhook.toml
   ```

4. Verify it's running:
   ```bash
   curl http://localhost:20456/health
   ```

## Usage Examples

### Basic Configuration Import

```typescript
import { getChainhookConfig } from '@/config/chainhook';

const config = getChainhookConfig('development', 'mainnet');
console.log('Chainhook configured:', config);
```

### Network Detection

```typescript
import { getCurrentNetwork } from '@/config/chainhook/utils';

const network = getCurrentNetwork();
console.log('Current network:', network);
```

### Environment Validation

```typescript
import { validateChainhookEnvironment } from '@/config/chainhook/utils';

const { valid, errors } = validateChainhookEnvironment();

if (!valid) {
  console.error('Configuration errors:', errors);
  process.exit(1);
}
```

### Contract Address Formatting

```typescript
import { formatContractAddress, PASSPORTX_CONTRACTS } from '@/config/chainhook';

const deployer = PASSPORTX_CONTRACTS.MAINNET.DEPLOYER;
const nftAddress = formatContractAddress(deployer, 'passport-nft');
console.log('NFT Contract:', nftAddress);
```

## Testing Configuration

Create a test file `test-chainhook-config.ts`:

```typescript
import {
  getChainhookConfig,
  validateChainhookConfig,
  validateChainhookEnvironment,
} from '@/config/chainhook';

async function testConfiguration() {
  console.log('Testing Chainhook Configuration...\n');

  // Test environment validation
  const envValidation = validateChainhookEnvironment();
  console.log('Environment validation:', envValidation);

  if (!envValidation.valid) {
    console.error('Fix the following errors:');
    envValidation.errors.forEach(error => console.error(`- ${error}`));
    return;
  }

  // Test configuration
  try {
    const config = getChainhookConfig('development', 'mainnet');
    console.log('Configuration loaded successfully');

    validateChainhookConfig(config);
    console.log('Configuration is valid ✓');

    console.log('\nServer Config:');
    console.log(`- Host: ${config.server.hostname}`);
    console.log(`- Port: ${config.server.port}`);
    console.log(`- HTTPS: ${config.server.https}`);

    console.log('\nNode Config:');
    console.log(`- URL: ${config.node.baseUrl}`);
    console.log(`- Timeout: ${config.node.timeout}ms`);
    console.log(`- Retry Enabled: ${config.node.retryEnabled}`);
  } catch (error) {
    console.error('Configuration error:', error);
  }
}

testConfiguration();
```

Run the test:

```bash
npx tsx test-chainhook-config.ts
```

## Troubleshooting

### Configuration Errors

**Error: `CHAINHOOK_NODE_URL is required`**
- Solution: Set `CHAINHOOK_NODE_URL` in your `.env` file

**Error: `Invalid Chainhook node base URL format`**
- Solution: Ensure URL includes protocol (http:// or https://)

**Error: `CHAINHOOK_SERVER_PORT must be a valid port number`**
- Solution: Use a port between 1-65535

### Connection Issues

**Cannot connect to Chainhook node**
- Check if the Chainhook node is running
- Verify the URL is correct
- Check firewall settings
- Verify API key if using hosted service

**Local server port already in use**
- Change `CHAINHOOK_SERVER_PORT` to a different port
- Check what's using the port: `lsof -i :3010`

## Next Steps

After completing setup:

1. ✅ Configuration is ready for predicates
2. 🔜 Create ChainhookEventObserver service (Issue #32)
3. 🔜 Implement badge minting predicate (Issue #33)
4. 🔜 Add metadata update predicate (Issue #34)
5. 🔜 Monitor community creation events (Issue #35)

## Resources

- [Chainhook Documentation](https://docs.hiro.so/chainhook/overview)
- [Configuration Reference](./src/config/chainhook/README.md)
- [Chainhook Client NPM](https://www.npmjs.com/package/@hirosystems/chainhook-client)
- [Issue #31](https://github.com/DeborahOlaboye/PassportX/issues/31)

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the [configuration documentation](./src/config/chainhook/README.md)
3. Open an issue on GitHub with:
   - Your configuration (redact sensitive data)
   - Error messages
   - Steps to reproduce

## Related Files

- `src/config/chainhook/` - Configuration files
- `.env.example` - Environment variable template
- `.env.local.example` - Next.js public variables template
- `README.md` - Main project documentation
