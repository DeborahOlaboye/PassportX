# Dependency Management Migration Guide

## Overview

This guide provides step-by-step instructions for safely updating, migrating, and managing dependencies in the PassportX project.

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Update Process](#update-process)
3. [Testing Strategy](#testing-strategy)
4. [Rollback Procedures](#rollback-procedures)
5. [Common Migration Scenarios](#common-migration-scenarios)

## Pre-Migration Checklist

Before making any dependency changes, ensure:

- [ ] All tests pass: `npm run test:all`
- [ ] No outstanding branches or changes: `git status`
- [ ] Current branch is up-to-date: `git pull origin main`
- [ ] Backup current state: `git branch backup-$(date +%Y-%m-%d)`
- [ ] Review package-lock.json for recent changes
- [ ] Check GitHub issues for known compatibility problems

## Update Process

### 1. Single Package Update

```bash
# For a specific package
npm update package-name

# Verify update
npm ls package-name

# Test thoroughly
npm run test:all

# Commit changes
git commit -m "deps(update): Update package-name to X.Y.Z

- Update package-name from X.Y.Z-old to X.Y.Z
- Verify all tests pass
- No breaking changes detected"
```

### 2. Multiple Package Update

```bash
# Review available updates
npm outdated

# Update all packages (controlled)
npm update

# Review what changed
git diff package.json package-lock.json

# Test thoroughly
npm run test:all

# Commit changes
git commit -m "deps(update): Update multiple dependencies

- Updated packages: [list packages]
- All tests passing
- Verified compatibility"
```

### 3. Major Version Update

For major version updates (e.g., 2.x.y -> 3.x.y):

```bash
# 1. Review breaking changes
# Visit package GitHub/documentation for v3 migration guide

# 2. Update to new major version
npm install package-name@3.0.0

# 3. Update code for breaking changes
# Follow migration guide from step 1

# 4. Comprehensive testing
npm run test:all
npm run test:integration
npm run test:e2e

# 5. Commit with detailed message
git commit -m "deps(major): Update package-name to 3.0.0

BREAKING CHANGE: [Description of breaking changes]

Migration steps:
- [Step 1]
- [Step 2]

Fixes: #[issue-number]"
```

## Testing Strategy

### Local Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Verify dependency health
npm run deps:health

# Run linting
npm run lint
```

### CI/CD Testing

The GitHub Actions workflow will automatically:

1. Install exact versions from package-lock.json
2. Verify no unmet peer dependencies
3. Run all tests
4. Generate dependency health reports

### Smoke Testing

```bash
# Start development server
npm run dev

# In another terminal, run basic checks
curl http://localhost:3000
curl http://localhost:3001/health
```

## Rollback Procedures

### If Tests Fail

```bash
# Revert specific file
git checkout package.json package-lock.json

# Reinstall previous versions
npm ci

# Verify restoration
npm ls --depth=0
npm run test:all
```

### Complete Rollback

```bash
# If something goes seriously wrong
git reset --hard HEAD~1

# Reinstall dependencies
npm ci
cd backend && npm ci
```

### From Backup Branch

```bash
# If you created a backup branch before migration
git checkout backup-[date]

# Verify correct state
npm ls --depth=0
npm run test:all
```

## Common Migration Scenarios

### Scenario 1: Update Node.js Version

```bash
# 1. Update .nvmrc or engine field in package.json
echo "18.0.0" > .nvmrc

# 2. Switch Node version (if using nvm)
nvm use

# 3. Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install

# 4. Test everything
npm run test:all

# 5. Commit
git commit -m "deps(node): Update Node.js version to 18.0.0"
```

### Scenario 2: Replace Deprecated Package

```bash
# 1. Remove old package
npm uninstall old-package

# 2. Install replacement
npm install new-package

# 3. Update imports in code
# Search and replace in source files

# 4. Update tests
npm run test:all

# 5. Commit
git commit -m "deps(replace): Replace old-package with new-package

- Removed deprecated old-package
- Installed new-package as replacement
- Updated all imports
- All tests passing"
```

### Scenario 3: Resolve Peer Dependency Conflict

```bash
# 1. Identify conflict
npm ls

# 2. View the specific dependency
npm ls package-name

# 3. Check compatibility matrix
# Review both package's package.json files

# 4. Update to compatible version
npm install package-name@compatible-version

# 5. Verify resolution
npm ls --depth=0

# 6. Test thoroughly
npm run test:all
```

### Scenario 4: Security Vulnerability Fix

```bash
# 1. Run audit
npm audit

# 2. Review vulnerabilities
# Check severity and affected packages

# 3. Update vulnerable package
npm install package-name@latest

# 4. If auto-fix available
npm audit fix

# 5. Test thoroughly (security updates can have breaking changes)
npm run test:all

# 6. Commit with security reference
git commit -m "deps(security): Update vulnerable-package to fix CVE-XXXX

Security update to address vulnerability in vulnerable-package
See: https://nvd.nist.gov/vuln/detail/CVE-XXXX"
```

## Best Practices

1. **One Package at a Time** - Makes it easier to identify issues
2. **Small, Frequent Updates** - Rather than large bulk updates
3. **Test After Every Update** - Before committing
4. **Document Breaking Changes** - In commit messages
5. **Use package-lock.json** - Never delete it manually
6. **Keep `dependencies` vs `devDependencies` Clean** - Review classification
7. **Monitor GitHub Advisories** - Set up security notifications
8. **Regular Audits** - Weekly or bi-weekly dependency reviews

## References

- [npm-audit Documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [npm-update Documentation](https://docs.npmjs.com/cli/v10/commands/npm-update)
- [Package.json Documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
- [DEPENDENCY_RESOLUTION.md](DEPENDENCY_RESOLUTION.md)
- [CICD_DEPENDENCY_MANAGEMENT.md](CICD_DEPENDENCY_MANAGEMENT.md)

## Support

For dependency-related issues:

1. Check this guide for migration procedures
2. Review [DEPENDENCY_RESOLUTION.md](DEPENDENCY_RESOLUTION.md)
3. Run `npm run deps:health` for diagnostics
4. Open an issue with detailed error information
