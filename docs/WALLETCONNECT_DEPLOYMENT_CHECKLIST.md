# WalletConnect CI/CD Deployment Checklist

This document outlines the complete deployment checklist and procedures for WalletConnect integration in the PassportX CI/CD pipeline.

## Table of Contents

1. [Pre-Deployment Validation](#pre-deployment-validation)
2. [Testnet Deployment Checklist](#testnet-deployment-checklist)
3. [Mainnet Staging Deployment Checklist](#mainnet-staging-deployment-checklist)
4. [Production Deployment Checklist](#production-deployment-checklist)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring and Validation](#monitoring-and-validation)

---

## Pre-Deployment Validation

### Code Quality Checks

- [ ] All tests pass locally: `npm run test`
- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] ESLint passes: `npm run lint`
- [ ] No security vulnerabilities: `npm audit --audit-level=moderate`
- [ ] WalletConnect tests pass: `npm run test -- tests/integration/walletconnect.test.ts`
- [ ] Code coverage meets threshold (>80%)

### Configuration Validation

- [ ] Environment variables are correctly set
- [ ] WalletConnect Project ID is configured
- [ ] Network configuration matches target environment
- [ ] API endpoints are correct for the environment
- [ ] RPC URLs are reachable and valid

### Git and Branch Checks

- [ ] Working directory is clean (no uncommitted changes)
- [ ] All commits are signed
- [ ] Branch is up-to-date with remote
- [ ] Pull request approval received (if required)
- [ ] CI pipeline passes all checks

---

## Testnet Deployment Checklist

### Pre-Deployment

- [ ] Code changes are reviewed and approved
- [ ] All WalletConnect testnet tests pass
- [ ] Testnet environment variables are configured
- [ ] Testnet RPC endpoint is reachable
- [ ] Testnet WalletConnect Project ID is valid
- [ ] Previous testnet deployment is stable

### During Deployment

- [ ] GitHub Actions workflow initiated successfully
- [ ] Node.js dependencies install without errors
- [ ] Build completes successfully
- [ ] Frontend build includes WalletConnect configuration
- [ ] Backend build includes WalletConnect integration
- [ ] Deployment artifacts are generated

### Post-Deployment

- [ ] Deployment URL is accessible
- [ ] WalletConnect connection can be established
- [ ] Transaction signing works correctly
- [ ] Message signing works correctly
- [ ] Event handlers are functioning
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] Slack notification received

### Validation Tests

```bash
# Run WalletConnect testnet validation
npm run test:walletconnect:testnet

# Check deployed application
curl -s https://testnet.passportx.app/health

# Verify WalletConnect integration
npx cypress run --spec="tests/e2e/walletconnect.cy.ts"
```

---

## Mainnet Staging Deployment Checklist

### Security Review

- [ ] Code has been security audited
- [ ] No hardcoded credentials in code
- [ ] Encryption is enabled for sensitive data
- [ ] HTTPS/TLS is enforced
- [ ] Rate limiting is configured
- [ ] Audit logging is enabled
- [ ] MFA is required for sensitive operations

### Pre-Deployment Validation

- [ ] All testnet deployments are stable
- [ ] WalletConnect mainnet configuration is validated
- [ ] Mainnet RPC endpoint is reachable
- [ ] Mainnet WalletConnect Project ID is configured
- [ ] Security audit completed and approved
- [ ] Team lead approval received

### Approval Gate

- [ ] Security Lead Approval:
  - [ ] Confirmed encryption configuration
  - [ ] Verified access controls
  - [ ] Validated audit logging

- [ ] Team Lead Approval:
  - [ ] Confirmed deployment plan
  - [ ] Verified rollback strategy
  - [ ] Approved deployment timeline

- [ ] Operations Lead Approval:
  - [ ] Confirmed infrastructure readiness
  - [ ] Verified monitoring setup
  - [ ] Confirmed incident response plan

### During Deployment

- [ ] GitHub Actions workflow initiated
- [ ] Security audit step completes successfully
- [ ] All WalletConnect mainnet tests pass
- [ ] Configuration validation succeeds
- [ ] Frontend build completes with mainnet config
- [ ] Deployment report generated
- [ ] Checklist artifact uploaded

### Post-Deployment

- [ ] Staging mainnet URL is accessible
- [ ] WalletConnect connection to mainnet works
- [ ] Transaction signing validated on mainnet
- [ ] Message signing validated on mainnet
- [ ] Gas estimation works correctly
- [ ] Network switching functionality works
- [ ] Error handling is functioning
- [ ] Logs show no critical errors
- [ ] Slack notification received

---

## Production Deployment Checklist

### Final Pre-Deployment

- [ ] Mainnet staging deployment is stable (24+ hours)
- [ ] No critical issues reported during staging
- [ ] All bug fixes and improvements are included
- [ ] Documentation is updated
- [ ] Changelog is prepared
- [ ] Release notes are written

### Approval Process

- [ ] Executive Approval:
  - [ ] Confirmed business readiness
  - [ ] Verified customer communication plan

- [ ] Security Lead Final Approval:
  - [ ] Confirmed all security requirements met
  - [ ] Verified incident response procedures

- [ ] Engineering Lead Final Approval:
  - [ ] Confirmed all tests pass
  - [ ] Verified rollback readiness

### Deployment Execution

- [ ] Scheduled deployment during low-traffic window
- [ ] Monitoring dashboards are open
- [ ] Incident response team is on standby
- [ ] Deployment begins on main branch
- [ ] All CI/CD checks pass
- [ ] Production deployment initiates

### Post-Deployment Validation

- [ ] Production application is accessible
- [ ] WalletConnect mainnet connection works
- [ ] All user transactions process successfully
- [ ] Performance metrics are normal
- [ ] Error rates are acceptable
- [ ] No critical errors in logs
- [ ] User-facing features work as expected

### Communication

- [ ] Customer notification sent
- [ ] Status page updated
- [ ] Team debriefing scheduled
- [ ] Post-deployment report generated

---

## Rollback Procedures

### When to Rollback

Immediate rollback is required if:
- WalletConnect connections fail to initialize
- Critical transactions fail to process
- Security vulnerabilities are discovered
- Performance degrades significantly (>50%)
- Error rate exceeds 5%
- Critical services become unavailable

### Testnet Rollback

```bash
# Rollback to previous version
git revert <commit-hash>
git push origin develop

# This will automatically trigger CI/CD to deploy previous version
# Monitor: https://testnet.passportx.app
```

### Mainnet Staging Rollback

```bash
# Create rollback branch
git checkout -b rollback/mainnet-staging-$(date +%s)

# Revert to previous stable state
git revert <commit-hash>

# Push and request emergency approval
git push origin rollback/mainnet-staging-*

# Update main with rollback commit once approved
git checkout develop
git pull
git cherry-pick rollback/mainnet-staging-*/HEAD
git push origin develop
```

### Production Rollback

```bash
# CRITICAL: Execute only with approval from multiple leads

# 1. Pause ongoing deployments
gh workflow run cancel --name "Deploy"

# 2. Rollback to previous release
git tag -l | sort -V | tail -2
git checkout v<previous-version>
git checkout -b rollback/production-$(date +%s)

# 3. Force deploy to main
git push -f origin rollback/production-*/HEAD:main

# 4. Verify rollback success
# 5. Document incident and lessons learned
```

### Rollback Validation

After any rollback:

```bash
# Verify tests pass
npm run test

# Verify WalletConnect functionality
npm run test -- tests/integration/walletconnect.test.ts

# Verify application health
curl -s https://<environment>.passportx.app/health | jq .

# Monitor logs and metrics
# Check Slack for deployment notifications
```

---

## Monitoring and Validation

### Continuous Monitoring

**Dashboard Links:**
- Testnet: https://monitoring.passportx.app/testnet
- Mainnet Staging: https://monitoring.passportx.app/mainnet-staging
- Production: https://monitoring.passportx.app/production

**Key Metrics to Monitor:**
- WalletConnect connection success rate (target: >99%)
- Transaction signing latency (target: <2s)
- Error rate (target: <0.1%)
- Gas estimation accuracy (target: >98%)
- Network responsiveness (target: <200ms)

### Health Checks

```bash
# Testnet health check
curl -s https://testnet.passportx.app/health | jq .

# Mainnet staging health check
curl -s https://staging-mainnet.passportx.app/health | jq .

# Production health check
curl -s https://passportx.app/health | jq .
```

### Error Monitoring

Configure alerts for:
- [ ] WalletConnect connection failures
- [ ] Transaction signing failures
- [ ] RPC endpoint unavailability
- [ ] Configuration loading errors
- [ ] Security audit failures

### Performance Validation

```bash
# Run performance tests
npm run test:performance

# Validate gas estimation
npm run test:gas-estimation

# Load testing
npm run test:load
```

### User Validation

- [ ] Request feedback from beta users (testnet)
- [ ] Monitor user transaction success rates
- [ ] Track user-reported issues
- [ ] Validate WalletConnect UX
- [ ] Check wallet compatibility

---

## Sign-Off

**Deployment Date:** _______________

**Deployed By:** _______________

**Approved By (Security):** _______________

**Approved By (Engineering):** _______________

**Approved By (Operations):** _______________

**Notes:** _____________________________________________________________

---

## References

- [WalletConnect Documentation](https://docs.walletconnect.com)
- [GitHub Actions CI/CD Workflows](.github/workflows/)
- [WalletConnect Configuration](./config/)
- [Testing Guide](./TESTING.md)
- [Security Policy](./SECURITY.md)

---

**Last Updated:** 2024-12-23  
**Version:** 1.0.0  
**Status:** Active
