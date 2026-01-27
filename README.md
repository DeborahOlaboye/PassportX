````markdown
# 🌍 PassportX

**A portable, on-chain Achievement Passport built for communities, learners, and creators.  
Powered by Clarity 4 on Stacks.**

PassportX lets communities issue verifiable, user-owned achievement badges using SIP-12 NFTs and Clarity 4 typed maps. Users collect achievements across any community and showcase them in a single, beautiful passport.

---

## 🚀 Why PassportX?

Communities love recognizing their members — but achievements get stuck inside closed platforms (Discord, LMS tools, private apps). Users can’t carry their accomplishments across the web.

**PassportX fixes this.**  
Every community can issue structured, verifiable achievement badges that users permanently own.  
Users get a portable identity layer showing their growth, contribution, learning, and impact.

---

## ✨ Key Features

### 🔹 For Users

- A **portable Achievement Passport** you control
- Beautiful visual display of badges
- Public/private visibility control
- A personal share link for portfolios & applications
- Cross-community identity stitched together in one place

### 🔹 For Communities

- Create a community with custom theme & branding
- Issue badges with a single click
- Badge templates for easy reuse
- Typed metadata (level, category, date, skill)
- Revoke or replace badges when needed
- Zero blockchain complexity required

### 🔹 For Developers

- Clarity 4–powered badge contracts
- Strongly typed metadata via typed maps
- Simple JS SDK for reading user badges
- Public APIs that feed into dashboards or profiles

---

## 🏗️ Architecture Overview

### **Smart Contracts (Clarity 4)**

- **SIP-12 Non-Transferable NFTs**  
  Achievements are minted as soulbound NFTs (transfers disabled).
- **Typed Maps for Metadata**  
  Every badge stores structured metadata:
  ```clarity
  (define-map badge-metadata
    { id: uint }
    { level: uint, category: uint, timestamp: uint })
  ```
````

- **Traits**

  - `BadgeIssuer` — handles badge creation & minting
  - `BadgeReader` — exposes badge lookup for apps & dashboards

### **API + App**

- REST endpoints for Passport views
- Developer-facing badge lookup API
- Admin dashboard for communities
- User Passport UI with badge grid

---

## 🛠️ Environment Setup

### Prerequisites

- Node.js 18+
- MongoDB
- Stacks account (for contract deployment)

### Environment Variables

PassportX uses environment variables for configuration. The project includes a master `.env.example` file at the repository root that contains all available variables.

#### Quick Setup

1. **Copy the environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Fill in required variables:**

   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string for JWT signing
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - From WalletConnect dashboard
   - `NEXT_PUBLIC_APP_URL` - Your application's public URL

3. **Configure blockchain settings:**
   - Set `STACKS_NETWORK` to `devnet`, `testnet`, or `mainnet`
   - Update contract addresses based on your network

#### Required vs Optional Variables

**Required Variables** (application will fail to start without these):

- Database: `MONGODB_URI`
- Authentication: `JWT_SECRET`
- Application: `NODE_ENV`, `PORT`, `FRONTEND_URL`
- Blockchain: `STACKS_NETWORK`, `STACKS_API_URL`
- Frontend: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_APP_URL`

**Optional Variables** have sensible defaults and are not required for basic operation:

- Monitoring: `SENTRY_DSN`, `LOG_LEVEL`
- Chainhooks: Various `CHAINHOOK_*` variables
- Feature flags: `ENABLE_*` variables

#### Backend Validation

The backend automatically validates required environment variables at startup using `dotenv-safe`. If any required variable is missing, the application will fail fast with a clear error message listing the missing variables.

#### Environment-Specific Files

- **`.env.example`** - Master template with all variables (repository root)
- **`backend/.env.example`** - Backend-specific required variables
- **`.env.local.example`** - Frontend-specific variables

For development, copy `.env.example` to `.env` and modify as needed. For production deployments, ensure all required variables are set.

---

## 🧑‍💼 How It Works (Product Flow)

### 1. User Creates Passport

Signs in → Gets a clean passport → Joins communities.

### 2. Community Admin Creates Badge Templates

Community → “Create Badge” → Add name, description, level, metadata, icon.

### 3. Admin Issues Badges

Select a user → Select badge → Mint.
Instantly appears in the user’s Passport.

### 4. User Shares Passport

Public passport page → Shareable link → Embeds for websites or resumes.

### 5. Developers Integrate

Use the SDK to read:

- All badges for a user
- Metadata for each badge
- Community templates

---

## 🎨 Example Badge Types

- 🌱 _Beginner Skill Badge_
- 🎉 _Event Participation Badge_
- 🛠️ _Contributor Badge_
- ⭐ _Leadership Badge_
- 🧠 _Learning Milestone Badge_

All backed by typed metadata for structure & consistency.

---

## 🧪 API & SDK (Conceptual)

### JS SDK

```js
import { getUserBadges } from '@passportx/sdk';

