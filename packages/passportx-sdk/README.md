# @passportx/sdk

Official JavaScript/TypeScript SDK for PassportX - Achievement badges on the Stacks blockchain.

[![npm version](https://img.shields.io/npm/v/@passportx/sdk.svg)](https://www.npmjs.com/package/@passportx/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Features

- 🎯 **Type-safe**: Full TypeScript support with comprehensive type definitions
- 🚀 **Easy to use**: Simple, intuitive API
- 📦 **Lightweight**: Minimal dependencies
- 🔒 **Secure**: Built-in error handling and validation
- 🌐 **Universal**: Works in Node.js and browsers
- ⚡ **Modern**: Uses async/await and promises

## Installation

```bash
npm install @passportx/sdk
```

```bash
yarn add @passportx/sdk
```

```bash
pnpm add @passportx/sdk
```

## Quick Start

```typescript
import { PassportX } from '@passportx/sdk';

// Initialize the SDK
const client = new PassportX({
  apiUrl: 'https://api.passportx.app',
  network: 'mainnet'
});

// Get user badges
const badges = await client.getUserBadges('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

console.log(`User has ${badges.length} badges`);
badges.forEach(badge => {
  console.log(`${badge.template.icon} ${badge.template.name}`);
});
```

## Usage Examples

### Initialize the Client

```typescript
import { PassportX } from '@passportx/sdk';

// With default configuration (mainnet)
const client = new PassportX();

// With custom configuration
const client = new PassportX({
  apiUrl: 'https://api.passportx.app',
  network: 'testnet',
  timeout: 15000
});

// With API key for authenticated requests
const client = new PassportX({
  apiKey: 'your-api-key-here'
});
```

### Get User Badges

```typescript
// Get all badges for a user
const badges = await client.getUserBadges('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

// With filtering and pagination
const badges = await client.getUserBadges(
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  {
    category: 'achievement',
    level: 3,
    limit: 10,
    offset: 0
  }
);

// Process badges
badges.forEach(badge => {
  console.log(`Badge: ${badge.template.name}`);
  console.log(`Level: ${badge.metadata.level}`);
  console.log(`Category: ${badge.metadata.category}`);
  console.log(`Issued: ${badge.issuedAt}`);
});
```

### Get Badge Information

```typescript
// Get a specific badge
const badge = await client.getBadge('badge_id_123');

console.log(`Name: ${badge.template.name}`);
console.log(`Description: ${badge.template.description}`);
console.log(`Owner: ${badge.owner}`);
console.log(`Issuer: ${badge.issuer}`);

// Get just the metadata
const metadata = await client.getBadgeMetadata('badge_id_123');
console.log(`Level ${metadata.level} ${metadata.category} badge`);

// Verify a badge exists
const isValid = await client.verifyBadge('badge_id_123');
if (isValid) {
  console.log('Badge is valid');
}
```

### Work with Communities

```typescript
// Get community information
const community = await client.getCommunity('passportx-community');

console.log(`Name: ${community.name}`);
console.log(`Members: ${community.memberCount}`);
console.log(`Description: ${community.description}`);

// Get all badge templates in a community
const templates = await client.getCommunityBadges('community_id');

templates.forEach(template => {
  console.log(`${template.icon} ${template.name} (Level ${template.level})`);
  console.log(`Requirements: ${template.requirements}`);
});

// Get community members
const members = await client.getCommunityMembers('community_id', { limit: 20 });

console.log(`Total members: ${members.pagination.total}`);
members.data.forEach(member => {
  console.log(`${member.name}: ${member.badgeCount} badges`);
});

// Get community leaderboard
const leaderboard = await client.getCommunityLeaderboard('community_id', 10);

leaderboard.forEach((user, index) => {
  console.log(`#${index + 1}: ${user.name} - ${user.badgeCount} badges`);
});

// Get community analytics
const analytics = await client.getCommunityAnalytics('community_id');

