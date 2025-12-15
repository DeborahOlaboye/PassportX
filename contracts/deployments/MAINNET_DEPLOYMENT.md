# Mainnet Deployment Guide - Badge Verification Feature

## ⚠️ CRITICAL - Mainnet Deployment Checklist

This guide covers deploying the updated `badge-reader` contract with verification functions to Stacks mainnet.

### Pre-Deployment Checklist

- [ ] **All tests passing**: Run `clarinet test` and ensure 100% pass rate
- [ ] **Code review completed**: Minimum 2 reviewers approved the changes
- [ ] **Testnet deployment successful**: Verified on testnet for at least 48 hours
- [ ] **Security audit**: External audit completed (if handling high-value badges)
- [ ] **Backup plan ready**: Documented rollback procedure
- [ ] **Monitoring setup**: Block explorer and error tracking configured
- [ ] **Team notification**: All team members aware of deployment window
- [ ] **Sufficient STX**: Deployer wallet has enough STX for deployment fees

### Deployment Steps

#### 1. Final Pre-Deployment Testing

```bash
# Run all contract tests
cd contracts
clarinet test

# Run integration tests
npm run test:integration

# Verify contract syntax
clarinet check
```

#### 2. Review Contract Changes

The following functions are being added to `badge-reader.clar`:

- `verify-badge-ownership(badge-id: uint, claimed-owner: principal)` - Verify badge ownership
- `verify-badge-authenticity(badge-id: uint)` - Check if badge is authentic and active
- `get-verification-status(badge-id: uint)` - Get complete verification info

**Impact Analysis:**
- ✅ Backward compatible: All existing functions remain unchanged
- ✅ Read-only functions: No state modifications, zero gas cost for users
- ✅ No breaking changes: Existing integrations will continue to work
- ✅ No data migration needed: Works with existing badge data

#### 3. Prepare Mainnet Environment

```bash
# Ensure you're using mainnet settings
export NETWORK=mainnet
export STACKS_NETWORK=mainnet

# Verify deployer wallet
# The wallet should have:
# - At least 5 STX for deployment fees
# - Backup of private key/mnemonic in secure location
```

#### 4. Deploy to Mainnet

```bash
# Option A: Using deployment script (Recommended)
./scripts/deploy-verification-contracts.sh mainnet

# Option B: Manual deployment
cd contracts
clarinet deploy --mainnet
```

**During Deployment:**
- Monitor transaction status on Stacks Explorer
- Note the transaction ID for records
- Wait for confirmation (typically 10-30 minutes)

#### 5. Post-Deployment Verification

```bash
# Run verification script
npm run verify:deployment

# Manual verification checklist:
# 1. Contract appears on Stacks Explorer
# 2. All functions are callable
# 3. Existing badges still accessible
# 4. New verification functions return expected data
```

#### 6. Update Backend Configuration

Update the backend to use the new mainnet contract address:

```typescript
// backend/src/config/contracts.ts
export const CONTRACTS = {
  BADGE_READER: {
    address: 'SP...', // New mainnet address
    name: 'badge-reader'
  }
}
```

#### 7. Integration Testing

```bash
# Test verification endpoints
curl -X POST https://api.passportx.io/api/verify/badge \
  -H "Content-Type: application/json" \
  -d '{"badgeId": "actual-badge-id"}'

# Test public verification page
# Visit: https://passportx.io/verify/[badge-id]
```

### Deployment Timeline

**Total estimated time: 2-3 hours**

| Phase | Duration | Description |
|-------|----------|-------------|
| Pre-checks | 30 min | Final testing and validation |
| Deployment | 30-45 min | Contract deployment and confirmation |
| Verification | 30 min | Post-deployment checks |
| Backend update | 15 min | Update configuration |
| Monitoring | 60 min | Watch for any issues |

### Rollback Procedure

If issues are detected:

1. **DO NOT** delete or modify the deployed contract (immutable)
2. Update backend to point to previous contract version
3. Disable new verification endpoints temporarily
4. Investigate and fix issues on testnet
5. Redeploy after fixes verified

### Monitoring After Deployment

Monitor for 24-48 hours:

- [ ] Contract function calls in Stacks Explorer
- [ ] API error rates for verification endpoints
- [ ] User feedback on verification features
- [ ] Gas costs for contract calls (should be 0 for read-only)

### Contract Addresses

Record the deployed contract addresses:

```toml
[mainnet.contracts]
badge-reader = "SP..." # Update after deployment
deployer = "SP..." # Deployer address
deployment-tx = "0x..." # Transaction ID
deployment-block = 0 # Block number
deployment-date = "YYYY-MM-DD HH:MM:SS UTC"
```

### Emergency Contacts

- **Lead Developer**: [Contact info]
- **DevOps**: [Contact info]
- **Security Team**: [Contact info]

### Cost Estimate

Expected deployment costs:
- Contract deployment: ~0.5-1.5 STX
- Transaction fees: ~0.1-0.5 STX
- **Total**: ~1-2 STX

### Success Criteria

Deployment is successful when:

1. ✅ Contract deployed and confirmed on mainnet
2. ✅ All verification functions callable
3. ✅ Existing functionality unchanged
4. ✅ Backend integration working
5. ✅ Public verification page accessible
6. ✅ No errors in monitoring for 24 hours

### Documentation Updates

After successful deployment:

- [ ] Update API documentation with new endpoints
- [ ] Add mainnet contract address to README
- [ ] Update deployment history log
- [ ] Create user guide for verification features
- [ ] Update SDK/client libraries if applicable

### Mainnet-Specific Notes

1. **Immutability**: Once deployed, the contract cannot be modified
2. **Testing**: Triple-check everything - no do-overs
3. **Fees**: Actual STX will be spent - ensure sufficient balance
4. **Time**: Mainnet confirmations are slower than testnet
5. **Visibility**: Deployment is public and permanent

### Support Resources

- Stacks Documentation: https://docs.stacks.co
- Clarinet Docs: https://docs.hiro.so/clarinet
- Stacks Explorer: https://explorer.stacks.co
- Community Discord: [Link]

---

## Post-Deployment Report Template

```markdown
# Badge Verification Contract Deployment - Mainnet

**Date**: YYYY-MM-DD
**Deployer**: [Address]
**Network**: Mainnet

## Contract Details
- Name: badge-reader
- Version: 2.0.0
- Transaction: [TX ID]
- Block: [Block Number]
- Contract Address: [Address]

## Deployment Summary
- Start Time: [Time]
- End Time: [Time]
- Duration: [Duration]
- Status: ✅ Success / ❌ Failed

## Verification Results
- Function Tests: ✅ All Passed
- Integration Tests: ✅ All Passed
- Backward Compatibility: ✅ Verified

## Issues Encountered
[List any issues and resolutions]

## Team Sign-off
- Developer: [Name]
- Reviewer: [Name]
- DevOps: [Name]
```