const badges = await getUserBadges('ST123...');
console.log(badges);
```

### Badge Metadata Output (Example)

```json
{
  "badgeId": 4,
  "name": "Python Beginner",
  "community": "Open Code Guild",
  "metadata": {
    "level": 1,
    "category": "skill",
    "timestamp": 1234567890
  }
}
```

---

## 📚 API Documentation

PassportX provides comprehensive OpenAPI/Swagger documentation for all API endpoints.

### Accessing Swagger UI

The interactive API documentation is available at `/api/docs` when the backend is running.

```bash
# Start the backend server
npm run dev:backend

# Open Swagger UI in your browser
# http://localhost:3001/api/docs
```

### API Versioning

All API endpoints are versioned under `/api/v1/`. For example:

- Authentication: `/api/v1/auth/login`
- User profiles: `/api/v1/users/profile`
- Badges: `/api/v1/badges/templates`

### Generating Frontend Types

Use `openapi-typescript` to generate TypeScript types from the OpenAPI spec:

```bash
# Generate types from the OpenAPI spec
npx openapi-typescript http://localhost:3001/api/docs-json --output src/types/api.ts
```

This creates strongly-typed interfaces for all API responses and request bodies.

### Updating API Documentation

API documentation is generated directly from JSDoc comments in the route files. To update:

1. Add or modify JSDoc comments in `backend/src/routes/*.ts`
2. Restart the backend server
3. The documentation will automatically reflect the changes

### Key Endpoints

- **Authentication**: Login/logout with Stacks signatures
- **Users**: Profile management, badges, communities
- **Badges**: Template creation, issuance, revocation
- **Communities**: Community management and analytics
- **Analytics**: Usage metrics and insights
- **Webhooks**: Real-time blockchain event handling

---

## 📊 Success Metrics

- Growth in number of communities issuing badges
- Average badges per user
- Integration count (# of apps using the SDK)
- Profile views per public passport
- Admin time to create + issue badges

---

## 🛣️ Roadmap

### **Phase 1 — Core System** ✅ COMPLETED

- ✅ Passport UI
- ✅ SIP-12 badge minting (contracts ready)
- ✅ Typed metadata
- ✅ Admin badge issuance
- ✅ Frontend application with Next.js
- ✅ Wallet integration
- ✅ Responsive design

### **Phase 2 — Community Tools** ✅ COMPLETED

- ✅ Badge templates
- ✅ Community branding
- ✅ Permissioning model
- ✅ Smart contract deployment (Mainnet)

### **Phase 3 — Developer Ecosystem**

- JS SDK
- Badge reader API
- Integration docs

### **Phase 4 — Social + Sharing** ✅ COMPLETED

- ✅ Public Passport
- ✅ Embeddable widgets
- ✅ Social previews

---

## 🚀 Mainnet Deployment

### Smart Contracts Live on Stacks Mainnet

All PassportX smart contracts are successfully deployed and verified on **Stacks Mainnet**.

**Deployer Address:** `SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0`

### Deployed Contracts

| Contract Name          | Transaction Hash                                                   |
| ---------------------- | ------------------------------------------------------------------ |
| **passport-core**      | `70409884e55488f587065571008bdd9cdb5776cc9ddc9197b88354e2bdccaea4` |
| **passport-nft**       | `78076cad20931ceabb83b68d68131b2f29500f9d0e6593efb8943c17cd5bcde5` |
| **access-control**     | `b22729ce59d5c78d3fe469d425282fe0b38275979c5e681d80c4cdbf4a0d4b33` |
| **badge-issuer**       | `53185097d7181fd4b3119e4f215123e7bbd97000e491f92561543ee8d236a74b` |
| **badge-reader**       | `63b4d91a4907fbf00cabeebe4c8837e23764092692b511dccc4146d868b72c9e` |
| **badge-metadata**     | `9bab88a536fd093d885b103109d3e80e56dad2ce44c4f0c0abc73ec90db19e5d` |
| **community-manager**  | `92693aa94c6d0022bacc42fb4cf6fca21a2267e899c6b84ade0c8565ded4d764` |
| **badge-issuer-trait** | `3eef42540f0f2dfb75279cfeb0a334219f96f113dc1669cc7f2c7b6a8afa53d1` |
| **badge-reader-trait** | `1a076b0897be40e1e2594faab4a8d4db4ff332bacc06fdd9e54fed86104df9e0` |

### Deployment Details

- **Network:** Stacks Mainnet
- **Total Deployment Cost:** 0.221070 STX
- **Deployment Date:** December 13, 2025
- **Contract Version:** Clarity 2.5
- **Status:** ✅ All contracts confirmed on-chain

### Explorer Links

View all contracts on Stacks Explorer:
🔗 [https://explorer.hiro.so/address/SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0?chain=mainnet](https://explorer.hiro.so/address/SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0?chain=mainnet)

### Contract Addresses for Integration

```clarity
;; Main Integration Contract
SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-core

;; NFT Contract
SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft

;; Access Control
SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.access-control
```

---

## 🔗 Hiro Chainhooks Integration

PassportX integrates with **Hiro Chainhooks** for real-time blockchain event monitoring and indexing.

### What is Chainhooks?

Chainhooks is a reorg-aware transaction indexing engine that provides reliable blockchain data regardless of forks and reorgs. PassportX uses Chainhooks to:

- 🎯 Monitor badge minting events in real-time
- 📊 Track badge metadata updates
- 👥 Listen for community creation events
- 🔔 Trigger instant notifications for users
- 📈 Power analytics and metrics dashboards
- ♻️ Handle blockchain reorganizations gracefully

### Quick Start

1. **Install Dependencies**

   ```bash
   npm install @hirosystems/chainhook-client
   ```

2. **Configure Environment Variables**

   ```bash
   # Copy example files
   cp .env.example .env
   cp .env.local.example .env.local

   # Configure Chainhook node connection
   CHAINHOOK_NODE_URL=http://localhost:20456
   CHAINHOOK_SERVER_PORT=3010
   NEXT_PUBLIC_CHAINHOOK_ENABLED=true
   ```

3. **Start Using Chainhooks**

   ```typescript
   import { getChainhookConfig } from '@/config/chainhook';

   const config = getChainhookConfig('development', 'mainnet');
   ```

### Configuration Files

All Chainhook configuration is located in `src/config/chainhook/`:

- **`types/chainhook.ts`** - TypeScript type definitions
- **`server.config.ts`** - Local event server configuration
- **`node.config.ts`** - Remote Chainhook node configuration
- **`index.ts`** - Main configuration module
- **`constants.ts`** - Constants and defaults
- **`utils.ts`** - Utility functions
- **`README.md`** - Detailed documentation

### Environment Variables Reference

**Server Configuration:**

- `CHAINHOOK_SERVER_HOST` - Local server hostname (default: localhost)
- `CHAINHOOK_SERVER_PORT` - Local server port (default: 3010)
- `CHAINHOOK_SERVER_EXTERNAL_URL` - External URL for webhooks
- `CHAINHOOK_SERVER_HTTPS` - Enable HTTPS (true/false)

**Node Configuration:**

- `CHAINHOOK_NODE_URL` - Chainhook node base URL
- `CHAINHOOK_NODE_API_KEY` - API key for authentication
- `CHAINHOOK_NODE_TIMEOUT` - Request timeout in milliseconds
- `CHAINHOOK_NODE_MAX_RETRIES` - Maximum retry attempts

**Feature Flags:**

- `NEXT_PUBLIC_CHAINHOOK_ENABLED` - Enable/disable Chainhooks
- `NEXT_PUBLIC_CHAINHOOK_DEBUG` - Enable debug logging

### Monitored Events

PassportX monitors the following contract events:

- **Badge Minting** - `passport-nft` contract
- **Metadata Updates** - `badge-metadata` contract
- **Community Creation** - `community-manager` contract
- **Access Control Changes** - `access-control` contract
- **Badge Revocations** - `badge-issuer` contract

### Resources

- 🏗️ [Chainhook Integration Architecture](./docs/CHAINHOOK_INTEGRATION_ARCHITECTURE.md)
- 📚 [Chainhook Configuration Documentation](./src/config/chainhook/README.md)
- 🔗 [Hiro Chainhooks Docs](https://docs.hiro.so/chainhook/overview)
- 📦 [Chainhook Client NPM](https://www.npmjs.com/package/@hirosystems/chainhook-client)
- 💻 [Chainhook GitHub](https://github.com/hirosystems/chainhook)

### Related Issues

- [#31 - Set up Hiro Chainhooks infrastructure](https://github.com/DeborahOlaboye/PassportX/issues/31)
- [#32 - Create ChainhookEventObserver service](https://github.com/DeborahOlaboye/PassportX/issues/32)
- [#33 - Implement predicate for badge minting events](https://github.com/DeborahOlaboye/PassportX/issues/33)

---

## 🔒 Security

PassportX implements comprehensive security measures to protect user data and prevent injection attacks:

### Security Fixes (Issue #162)

- **Dynamic Route Parameter Validation** - All route parameters are validated and sanitized before use in database queries
- **NoSQL Injection Prevention** - Whitelist validation prevents MongoDB operator injection
- **XSS Protection** - Input sanitization removes dangerous characters and HTML/script patterns
- **SQL Injection Prevention** - Pattern detection blocks common SQL keywords
- **Parameter Encoding** - Proper URL encoding prevents parameter pollution attacks

### Key Security Features

- ✅ Validated Stacks address format
- ✅ Custom URL slug whitelist validation
- ✅ Injection pattern detection (MongoDB, SQL, XSS, template injection)
- ✅ Input length limiting and character sanitization
- ✅ Early validation at entry points
- ✅ Graceful error handling without information leakage

### For Developers

- Review [Security Fix #162 Documentation](./docs/SECURITY_FIX_162.md) for details
- Follow [Validation Implementation Guide](./docs/VALIDATION_IMPLEMENTATION_EXAMPLES.md) when adding new routes
- Use validation utilities from `src/utils/validation.ts` for all dynamic parameters
- See [Deployment Guide](./docs/DEPLOYMENT_GUIDE_162.md) for security best practices

### Reporting Security Issues

Please report security vulnerabilities responsibly:

1. Do **not** create public GitHub issues for security vulnerabilities
2. Email security details to the project maintainers
3. Allow time for a fix before public disclosure

---

## 🤝 Contributing

PassportX welcomes contributions across UI, smart contracts, and documentation.
Open an issue or start a PR!

Before contributing, please review our [security guidelines](./docs/SECURITY_FIX_162.md) to understand input validation requirements.

---

## 📄 License

MIT License

---

## ❤️ Acknowledgments

Built on **Stacks**
Powered by **Clarity 4**
Inspired by a vision of portable identity and community-centered recognition.

---

## 🔐 Session Management (WalletConnect)

Client-side session management utilities and a React provider are available under `src/`.

- Persist sessions across reloads using `saveSession` / `recoverSession`.
- Clear sessions with `clearSession` and `disconnect` on the provider to avoid stale sessions.
- Optional client-side encryption helpers are in `src/utils/crypto.ts`.

Usage (example):

1. Wrap your app with `WalletSessionProvider`.
2. Use `useWalletSession()` to `save` or `disconnect`.

### Integration tests

Integration tests for WalletConnect flows are available under `tests/integration`.
They are disabled by default; follow `tests/integration/README.md` and `.env.example.integration` to enable.

### Error handling & recovery

This release adds error handling components and utilities:

- `ErrorBoundary` — React boundary to catch render errors.
- `ErrorToast` and `FallbackUI` — user-facing fallback and toast messages.
- `retry` util — retry transient operations with backoff.
- `logger` — lightweight logging helpers.

Wrap risky components with `ErrorBoundary` and use `useWalletSession()`'s `retryOperation` to run retryable actions. The provider now surfaces `error` for UI consumption.

```

```
