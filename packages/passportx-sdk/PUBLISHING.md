# Publishing Guide

This guide explains how to publish the @passportx/sdk package to npm.

## Prerequisites

1. **npm Account**: You need an npm account with publish permissions
   - Create an account at https://www.npmjs.com/signup
   - Login: `npm login`

2. **Two-Factor Authentication**: Enable 2FA on your npm account
   - Required for publishing packages

3. **Organization Access**: Get added to the @passportx organization (if using scoped package)

## Pre-Publishing Checklist

Before publishing, ensure:

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Version number updated in `package.json`
- [ ] CHANGELOG.md updated with new version
- [ ] README.md is up to date
- [ ] No sensitive data in the package
- [ ] LICENSE file is present

## Publishing Steps

### 1. Prepare the Package

```bash
# Navigate to SDK directory
cd packages/passportx-sdk

# Install dependencies
npm install

# Run tests
npm test

# Build the package
npm run build
```

### 2. Update Version

Update the version number in `package.json` following [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.x): Bug fixes
- **Minor** (1.x.0): New features (backward compatible)
- **Major** (x.0.0): Breaking changes

```bash
# Patch release (1.0.0 -> 1.0.1)
npm version patch

# Minor release (1.0.0 -> 1.1.0)
npm version minor

# Major release (1.0.0 -> 2.0.0)
npm version major
```

### 3. Build and Test

```bash
# Clean previous build
rm -rf dist

# Build the package
npm run build

# Test the build locally
npm pack

# This creates a .tgz file you can test with:
# npm install /path/to/passportx-sdk-1.0.0.tgz
```

### 4. Publish to npm

```bash
# Dry run (see what would be published)
npm publish --dry-run

# Publish to npm (public package)
npm publish --access public

# For scoped package under @passportx organization
npm publish --access public
```

### 5. Verify Publication

```bash
# Check npm registry
npm view @passportx/sdk

# Install and test
npm install @passportx/sdk
```

### 6. Tag the Release in Git

```bash
# Create git tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag to GitHub
git push origin v1.0.0

# Push all tags
git push --tags
```

## Publishing Beta/RC Versions

For pre-release versions:

```bash
# Set version with pre-release tag
npm version 1.1.0-beta.1

# Publish with beta tag
npm publish --tag beta

# Users install with:
# npm install @passportx/sdk@beta
```

## Deprecating Versions

If you need to deprecate a version:

```bash
npm deprecate @passportx/sdk@1.0.0 "This version has a critical bug. Please upgrade to 1.0.1"
```

## Unpublishing (Emergency Only)

⚠️ **Warning**: Only use in emergencies (e.g., leaked secrets)

```bash
# Unpublish a specific version (within 72 hours)
npm unpublish @passportx/sdk@1.0.0

# Completely remove package (not recommended)
npm unpublish @passportx/sdk --force
```

## Automated Publishing with CI/CD

Add to your CI/CD pipeline:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: cd packages/passportx-sdk && npm ci

      - name: Run tests
        run: cd packages/passportx-sdk && npm test

      - name: Build
        run: cd packages/passportx-sdk && npm run build

      - name: Publish to npm
        run: cd packages/passportx-sdk && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Post-Publishing

After publishing:

1. Create a GitHub release with:
   - Release notes from CHANGELOG.md
   - Breaking changes highlighted
   - Migration guide (for major versions)

2. Announce the release:
   - Update project README
   - Post on social media
   - Notify users/community

3. Monitor:
   - npm download stats
   - GitHub issues
   - User feedback

## Troubleshooting

### "You must be logged in to publish packages"
```bash
npm login
```

### "You do not have permission to publish"
- Verify you're a member of the @passportx organization
- Check package name is available

### "Version already exists"
- Version numbers cannot be reused
- Increment version and try again

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm CLI Documentation](https://docs.npmjs.com/cli/)
