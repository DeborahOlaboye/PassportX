# PassportX Smart Contract Deployment Guide

## Contract Overview

The PassportX system consists of 7 core smart contracts:

1. **passport-nft.clar** - SIP-12 compliant non-transferable NFT
2. **badge-metadata.clar** - Typed maps for badge metadata storage
3. **badge-issuer.clar** - Badge creation and minting functionality
4. **badge-reader.clar** - Badge lookup and reading functionality
5. **community-manager.clar** - Community management and organization
6. **access-control.clar** - Comprehensive permission system
7. **passport-core.clar** - Main integration contract

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
clarinet deploy --testnet
```