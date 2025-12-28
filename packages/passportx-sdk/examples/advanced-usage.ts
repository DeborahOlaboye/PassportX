/**
 * Advanced Usage Example
 *
 * This example demonstrates advanced features of the PassportX SDK
 */

import { PassportX, PassportXError } from '../src';

async function main() {
  const client = new PassportX({
    apiUrl: 'https://api.passportx.app',
    network: 'mainnet',
    timeout: 15000
  });

  console.log('PassportX SDK - Advanced Usage Example\n');

  // 1. Error handling
  console.log('1. Testing error handling...');
  try {
    await client.getBadge('invalid-badge-id');
  } catch (error) {
    if (error instanceof PassportXError) {
      console.log(`   ✓ Caught expected error: ${error.message}`);
      console.log(`     Status code: ${error.statusCode}`);
    }
  }

  // 2. Badge verification
  console.log('\n2. Verifying badge existence...');
  const validBadgeId = 'some-badge-id'; // Replace with actual ID
  const isValid = await client.verifyBadge(validBadgeId);
  console.log(`   Badge ${validBadgeId} is ${isValid ? 'valid' : 'invalid'}`);

  // 3. Community analytics
  console.log('\n3. Getting community analytics...');
  const communities = await client.listCommunities({ limit: 1 });

  if (communities.data.length > 0) {
    const communityId = communities.data[0].id;
    const analytics = await client.getCommunityAnalytics(communityId);

    console.log('   Analytics:');
    console.log(`     Total members: ${analytics.totalMembers}`);
    console.log(`     Total badges issued: ${analytics.totalIssuedBadges}`);
    console.log(`     Badge templates: ${analytics.totalBadgeTemplates}`);
    console.log(`     Average badges per member: ${analytics.averageBadgesPerMember.toFixed(2)}`);
  }

  // 4. Community leaderboard
  console.log('\n4. Getting community leaderboard...');
  if (communities.data.length > 0) {
    const communityId = communities.data[0].id;
    const leaderboard = await client.getCommunityLeaderboard(communityId, 5);

    console.log('   Top 5 badge earners:');
    leaderboard.forEach((user, index) => {
      console.log(`     ${index + 1}. ${user.name || user.stacksAddress.slice(0, 10) + '...'}: ${user.badgeCount} badges`);
    });
  }

  // 5. Pagination example
  console.log('\n5. Demonstrating pagination...');
  const userAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

  // Get first page
  const page1 = await client.getUserBadges(userAddress, {
    limit: 5,
    offset: 0
  });
  console.log(`   Page 1: ${page1.length} badges`);

  // Get second page
  const page2 = await client.getUserBadges(userAddress, {
    limit: 5,
    offset: 5
  });
  console.log(`   Page 2: ${page2.length} badges`);

  // 6. Search communities
  console.log('\n6. Searching communities...');
  const searchResults = await client.listCommunities({
    search: 'developer',
    limit: 3
  });
  console.log(`   Found ${searchResults.pagination.total} communities matching "developer"`);

  searchResults.data.forEach((community, index) => {
    console.log(`     ${index + 1}. ${community.name}`);
  });

  // 7. Get badge template details
  console.log('\n7. Getting badge template details...');
  if (communities.data.length > 0) {
    const communityId = communities.data[0].id;
    const templates = await client.getCommunityBadges(communityId);

    if (templates.length > 0) {
      const template = templates[0];
      console.log(`   Template: ${template.name}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Level: ${template.level}`);
      console.log(`   Requirements: ${template.requirements || 'None specified'}`);
      console.log(`   Creator: ${template.creator}`);
    }
  }

  console.log('\n✓ Advanced example completed successfully!');
}

// Run the example
main().catch(error => {
  console.error('Error:', error.message);
  if (error instanceof PassportXError) {
    console.error('Error details:', {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details
    });
  }
  process.exit(1);
});
