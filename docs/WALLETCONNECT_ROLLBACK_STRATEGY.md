# WalletConnect Rollback Strategy

This document outlines the comprehensive rollback procedures for WalletConnect deployments across all environments (testnet, mainnet staging, and production).

## Table of Contents

1. [Rollback Decision Criteria](#rollback-decision-criteria)
2. [Automated Rollback Procedures](#automated-rollback-procedures)
3. [Manual Rollback Procedures](#manual-rollback-procedures)
4. [Environment-Specific Strategies](#environment-specific-strategies)
5. [Data Recovery](#data-recovery)
6. [Communication Protocol](#communication-protocol)
7. [Post-Rollback Validation](#post-rollback-validation)
8. [Incident Documentation](#incident-documentation)

---

## Rollback Decision Criteria

### Immediate Rollback Triggers

Rollback is **IMMEDIATE and MANDATORY** if any of the following occur:

1. **Critical Service Failure**
   - Application is completely inaccessible
   - Health check endpoint returns HTTP 5xx continuously
   - Database connectivity is lost

2. **WalletConnect Connection Failures**
   - Connection success rate falls below 50% for 5+ minutes
   - Session establishment failing for >10% of requests
   - Transaction signing functionality unavailable

3. **Security Breaches**
   - Unauthorized access detected
   - Private keys or secrets exposed
   - Security audit failures
   - Suspicious activity patterns detected

4. **Data Integrity Issues**
   - Database corruption detected
   - Data loss or inconsistency
   - Transaction state corruption
   - Backup/restore failures

5. **Performance Degradation**
   - Response time exceeds 10 seconds (P99)
   - Error rate exceeds 5%
   - Memory usage exceeds 90%
   - CPU usage sustained above 95%

### High-Priority Rollback Triggers

Rollback should be **CONSIDERED** if:

1. Critical bugs affecting >10% of users
2. Network connectivity issues to critical infrastructure
3. Configuration errors preventing normal operations
4. Gas estimation failures affecting transactions
5. Wallet compatibility issues with major providers

### Monitored Metrics

The following metrics are continuously monitored:

```yaml
walletconnect_metrics:
  connection_success_rate: threshold_90%
  transaction_signing_rate: threshold_95%
  error_rate: threshold_1%
  response_time_p99: threshold_2000ms
  database_health: required_healthy
  security_status: required_clean
  disk_usage: warning_80% critical_90%
  memory_usage: warning_85% critical_95%
```

---

## Automated Rollback Procedures

### Automated Rollback Triggers

Certain conditions trigger automatic rollback:

```yaml
automated_rollback:
  enabled: true
  triggers:
    - condition: "error_rate > 10% for 5m"
      action: "automatic_rollback"
    - condition: "health_check_failures > 3"
      action: "automatic_rollback"
    - condition: "security_audit_failed"
      action: "automatic_rollback"
    - condition: "database_unavailable"
      action: "automatic_rollback"
```

### Auto-Rollback Workflow

```
Detection → Alert → Validation → Execution → Verification
   ↓          ↓         ↓          ↓           ↓
  1m        2min      1min       5min       5min
```

### Implementation

The rollback is implemented via GitHub Actions:

```yaml
- name: Check deployment health
  run: |
    curl -s https://<environment>.passportx.app/health | jq .
    if [ $? -ne 0 ]; then
      echo "Triggering automatic rollback..."
      git revert <latest-commit-hash>
      git push origin <branch>
    fi
```

---

## Manual Rollback Procedures

### Prerequisites for Manual Rollback

Before initiating manual rollback:

- [ ] Backup current state has been created
- [ ] Rollback point (previous commit/tag) has been identified
- [ ] Team lead approval obtained
- [ ] Security lead notified
- [ ] Incident ticket created
- [ ] Stakeholders notified

### Rollback Authorization Matrix

| Environment | Required Approvers | Time to Approve |
|-------------|-------------------|-----------------|
| Testnet | 1 Engineer | Immediate |
| Mainnet Staging | 2 Engineers + Security Lead | 15 minutes max |
| Production | 2 Engineers + Security + Ops Lead | 30 minutes max |

---

## Environment-Specific Strategies

### Testnet Rollback

**Risk Level:** Low  
**Users Affected:** Internal testers only  
**Recovery Time:** < 15 minutes  
**Data Loss Risk:** Minimal

#### Step-by-Step Process

```bash
# 1. Identify the commit to revert to
git log --oneline -n 10
# Output: 
# abc1234 (HEAD) feat: Add WalletConnect feature
# def5678 fix: Previous fix
# ghi9012 chore: Initial setup

# 2. Create rollback branch
git checkout -b rollback/testnet-$(date +%s)

# 3. Revert the problematic commit
git revert abc1234 --no-edit

# 4. Verify the revert
git log --oneline -n 2

# 5. Push rollback branch
git push origin rollback/testnet-*

# 6. Update develop branch
git checkout develop
git pull origin develop
git cherry-pick rollback/testnet-*/HEAD
git push origin develop

# 7. Verify deployment
curl -s https://testnet.passportx.app/health | jq .

# 8. Run validation tests
npm run validate:walletconnect testnet
```

**Expected Result:** Within 10 minutes, testnet should be back to previous stable state

### Mainnet Staging Rollback

**Risk Level:** Medium  
**Users Affected:** Beta testers and staging users  
**Recovery Time:** 20-30 minutes  
**Data Loss Risk:** Low

#### Step-by-Step Process

```bash
# 1. ALERT: Post incident in #walletconnect-incidents Slack channel
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 Mainnet Staging Rollback Initiated"}' \
  $SLACK_WEBHOOK_URL

# 2. Identify rollback point
git log --oneline --grep="WalletConnect" -n 5

# 3. Get approval from Security Lead
# Verify: Security audit completed and passed

# 4. Create rollback branch
git checkout -b rollback/mainnet-staging-$(date +%s)

# 5. Revert to stable version
ROLLBACK_COMMIT="abc1234"  # Last known stable commit
git revert HEAD..$ROLLBACK_COMMIT --no-edit

# 6. Update environment configuration
cp backups/walletconnect-mainnet-staging-*/env.backup .env.walletconnect.mainnet-staging

# 7. Deploy rollback version
./scripts/deploy-walletconnect.sh mainnet-staging

# 8. Verify deployment health
./scripts/validate-walletconnect-deployment.sh mainnet-staging

# 9. Run comprehensive tests
npm run test -- tests/integration/walletconnect.test.ts

# 10. Notify stakeholders
echo "Mainnet staging rollback completed. Resuming normal operations."
```

**Expected Result:** Mainnet staging back to previous stable state, all tests passing

### Production Rollback

**Risk Level:** CRITICAL  
**Users Affected:** All production users  
**Recovery Time:** < 5 minutes  
**Data Loss Risk:** Must be zero

#### Authorization Gate

Production rollback requires **IMMEDIATE** approval from:

- [x] Chief Technology Officer OR Engineering VP
- [x] Security Lead
- [x] Operations Lead
- [x] Product Manager

#### Step-by-Step Process

```bash
# CRITICAL: Execute only with documented approval

# 1. Declare SEV-1 Incident
# - Notify incident commander
# - Open war room
# - Document timeline
# - Assign roles

# 2. Create backup of current state
BACKUP_TIME=$(date +%s)
docker-compose exec passportx-db pg_dump -U postgres > backup-${BACKUP_TIME}.sql
redis-cli --rdb /data/dump-${BACKUP_TIME}.rdb
docker ps -a > containers-${BACKUP_TIME}.txt

# 3. Identify rollback target
# Find last known GOOD production deployment
git tag -l | sort -V | tail -5
# v1.5.0  v1.5.1  v1.5.2 (bad)  v1.5.3 (worse)
# → Rollback to v1.5.0

# 4. Disable new deployments
gh workflow run disable --name "Deploy"

# 5. Stop current deployment
docker-compose -f docker-compose.walletconnect.yml down

# 6. Restore from backup
ROLLBACK_TAG="v1.5.0"
git checkout $ROLLBACK_TAG
git checkout -b production-rollback-${BACKUP_TIME}

# 7. Restore database
# Verify backup integrity first
psql -U postgres < backup-${BACKUP_TIME}.sql || exit 1

# 8. Restore Redis cache
redis-cli SHUTDOWN
cp /data/dump-${BACKUP_TIME}.rdb /data/dump.rdb
redis-server /etc/redis/redis.conf

# 9. Deploy rollback version
docker-compose -f docker-compose.walletconnect.yml up -d

# 10. Immediate health checks
for i in {1..30}; do
    if curl -f https://passportx.app/health 2>/dev/null; then
        echo "✓ Production is healthy"
        break
    fi
    echo "⏳ Waiting for production to be ready... ($i/30)"
    sleep 2
done

# 11. Verify user transactions work
npm run test:smoke -- production

# 12. Enable deployments again
gh workflow run enable --name "Deploy"

# 13. Post-incident communication
echo "PRODUCTION ROLLBACK COMPLETED" | \
  tee incident-${BACKUP_TIME}.txt | \
  mail -s "Incident: Production Rollback" team@passportx.app

# 14. Schedule incident review meeting
calendar-invite "Post-Mortem: Production Incident" \
  --attendees "leadership, engineering" \
  --time "30 minutes after this message"
```

**Expected Result:** Production back online with zero data loss, all critical functions restored

---

## Data Recovery

### Database Recovery

**Testnet:** No critical data, can be reset  
**Mainnet Staging:** Point-in-time recovery to 1 hour before incident  
**Production:** Point-in-time recovery to 15 minutes before incident

### Recovery Procedures

```bash
# 1. List available backups
ls -lh backups/postgres-*.sql

# 2. Verify backup integrity
psql -U postgres < backups/postgres-latest.sql --dry-run

# 3. Restore from backup
psql -U postgres < backups/postgres-latest.sql

# 4. Verify data consistency
psql -U postgres -c "SELECT COUNT(*) FROM users;"
psql -U postgres -c "SELECT COUNT(*) FROM transactions;"

# 5. Check for corruption
psql -U postgres -c "REINDEX DATABASE walletconnect;"
```

### Cache Recovery

```bash
# 1. Restore Redis from backup
redis-cli --rdb /data/dump-recovery.rdb < backup-dump.rdb

# 2. Verify cache
redis-cli KEYS '*' | wc -l

# 3. Monitor cache memory
redis-cli INFO memory
```

---

## Communication Protocol

### Incident Communication Timeline

| Time | Action | Audience |
|------|--------|----------|
| T+0m | Post incident alert | Engineering, Security |
| T+1m | Trigger automatic rollback | All |
| T+2m | Notify customers | Support, Product |
| T+5m | First status update | All stakeholders |
| T+10m | Second status update | All stakeholders |
| T+End | Resolution announcement | All stakeholders |

### Notification Templates

**Incident Alert (Slack)**
```
🚨 INCIDENT: Production WalletConnect Deployment Failed
Severity: SEV-1
Affected: All users
Action: Initiating automatic rollback
ETA to resolution: 5 minutes
Follow updates in #incident-response
```

**Status Update**
```
📊 Status Update
Issue: WalletConnect connection failures detected
Impact: 15% of users experiencing issues
Action Taken: Automatic rollback to v1.5.0
Status: Rollback in progress
ETA: 3 minutes
```

**Resolution Announcement**
```
✅ RESOLVED: Production is back online
Incident Duration: 12 minutes
Root Cause: Gas estimation configuration error
Resolution: Reverted to previous stable version
Post-Mortem: Will be scheduled for tomorrow at 2 PM
```

---

## Post-Rollback Validation

### Automated Validation

```bash
#!/bin/bash

# Run comprehensive validation
./scripts/validate-walletconnect-deployment.sh $ENVIRONMENT

# Specific tests
npm run test -- tests/integration/walletconnect.test.ts
npm run test:e2e -- tests/e2e/walletconnect.cy.ts

# Performance tests
npm run test:performance

# Security tests
npm audit --audit-level=moderate
npm run test:security
```

### Manual Validation Checklist

- [ ] Application is accessible (curl test)
- [ ] WalletConnect connection works
- [ ] User can sign transactions
- [ ] User can sign messages
- [ ] Gas estimation works correctly
- [ ] Network switching functions
- [ ] Error handling is functioning
- [ ] Logs show no critical errors
- [ ] Performance metrics are normal
- [ ] Security audit passes
- [ ] Database is consistent
- [ ] Cache is functioning

### Monitoring Post-Rollback

```yaml
post_rollback_monitoring:
  duration: 4_hours
  metrics:
    - error_rate: target_below_0.1%
    - response_time_p99: target_below_2000ms
    - connection_success_rate: target_above_99%
    - transaction_success_rate: target_above_99%
  alerts:
    - if error_rate > 1% notify immediately
    - if health_check fails notify immediately
    - if security_audit fails notify immediately
```

---

## Incident Documentation

### Required Documentation After Rollback

1. **Incident Report**
   - Time of incident
   - Duration
   - Root cause
   - Impact analysis
   - Resolution taken

2. **Timeline**
   - Detection time
   - Alert time
   - Rollback initiation
   - Completion time

3. **Artifacts**
   - Backup files
   - Logs from incident period
   - Monitoring data
   - Error traces

4. **Post-Mortem Meeting**
   - Schedule within 24 hours
   - Review root cause
   - Identify preventive measures
   - Assign action items
   - Update runbooks

### Example Incident Report

```markdown
# Incident Report: WalletConnect Production Incident

## Summary
Transaction signing failures affected 15% of users for 12 minutes.

## Timeline
- 14:05 UTC - Error spike detected in monitoring
- 14:06 UTC - Incident declared
- 14:07 UTC - Automatic rollback initiated
- 14:12 UTC - Production restored
- 14:13 UTC - All-clear given

## Root Cause
Gas estimation configuration was incorrect in new deployment.

## Impact
- 15% of users unable to sign transactions
- 180 failed transactions during incident window
- No data loss

## Resolution
Reverted to v1.5.0 which had correct configuration.

## Prevention
- Add gas estimation validation to tests
- Add pre-deployment configuration check
- Increase monitoring sensitivity for error rates
```

---

## Rollback Runbook Quick Reference

### Testnet
```bash
git checkout -b rollback/testnet-$(date +%s)
git revert <commit-hash>
git push origin rollback/testnet-*
git checkout develop && git cherry-pick rollback/testnet-*/HEAD && git push
```

### Mainnet Staging
```bash
git checkout -b rollback/mainnet-staging-$(date +%s)
git revert <commit-hash>
./scripts/deploy-walletconnect.sh mainnet-staging
./scripts/validate-walletconnect-deployment.sh mainnet-staging
```

### Production
```bash
# Get approval first!
git checkout <stable-tag>
git checkout -b production-rollback-$(date +%s)
docker-compose down && docker-compose up -d
./scripts/validate-walletconnect-deployment.sh production
npm run test:smoke -- production
```

---

## Escalation Path

1. **Engineer** → Detects issue
2. **On-Call Engineer** → Assesses severity
3. **Team Lead** → Approves rollback
4. **CTO/VP Eng** → Approves production rollback
5. **CEO** → Notified of critical incidents

---

## References

- [WalletConnect Deployment Checklist](./WALLETCONNECT_DEPLOYMENT_CHECKLIST.md)
- [CI/CD Pipeline Configuration](.github/workflows/)
- [Monitoring and Alerting](./monitoring/)
- [Incident Response Procedure](./INCIDENT_RESPONSE.md)

---

**Last Updated:** 2024-12-23  
**Version:** 1.0.0  
**Status:** Active  
**Reviewed By:** Security & Engineering Leadership
