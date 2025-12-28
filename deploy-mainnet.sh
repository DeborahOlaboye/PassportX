#!/bin/bash

# Mainnet Deployment Script for Badge Verification
set -e

echo "🚀 PassportX Badge Verification - Mainnet Deployment"
echo "======================================================"
echo ""

# Navigate to project directory
cd "/Users/mac/Documents/DEBY/Personal Projects/PassportX"

# Check balance (requires stacks-cli or similar)
echo "📊 Deployment Plan:"
echo "  - 9 contracts to deploy"
echo "  - Total cost: ~0.235 STX"
echo "  - Network: Mainnet"
echo "  - Deployer: SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0"
echo ""

# Deploy using Clarinet
echo "🔧 Deploying contracts..."
export CLARINET_MODE_CI=1

clarinet deployments apply \
  --mainnet \
  --manifest-path contracts/Clarinet.toml

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Verify contracts on Stacks Explorer"
echo "  2. Update backend environment variables"
echo "  3. Test verification endpoints"
echo "  4. Monitor for 24 hours"
echo ""
echo "🔗 Stacks Explorer:"
echo "  https://explorer.stacks.co/address/SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0?chain=mainnet"
echo ""
