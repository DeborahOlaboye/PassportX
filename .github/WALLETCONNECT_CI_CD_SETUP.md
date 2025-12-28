# WalletConnect CI/CD Setup Guide

## Quick Start

This guide provides setup instructions for the WalletConnect CI/CD integration.

### Prerequisites

- Node.js 18+ or 20+
- Docker and Docker Compose
- Git
- GitHub CLI (gh)
- Proper access to PassportX repository

### Required GitHub Secrets

The following secrets must be configured in the GitHub repository settings:

#### Testnet Secrets
- `TESTNET_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID for testnet
- `TESTNET_API_URL` - API endpoint for testnet
- `TESTNET_HOST` - Server hostname for testnet

#### Mainnet Staging Secrets
- `MAINNET_STAGING_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID for mainnet staging
- `MAINNET_STAGING_API_URL` - API endpoint for mainnet staging

#### General Secrets
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `VERCEL_TESTNET_PROJECT_ID` - Vercel testnet project ID
- `DOCKER_REGISTRY` - Docker registry URL
- `SLACK_WEBHOOK` - Slack webhook for notifications
- `CYPRESS_RECORD_KEY` - Cypress recording token

### Environment Setup

#### 1. Clone Repository

```bash
git clone https://github.com/DeborahOlaboye/PassportX.git
cd PassportX
```

#### 2. Install Dependencies

```bash
npm ci
```

#### 3. Configure Environment Variables

Create environment files:

```bash
# Copy testnet configuration
cp .env.walletconnect.testnet.example .env.walletconnect.testnet
# Edit and add your testnet credentials

# Copy mainnet staging configuration
cp .env.walletconnect.mainnet-staging.example .env.walletconnect.mainnet-staging
# Edit and add your mainnet staging credentials
```

#### 4. Create New Branch for WalletConnect Development

```bash
git checkout -b feature/walletconnect-development
```

### Running Tests Locally

#### Run All WalletConnect Tests

```bash
npm run test -- tests/integration/walletconnect.test.ts
```

#### Run Testnet-Only Tests

```bash
npm run test -- tests/integration/walletconnect.test.ts --testNamePattern="Testnet"
```

#### Run Mainnet-Only Tests

```bash
npm run test -- tests/integration/walletconnect.test.ts --testNamePattern="Mainnet"
```

#### Run Validation

```bash
# Bash validation
./scripts/validate-walletconnect-deployment.sh testnet

# TypeScript validation
npm run validate:walletconnect testnet
```

### Local Deployment

#### Deploy to Testnet

```bash
./scripts/deploy-walletconnect.sh testnet
```

#### Dry Run (without actual deployment)

```bash
./scripts/deploy-walletconnect.sh testnet true
```

### Docker Compose

#### Start Testnet Services

```bash
docker-compose -f docker-compose.walletconnect.testnet.yml up -d
```

#### Start Mainnet Staging Services

```bash
docker-compose -f docker-compose.walletconnect.mainnet-staging.yml up -d
```

#### Check Service Status

```bash
docker-compose -f docker-compose.walletconnect.testnet.yml ps
```

#### View Logs

```bash
docker-compose -f docker-compose.walletconnect.testnet.yml logs -f
```

### GitHub Actions Workflows

#### CI Workflow

**Trigger:** Push to main/develop or Pull Request  
**Duration:** ~15-20 minutes  
**Status:** View at `.github/workflows/ci.yml`

To manually trigger:

```bash
gh workflow run ci.yml --ref develop
```

#### Deploy Workflow

**Trigger:** Push to main (production) or develop (testnet/staging)  
**Duration:** ~30-45 minutes  
**Status:** View at `.github/workflows/deploy.yml`

To manually trigger:

```bash
gh workflow run deploy.yml --ref develop
```

### Monitoring

#### Check CI Pipeline Status

```bash
gh run list --workflow=ci.yml --limit=5
```

#### Check Deployment Status

```bash
gh run list --workflow=deploy.yml --limit=5
```

