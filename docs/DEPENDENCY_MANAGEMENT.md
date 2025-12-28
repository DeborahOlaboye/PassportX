# WalletConnect Dependency Management

This document outlines all WalletConnect dependencies and their compatibility requirements.

## Required Dependencies

### Core WalletConnect Packages

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@reown/walletkit` | ^1.4.1 | Main WalletConnect wallet SDK | Required for wallet integration |
| `@walletconnect/core` | ^2.23.1 | Core WalletConnect protocol | Required for P2P communication |
| `@walletconnect/utils` | ^2.23.1 | WalletConnect utilities | Required for utility functions |

### Supporting Packages

| Package | Version | Purpose | Optional |
|---------|---------|---------|----------|
| `qrcode` | ^1.5.4 | QR code generation | Mobile wallet connections |
| `@metamask/eth-sig-util` | ^8.2.0 | Message signing utilities | Signature verification |
| `zustand` | ^5.0.9 | State management | Wallet state management |
| `axios` | ^1.13.2 | HTTP client | API requests |
| `eth-sig-util` | ^3.0.1 | Legacy signing (deprecated) | Fallback compatibility |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/qrcode` | ^1.5.6 | TypeScript types for qrcode |

## Version Compatibility

### Node.js Requirements

- **Minimum**: Node.js 16.x
- **Recommended**: Node.js 18.x or higher
- **Current LTS**: Node.js 20.x

Check your Node version:
```bash
node --version
```

### npm Requirements

- **Minimum**: npm 7.x
- **Recommended**: npm 9.x or higher

Check your npm version:
```bash
npm --version
```

## Installation

### Initial Setup

```bash
# Install all dependencies (including WalletConnect packages)
npm install

# Verify dependency installation
npm run verify-deps
```

### Adding New Packages

```bash
# Install production dependency
npm install package-name --save

# Install development dependency
npm install package-name --save-dev

# Verify installation
npm run verify-deps
```

## Dependency Verification

Run the verification script to ensure all WalletConnect packages are properly installed:

```bash
npm run verify-deps
```

This script checks:
- ✅ All required WalletConnect packages are installed
- ✅ Optional packages are available
- ✅ Node.js version compatibility (16+)
- ✅ npm version compatibility

## Known Issues & Solutions

### Issue: Missing @walletconnect packages

**Solution:**
```bash
npm install @walletconnect/core @walletconnect/utils --save
npm install @reown/walletkit --save
```

### Issue: Peer dependency warnings

**Solution:**
Some packages may have peer dependency warnings. These are generally safe to ignore if the packages still work. Review the warning output for critical issues.

```bash
npm audit
npm audit fix
```

### Issue: Vulnerabilities detected

**Solution:**
```bash
# See vulnerability details
npm audit

# Fix non-breaking vulnerabilities
npm audit fix

# Force fix (may break compatibility)
npm audit fix --force
```

### Issue: Node version too old

**Solution:**
Update Node.js to version 16 or higher:

```bash
# Using nvm (Node Version Manager)
nvm install 18
nvm use 18

# Or download from https://nodejs.org/
```

## Package Lock Strategy

The `package-lock.json` file should be:
- ✅ Committed to version control
- ✅ Updated after `npm install`
- ✅ Never manually edited

Workflow:
```bash
# Make dependency changes
npm install package-name

# Commit both files
git add package.json package-lock.json
git commit -m "deps: Add package-name"
```

## Updating Dependencies

### Check for outdated packages

```bash
npm outdated
```

### Update specific package

```bash
# Update to latest version in semver range
npm update package-name

# Update to latest version (ignoring semver)
npm install package-name@latest
```

### Update all packages

```bash
npm update
```

## Security Best Practices

1. **Regular Audits**: Run `npm audit` regularly
2. **Review Updates**: Check changelog before updating
3. **Test After Update**: Run tests after dependency updates
4. **Pin Critical Versions**: Use exact versions for critical packages

## Troubleshooting

### Clear cache and reinstall

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Verify Node/npm installation

```bash
node -v
npm -v
which node
which npm
```

### Check for conflicting packages

```bash
npm list package-name
npm list
```

## CI/CD Integration

The `verify-deps` script is integrated into CI/CD to ensure:
- Dependencies are properly installed on build
- All required packages are available
- Node version is compatible

## References

- [WalletConnect Documentation](https://docs.walletconnect.network/)
- [npm Documentation](https://docs.npmjs.com/)
- [Node.js Downloads](https://nodejs.org/)
- [Semantic Versioning](https://semver.org/)
