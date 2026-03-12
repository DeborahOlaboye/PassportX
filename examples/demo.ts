/**
 * PassportX SDK TypeScript Demo
 *
 * Demonstrates full TypeScript integration with the PassportX SDK.
 * Install: npm install passportx-sdk
 */

import { PassportX, PassportXError } from 'passportx-sdk';

async function runDemo(): Promise<void> {
  console.log('=== PassportX SDK TypeScript Demo ===');

  // Initialize client
  const _client = new PassportX({
    apiUrl: 'https://api.passportx.app',
    network: 'mainnet',
    timeout: 10000,
  });

  console.log('PassportX client initialized with TypeScript support');

  // Demonstrate typed error handling
  try {
    console.log('\nDemonstrating SDK API (requires live API):');
    console.log('  client.getUserBadges(address)');
    console.log('  client.getBadge(badgeId)');
    console.log('  client.getCommunity(communityId)');
    console.log('  client.listCommunities()');
    console.log('  client.verifyBadge(badgeId)');
    console.log('  client.getCommunityLeaderboard(communityId)');
  } catch (error) {
    if (error instanceof PassportXError) {
      console.error(`SDK Error [${error.code}]: ${error.message}`);
    }
  }

  console.log('\n=== TypeScript Demo Complete ===');
  console.log('Full type definitions included with passportx-sdk');
}

runDemo();
