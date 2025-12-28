# Changelog

All notable changes to the @passportx/sdk package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-14

### Added
- Initial release of PassportX JavaScript/TypeScript SDK
- `PassportX` client class for interacting with PassportX API
- Comprehensive TypeScript type definitions
- `getUserBadges()` - Get all badges for a user
- `getBadge()` - Get detailed badge information
- `getBadgeMetadata()` - Get badge metadata
- `getCommunity()` - Get community information
- `getCommunityBadges()` - Get badge templates for a community
- `getCommunityMembers()` - Get community members with pagination
- `listCommunities()` - List all public communities
- `getCommunityAnalytics()` - Get community analytics
- `getCommunityLeaderboard()` - Get top badge earners
- `verifyBadge()` - Verify badge existence
- Full error handling with `PassportXError` class
- Support for filtering and pagination
- Complete documentation and usage examples
- Unit tests with >80% coverage

### Features
- TypeScript support with full type definitions
- Axios-based HTTP client with interceptors
- Configurable API endpoint and network
- Optional API key authentication
- Request timeout configuration
- Comprehensive error handling
- Browser and Node.js compatibility

## [Unreleased]

### Planned
- React hooks for easy integration
- Vue.js composables
- Badge verification on Stacks blockchain
- Webhook support for real-time updates
- Batch operations support
- Caching layer for improved performance
