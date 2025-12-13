# PassportX Smart Contract Deployment Guide

## Contract Overview

The PassportX system consists of 9 smart contracts (7 core contracts + 2 trait contracts):

### Core Contracts
1. **passport-nft.clar** - SIP-12 compliant non-transferable NFT
2. **badge-metadata.clar** - Typed maps for badge metadata storage
3. **badge-issuer.clar** - Badge creation and minting functionality
4. **badge-reader.clar** - Badge lookup and reading functionality
5. **community-manager.clar** - Community management and organization
6. **access-control.clar** - Comprehensive permission system
7. **passport-core.clar** - Main integration contract

### Trait Contracts
8. **badge-issuer-trait.clar** - Interface definition for badge issuance
9. **badge-reader-trait.clar** - Interface definition for badge reading

## Deployment Order

Deploy contracts in this order due to dependencies:

1. passport-nft
2. badge-metadata
3. access-control
4. community-manager
5. badge-issuer
6. badge-reader
7. passport-core

## Testing

Run tests with:
```bash
clarinet test
```

## Testnet Deployment

```bash
clarinet deployments generate --testnet --medium-cost
clarinet deployments apply --testnet
```

## Mainnet Deployment ✅ DEPLOYED

**Status:** Successfully deployed to Stacks Mainnet on December 13, 2025

### Deployment Commands

```bash
# Generate mainnet deployment plan
clarinet deployments generate --mainnet --medium-cost

# Deploy to mainnet
clarinet deployments apply --mainnet --no-dashboard
```

### Deployed Contract Addresses

All contracts deployed under: `SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0`

| Contract | Transaction Hash |
|----------|-----------------|
| access-control | `b22729ce59d5c78d3fe469d425282fe0b38275979c5e681d80c4cdbf4a0d4b33` |
| badge-issuer-trait | `3eef42540f0f2dfb75279cfeb0a334219f96f113dc1669cc7f2c7b6a8afa53d1` |
| badge-metadata | `9bab88a536fd093d885b103109d3e80e56dad2ce44c4f0c0abc73ec90db19e5d` |
| passport-nft | `78076cad20931ceabb83b68d68131b2f29500f9d0e6593efb8943c17cd5bcde5` |
| badge-issuer | `53185097d7181fd4b3119e4f215123e7bbd97000e491f92561543ee8d236a74b` |
| badge-reader-trait | `1a076b0897be40e1e2594faab4a8d4db4ff332bacc06fdd9e54fed86104df9e0` |
| badge-reader | `63b4d91a4907fbf00cabeebe4c8837e23764092692b511dccc4146d868b72c9e` |
| community-manager | `92693aa94c6d0022bacc42fb4cf6fca21a2267e899c6b84ade0c8565ded4d764` |
| passport-core | `70409884e55488f587065571008bdd9cdb5776cc9ddc9197b88354e2bdccaea4` |

### Deployment Cost

- **Total Cost:** 0.221070 STX
- **Network:** Stacks Mainnet
- **Clarity Version:** 2.5

### Verify Deployment

View contracts on Stacks Explorer:
https://explorer.hiro.so/address/SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0?chain=mainnet