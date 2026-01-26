# CI/CD Dependency Management Guide

## Overview

This guide explains how PassportX handles dependency management in CI/CD pipelines to ensure reproducible builds and prevent runtime failures.

## Key Principles

1. **Use `npm ci` in CI/CD** - Always use clean install for reproducible builds
2. **Commit package-lock.json** - Ensures exact version resolution
3. **Verify dependencies** - Fail fast if dependencies are missing
4. **Regular audits** - Check for security vulnerabilities

## GitHub Actions Integration

The project includes an automated dependency check workflow (`.github/workflows/dependency-check.yml`) that:

- Runs on push, PR, and daily schedule
- Checks both frontend and backend dependencies
- Fails if unmet peer dependencies are detected
- Generates dependency health reports

### Workflow Stages

```yaml
1. Checkout Code
2. Setup Node.js Environment
3. Install Dependencies (npm ci)
4. Verify Dependency Tree
5. Check for Missing Packages
6. Run Security Audit
7. Generate Reports
```

## Local Development

### Initial Setup

```bash
# Clone repository
git clone https://github.com/DeborahOlaboye/PassportX.git
cd PassportX

# Install dependencies
npm install

# Verify installation
npm run deps:check
npm run deps:validate
```

### Daily Development

```bash
# Check dependency health
npm run deps:health

# Validate package.json
npm run deps:validate

# Run security audit
npm run deps:audit

# Check for updates
npm outdated
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Run `npm ci` to get exact versions
- [ ] Verify `npm ls --depth=0` shows no UNMET DEPENDENCIES
- [ ] Run `npm audit` for security issues
- [ ] Review `CHANGELOG.md` for breaking changes
- [ ] Test with `npm run test:all`

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install exact versions from lock file
RUN npm ci --production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Start application
CMD ["npm", "start"]
```

## Troubleshooting

### Unmet Peer Dependencies

If you see unmet peer dependencies:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Verify
npm ls --depth=0
```

### Private Registry Issues

If using a private npm registry:

```bash
# Configure auth token in .npmrc
npm config set //private-registry.com/:_authToken="YOUR_TOKEN"

# Or set environment variable
export NPM_TOKEN="YOUR_TOKEN"
```

### Version Conflicts

If dependencies have version conflicts:

```bash
# Check which packages have conflicts
npm ls

# Update a specific package
npm update package-name

# Force resolution
npm ci --force
```

## Dependency Update Policy

### When to Update

- [ ] Security patches (ASAP)
- [ ] Bug fixes (Monthly)
- [ ] Minor versions (Quarterly)
- [ ] Major versions (Only after testing)

### Update Process

```bash
# Check available updates
npm outdated

# Update specific package
npm update package-name

# Update all packages
npm update

# Test after updates
npm test
npm run test:all
```

## Related Files

- [.npmrc](.npmrc) - npm client configuration
- [.npmignore](.npmignore) - Package distribution settings
- [DEPENDENCY_RESOLUTION.md](docs/DEPENDENCY_RESOLUTION.md) - Dependency troubleshooting
- [.github/workflows/dependency-check.yml](.github/workflows/dependency-check.yml) - Automated checks
- [scripts/dependency-checker.sh](scripts/dependency-checker.sh) - Manual verification script

## Environment-Specific Configuration

### Development

```bash
npm install
NODE_ENV=development npm run dev
```

### Staging

```bash
npm ci
NODE_ENV=staging npm run build
```

### Production

```bash
npm ci --production
NODE_ENV=production npm start
```

## Support

For dependency-related issues:

1. Check [DEPENDENCY_RESOLUTION.md](docs/DEPENDENCY_RESOLUTION.md)
2. Run `npm run deps:health` for diagnostics
3. Review GitHub Actions logs for CI failures
4. Open an issue with detailed error information