#### View Workflow Details

```bash
gh run view <run-id>
```

### Common Issues & Troubleshooting

#### Issue: Tests Failing Locally

**Solution:**
1. Ensure dependencies are installed: `npm ci`
2. Verify environment variables: `env | grep WALLETCONNECT`
3. Check Node version: `node --version` (should be 18+ or 20+)
4. Run tests in verbose mode: `npm run test -- tests/integration/walletconnect.test.ts --verbose`

#### Issue: Docker Compose Fails to Start

**Solution:**
1. Check Docker is running: `docker --version`
2. Verify ports are available: `netstat -an | grep 3000`
3. Check logs: `docker-compose logs`
4. Remove old containers: `docker-compose down -v`

#### Issue: Deployment Timeout

**Solution:**
1. Check network connectivity: `ping 8.8.8.8`
2. Verify Docker registry access: `docker login`
3. Check available disk space: `df -h`
4. Increase timeout in deployment script

#### Issue: GitHub Actions Secrets Not Found

**Solution:**
1. Verify secrets in repository settings
2. Ensure secret names match exactly
3. Check organization-level secrets (if applicable)
4. Re-authenticate: `gh auth login`

### Best Practices

1. **Branch Strategy**
   - `main` → Production
   - `develop` → Testnet & Mainnet Staging
   - Feature branches → Feature development

2. **Commit Messages**
   - Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
   - Include issue reference: `#82`
   - Example: `feat(walletconnect): Add deployment automation (#82)`

3. **Pull Request Process**
   - Ensure tests pass locally before pushing
   - Wait for CI pipeline to complete
   - Request code review
   - Squash commits before merge

4. **Deployment Process**
   - Always test in testnet first
   - Wait for mainnet staging approval
   - Monitor logs after deployment
   - Have rollback plan ready

5. **Documentation**
   - Keep README updated
   - Document configuration changes
   - Update deployment procedures
   - Record breaking changes

### Useful Commands

```bash
# Setup and Install
npm ci
npm install

# Testing
npm run test
npm run test:unit
npm run test:e2e
npm run test -- tests/integration/walletconnect.test.ts

# Linting and Formatting
npm run lint
npm run lint:fix
npm run format

# Building
npm run build
npm run build:docker

# Validation
./scripts/validate-walletconnect-deployment.sh testnet
npm run validate:walletconnect testnet
npm run test:cicd:config

# Deployment
./scripts/deploy-walletconnect.sh testnet
./scripts/deploy-walletconnect.sh testnet true  # dry run

# Docker
docker-compose -f docker-compose.walletconnect.testnet.yml up -d
docker-compose -f docker-compose.walletconnect.mainnet-staging.yml up -d
docker-compose ps
docker-compose logs -f

# Git
git checkout -b feature/walletconnect-feature-name
git add .
git commit -m "feat(walletconnect): Description (#82)"
git push origin feature/walletconnect-feature-name
gh pr create --draft
gh pr ready <pr-number>
```

### Support & Resources

- **Documentation**
  - [WalletConnect Deployment Checklist](../docs/WALLETCONNECT_DEPLOYMENT_CHECKLIST.md)
  - [WalletConnect Rollback Strategy](../docs/WALLETCONNECT_ROLLBACK_STRATEGY.md)
  - [WalletConnect CI/CD Summary](../docs/WALLETCONNECT_CI_CD_INTEGRATION_SUMMARY.md)

- **External Resources**
  - [WalletConnect Docs](https://docs.walletconnect.com)
  - [GitHub Actions Docs](https://docs.github.com/en/actions)
  - [Docker Compose Docs](https://docs.docker.com/compose/)

- **Team Contacts**
  - Engineering Lead: [contact info]
  - DevOps: [contact info]
  - Security: [contact info]

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-23 | Initial setup guide for WalletConnect CI/CD |

---

**Last Updated:** 2024-12-23  
**Status:** Active  
**Next Review:** 2024-12-30
