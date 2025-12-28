/**
 * Basic Usage Example
 *
 * This example demonstrates the basic usage of the PassportX SDK
 */

import { PassportX } from '../src';

async function main() {
  // Initialize the client
  const client = new PassportX({
    apiUrl: 'https://api.passportx.app',
    network: 'mainnet'
  });

  // Example Stacks address
  const userAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

  console.log('PassportX SDK - Basic Usage Example\n');

  // 1. Get user badges
  console.log('1. Fetching user badges...');
  const badges = await client.getUserBadges(userAddress);
  console.log(`   Found ${badges.length} badges`);

  if (badges.length > 0) {
    const firstBadge = badges[0];
    console.log(`   Latest badge: ${firstBadge.template.name}`);
    console.log(`   Category: ${firstBadge.metadata.category}`);
    console.log(`   Level: ${firstBadge.metadata.level}`);
  }

  // 2. Get filtered badges
  console.log('\n2. Fetching achievement badges only...');
  const achievements = await client.getUserBadges(userAddress, {
    category: 'achievement',
    limit: 5
  });
  console.log(`   Found ${achievements.length} achievement badges`);

  // 3. List public communities
  console.log('\n3. Listing public communities...');
  const communities = await client.listCommunities({ limit: 3 });
  console.log(`   Total communities: ${communities.pagination.total}`);

  communities.data.forEach((community, index) => {
    console.log(`   ${index + 1}. ${community.name} (${community.memberCount} members)`);
  });

  // 4. Get community information
  if (communities.data.length > 0) {
    const firstCommunity = communities.data[0];
    console.log(`\n4. Getting details for "${firstCommunity.name}"...`);

    const community = await client.getCommunity(firstCommunity.id);
    console.log(`   Description: ${community.description}`);
    console.log(`   Tags: ${community.tags.join(', ')}`);

    // Get community badges
    const templates = await client.getCommunityBadges(community.id);
    console.log(`   Badge templates: ${templates.length}`);

    templates.slice(0, 3).forEach((template, index) => {
      console.log(`     ${index + 1}. ${template.icon} ${template.name} (Level ${template.level})`);
    });
  }

  console.log('\n✓ Example completed successfully!');
}

// Run the example
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
