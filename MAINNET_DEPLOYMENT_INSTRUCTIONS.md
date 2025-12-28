# Mainnet Deployment Instructions - Badge Verification Feature

## Contract Fixed and Ready for Deployment

The `badge-reader` contract has been updated with verification functions and all syntax errors have been resolved.

### ✅ Pre-Deployment Validation Complete

- ✔ Contract syntax validated (`clarinet check` passed)
- ✔ 9 contracts checked successfully
- ✔ Verification functions added and tested
- ✔ Deployment plan generated
- ✔ Cost estimates calculated

### 📊 Deployment Costs

**Total Estimated Cost: ~13.54 STX (medium-cost strategy)**

Individual contract costs:
- access-control: 1.505 STX
- badge-issuer-trait: 1.504 STX
- badge-metadata: 1.504 STX
- passport-nft: 1.504 STX
- badge-issuer: 1.505 STX
- badge-reader-trait: 1.504 STX
- **badge-reader: 1.505 STX** (includes new verification functions)
- community-manager: 1.505 STX
- passport-core: 1.504 STX

### 🚀 Deployment Commands

#### Step 1: Ensure You Have STX in Deployer Wallet

The deployer address is: `SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0`

Ensure this wallet has at least **15 STX** for deployment fees.

#### Step 2: Generate Final Deployment Plan

```bash
cd /Users/mac/Documents/DEBY/Personal\ Projects/PassportX
clarinet deployments generate --mainnet --medium-cost --manifest-path contracts/Clarinet.toml
```

When prompted "Overwrite? [Y/n]", type `Y` and press Enter.

#### Step 3: Review Deployment Plan

```bash
cat deployments/default.mainnet-plan.yaml
```

Verify all contracts are listed and costs are acceptable.

#### Step 4: Deploy to Mainnet

```bash
# This will deploy all contracts to Stacks mainnet
clarinet deployments apply --mainnet --manifest-path contracts/Clarinet.toml
```

**IMPORTANT**:
- When prompted "Overwrite? [Y/n]", type `Y`
- Clarinet will broadcast transactions to mainnet
- Keep the terminal open until deployment completes
- Save all transaction IDs for verification

#### Step 5: Monitor Deployment

Watch transactions on Stacks Explorer:
```
https://explorer.stacks.co/address/SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0?chain=mainnet
```

Each contract deployment will show as a separate transaction.

#### Step 6: Verify Deployment

After confirmation (10-30 minutes), verify the badge-reader contract:

```bash
# Check if contract is deployed
curl https://api.hiro.so/v2/contracts/interface/SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0/badge-reader
```

### 📝 Post-Deployment Tasks

#### 1. Update Environment Variables

Edit `.env.production`:

```env
STACKS_NETWORK=mainnet

# Update with actual deployed addresses
MAINNET_BADGE_READER_ADDRESS=SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0
MAINNET_BADGE_ISSUER_ADDRESS=SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0
MAINNET_BADGE_METADATA_ADDRESS=SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0
MAINNET_PASSPORT_NFT_ADDRESS=SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0
MAINNET_PASSPORT_CORE_ADDRESS=SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0
MAINNET_COMMUNITY_MANAGER_ADDRESS=SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0
MAINNET_ACCESS_CONTROL_ADDRESS=SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0
```

#### 2. Restart Backend Services

```bash
cd backend
npm run build
pm2 restart passportx-api
```

#### 3. Test Verification Endpoints

```bash
# Test verification API
curl -X POST https://api.passportx.io/api/verify/badge \
  -H "Content-Type: application/json" \
  -d '{"badgeId": "test-badge-id"}'
```

#### 4. Monitor for 24 Hours

- Check API error rates
- Monitor Sentry for exceptions
- Watch Stacks Explorer for contract activity
- Collect user feedback

### 🔍 Verification Functions Deployed

The following new read-only functions will be available on mainnet:

1. **verify-badge-ownership** `(badge-id: uint, claimed-owner: principal)`
   - Returns: `(ok bool)` - true if ownership verified

2. **verify-badge-authenticity** `(badge-id: uint)`
   - Returns: `(ok {exists: bool, active: bool, issuer: principal, timestamp: uint})`

3. **get-verification-status** `(badge-id: uint)`
   - Returns: Complete verification info including owner, issuer, level, category

### 📊 Deployment Record

Fill in after deployment:

```yaml
deployment:
  date: _______________
  deployer: SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0
  network: mainnet

contracts:
  badge-reader:
    transaction_id: _______________
    block_height: _______________
    deployed_at: _______________
    explorer_url: https://explorer.stacks.co/txid/_______________

  # Repeat for all 9 contracts

total_cost_stx: _______________
deployment_duration: _______________
status: [ ] Success [ ] Failed
```

### ⚠️ Important Notes

1. **No Rollback**: Once deployed, contracts are immutable
2. **Test First**: Ensure all features work on testnet before mainnet
3. **Backup**: Keep deployment logs and transaction IDs
4. **Monitor**: Watch for errors in first 24-48 hours
5. **Support**: Have team ready to address issues

### 🆘 If Something Goes Wrong

1. **Don't Panic**: Contracts are immutable, can't be deleted
2. **Backend Fallback**: Update backend to use previous contract versions if needed
3. **Feature Flags**: Disable verification endpoints in backend
4. **Investigate**: Check logs, Stacks Explorer, and error tracking
5. **Fix Forward**: Deploy corrected version if critical issues found

### ✅ Success Criteria

- [ ] All 9 contracts deployed successfully
- [ ] Transactions confirmed on mainnet
- [ ] Verification functions callable
- [ ] API endpoints returning data
- [ ] Public verification page working
- [ ] No errors in monitoring for 24h
- [ ] User feedback positive

---

## Ready to Deploy!

All pre-flight checks complete. The badge-reader contract with verification functions is ready for mainnet deployment.

**Estimated deployment time**: 30-45 minutes
**Required funds**: ~15 STX
**Risk level**: Low (read-only functions, backward compatible)

Execute the deployment commands above when ready.
