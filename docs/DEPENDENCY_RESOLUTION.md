# Dependency Resolution Guide

## Issue #167: Unmet Peer Dependencies

This document outlines the resolution of unmet peer dependencies in the PassportX project.

## Identified Unmet Dependencies

The following packages were identified as unmet peer dependencies:

1. `@hirosystems/chainhook-client@^2.4.0` - Chainhook client library
2. `@metamask/eth-sig-util@^8.2.0` - MetaMask signature utilities
3. `@reown/walletkit@^1.4.1` - Reown wallet connection kit
4. `@types/qrcode@^1.5.6` - Type definitions for QR code
5. `@walletconnect/core@^2.23.1` - WalletConnect core library
6. `@walletconnect/utils@^2.23.1` - WalletConnect utilities
7. `axios@^1.13.2` - HTTP client
8. `date-fns@^4.1.0` - Date utilities
9. `eth-sig-util@^3.0.1` - Ethereum signature utilities
10. `qrcode@^1.5.4` - QR code generation
11. `socket.io-client@^4.8.1` - Socket.io client
12. `zustand@^5.0.9` - State management
13. `verify-deps` - Custom dependency verification script (incorrectly listed as dependency)

## Resolution Steps

### 1. Remove Incorrectly Listed Dependencies
- Removed `verify-deps` from dependencies section
- Converted to npm script for proper execution

### 2. Clean Installation
Run `npm ci` in CI/CD environments for reproducible builds:
```bash
npm ci
npm ls --depth=0
```

### 3. Local Development
For local development, use:
```bash
npm install
npm ls --depth=0
```

### 4. Dependency Verification
Use the verify-deps script to check for unmet dependencies:
```bash
npm run verify-deps
```

## Best Practices

1. **Always use `npm ci` in CI/CD** - Ensures exact versions from package-lock.json
2. **Commit package-lock.json** - Ensures reproducible builds across environments
3. **Regular dependency audits** - Run `npm audit` to check for vulnerabilities
4. **Update dependencies carefully** - Test thoroughly after updating
5. **Use workspace dependency management** - Ensure consistent versions across packages

## Troubleshooting

If you still see unmet dependencies:

1. Clear npm cache: `npm cache clean --force`
2. Remove node_modules: `rm -rf node_modules package-lock.json`
3. Reinstall: `npm install`
4. Verify: `npm ls --depth=0`

## Related Files

- [package.json](../package.json)
- [package-lock.json](../package-lock.json)
- [backend/package.json](../backend/package.json)