console.log(`Total members: ${analytics.totalMembers}`);
console.log(`Total badges issued: ${analytics.totalIssuedBadges}`);
console.log(`Badge templates: ${analytics.totalBadgeTemplates}`);
```

### List Communities

```typescript
// Get all public communities
const communities = await client.listCommunities({ limit: 10 });

communities.data.forEach(community => {
  console.log(`${community.name} - ${community.memberCount} members`);
});

// Search communities
const results = await client.listCommunities({
  search: 'developer',
  tags: ['tech', 'programming'],
  limit: 20
});

// Check if there are more results
if (results.pagination.hasMore) {
  const nextPage = await client.listCommunities({
    search: 'developer',
    offset: results.pagination.offset + results.pagination.limit
  });
}
```

### Error Handling

```typescript
import { PassportX, PassportXError } from '@passportx/sdk';

const client = new PassportX();

try {
  const badge = await client.getBadge('invalid_id');
} catch (error) {
  if (error instanceof PassportXError) {
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(`Status: ${error.statusCode}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## API Reference

### PassportX Client

#### Constructor

```typescript
new PassportX(config?: PassportXConfig)
```

**Parameters:**
- `config` (optional): Configuration object
  - `apiUrl`: Base URL for the API (default: 'https://api.passportx.app')
  - `network`: Stacks network ('mainnet' | 'testnet' | 'devnet')
  - `apiKey`: Optional API key for authenticated requests
  - `timeout`: Request timeout in milliseconds (default: 10000)

#### Methods

##### getUserBadges
```typescript
getUserBadges(address: string, options?: BadgeQueryOptions): Promise<BadgeWithTemplate[]>
```
Get all badges for a specific user address.

##### getBadge
```typescript
getBadge(badgeId: string): Promise<BadgeWithTemplate>
```
Get detailed information about a specific badge.

##### getBadgeMetadata
```typescript
getBadgeMetadata(badgeId: string): Promise<BadgeMetadata>
```
Get metadata for a specific badge.

##### getCommunity
```typescript
getCommunity(idOrSlug: string): Promise<Community>
```
Get information about a community by ID or slug.

##### getCommunityBadges
```typescript
getCommunityBadges(communityId: string): Promise<BadgeTemplate[]>
```
Get all badge templates for a community.

##### getCommunityMembers
```typescript
getCommunityMembers(communityId: string, options?: QueryOptions): Promise<PaginatedResponse<any>>
```
Get community members with pagination.

##### listCommunities
```typescript
listCommunities(options?: QueryOptions): Promise<PaginatedResponse<Community>>
```
List all public communities.

##### getCommunityAnalytics
```typescript
getCommunityAnalytics(communityId: string): Promise<any>
```
Get analytics data for a community.

##### getCommunityLeaderboard
```typescript
getCommunityLeaderboard(communityId: string, limit?: number): Promise<any[]>
```
Get the top badge earners in a community.

##### verifyBadge
```typescript
verifyBadge(badgeId: string): Promise<boolean>
```
Verify if a badge exists and is valid.

## TypeScript Support

The SDK is written in TypeScript and includes comprehensive type definitions. All types are exported for your convenience:

```typescript
import {
  PassportX,
  Badge,
  BadgeTemplate,
  Community,
  BadgeCategory,
  PassportXError,
  // ... and more
} from '@passportx/sdk';
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT © PassportX Team

## Links

- [Documentation](https://docs.passportx.app)
- [GitHub](https://github.com/DeborahOlaboye/PassportX)
- [npm Package](https://www.npmjs.com/package/@passportx/sdk)
- [Issues](https://github.com/DeborahOlaboye/PassportX/issues)

## Support

If you have questions or need help, please:
- Check the [documentation](https://docs.passportx.app)
- Open an [issue](https://github.com/DeborahOlaboye/PassportX/issues)
- Join our community discussions
