# Backend API Integration Guide

## Issue #2 Implementation Summary ✅

This document outlines the completed backend infrastructure for PassportX, addressing all requirements from GitHub Issue #2.

## ✅ Completed Requirements

### 1. Set up Node.js/Express server
- ✅ Express.js server with TypeScript
- ✅ Security middleware (helmet, CORS, rate limiting)
- ✅ Request logging and monitoring
- ✅ Health check endpoints

### 2. Design database schema for users, communities, badges
- ✅ MongoDB with Mongoose ODM
- ✅ User model with Stacks address integration
- ✅ Community model with admin controls
- ✅ BadgeTemplate model with categories/levels
- ✅ Badge model linking templates to issued NFTs
- ✅ Optimized indexes for performance

### 3. Implement user authentication and authorization
- ✅ JWT-based authentication system
- ✅ Stacks signature verification
- ✅ Role-based access control
- ✅ Secure token generation and validation

### 4. Create REST endpoints for passport operations
- ✅ User profile management (get, update)
- ✅ Badge collection retrieval with privacy controls
- ✅ User statistics and analytics
- ✅ Public passport discovery and search

### 5. Add community management APIs
- ✅ Community CRUD operations
- ✅ Admin authorization controls
- ✅ Community statistics and analytics
- ✅ Member leaderboards and trending communities

### 6. Implement badge issuance endpoints
- ✅ Badge template creation and management
- ✅ Badge issuance with validation
- ✅ Badge revocation capabilities
- ✅ Badge filtering and statistics

### 7. Add Stacks blockchain integration
- ✅ Contract interaction utilities
- ✅ Transaction monitoring and status
- ✅ Address validation and balance queries
- ✅ NFT minting and metadata management

## 🏗️ Technical Architecture

### Backend Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with security middleware
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Stacks signature verification
- **Blockchain**: Stacks network integration
- **Testing**: Jest with in-memory MongoDB
- **Deployment**: Docker with Nginx

### API Structure
```
/api
├── /auth              # Authentication endpoints
├── /users             # User profiles and passports
├── /communities       # Community management
├── /badges            # Badge templates and issuance
├── /blockchain        # Stacks integration
└── /health           # System monitoring
```

### Database Models
```
Users Collection
├── stacksAddress (unique identifier)
├── profile (name, bio, avatar)
├── privacy settings
└── activity tracking

Communities Collection
├── admin (Stacks address)
├── branding (theme, logo)
├── member statistics
└── badge templates

BadgeTemplates Collection
├── metadata (name, description, icon)
├── classification (category, level)
├── requirements
└── community reference

Badges Collection
├── template reference
├── ownership (owner, issuer)
├── blockchain data (tokenId, txId)
└── issuance metadata
```

## 🔧 Integration Points

### Frontend Integration
The backend provides REST APIs that the frontend can consume:

```typescript
// Authentication
POST /api/auth/message
POST /api/auth/login

// User Operations
GET /api/users/profile/:address
PUT /api/users/profile
GET /api/users/badges/:address

// Community Operations
GET /api/communities
POST /api/communities
GET /api/communities/:id/stats

// Badge Operations
POST /api/badges/templates
POST /api/badges/issue
GET /api/badges/templates/community/:id
```

### Blockchain Integration
Smart contract interactions are handled through the Stacks service:

```typescript
// Badge Minting
await badgeService.mintBadge(senderKey, recipient, badgeId, metadata)

// Community Creation
await communityService.createCommunity(senderKey, name, description)

// Transaction Monitoring
await stacksService.getTransactionStatus(txId)
```

### Database Operations
All database operations use Mongoose models with proper validation:

```typescript
// User Management
const user = await User.findOne({ stacksAddress })
await user.save()

// Badge Issuance
const badge = new Badge({ templateId, owner, metadata })
await badge.save()

// Community Analytics
const stats = await getCommunityAnalytics(communityId)
```

## 🚀 Deployment Configuration

### Environment Setup
```bash
# Core Configuration
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/passportx
JWT_SECRET=your-super-secret-key

# Stacks Integration
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so

# Contract Addresses (after deployment)
PASSPORT_CONTRACT_ADDRESS=SP...
BADGE_ISSUER_CONTRACT_ADDRESS=SP...
COMMUNITY_MANAGER_CONTRACT_ADDRESS=SP...
```

### Docker Deployment
```bash
# Full stack deployment
docker-compose up -d

# Individual service
docker build -t passportx-backend .
docker run -p 3001:3001 --env-file .env passportx-backend
```

## 📊 Monitoring & Health

### Health Endpoints
- `GET /health` - Basic health check
- `GET /health/status` - System status with metrics
- `GET /health/metrics` - Request analytics
- `GET /health/db` - Database connection status

### Performance Monitoring
- Request/response time tracking
- Error rate monitoring
- Database query performance
- Memory usage tracking

## 🔒 Security Implementation

### Authentication Security
- JWT token validation
- Stacks signature verification
- Rate limiting (100 requests/15min)
- CORS configuration

### Data Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers
- Environment variable protection

### Access Control
- Role-based permissions (community admins)
- Resource ownership validation
- Privacy controls for user data
- Audit logging for sensitive operations

## 🧪 Testing Coverage

### Test Types
- Unit tests for services and utilities
- Integration tests for API endpoints
- Database operation tests
- Authentication flow tests

### Test Environment
- In-memory MongoDB for isolation
- Mocked blockchain interactions
- Automated test runs with CI/CD
- Coverage reporting

## 📈 Performance Optimizations

### Database Optimizations
- Strategic indexing for common queries
- Connection pooling
- Query optimization
- Aggregation pipelines for analytics

### API Optimizations
- Response caching headers
- Pagination for large datasets
- Efficient data serialization
- Request compression

## 🔄 Integration Workflow

### Development Flow
1. **API Development**: Create endpoints with validation
2. **Database Operations**: Implement with proper error handling
3. **Blockchain Integration**: Add contract interactions
4. **Testing**: Unit and integration tests
5. **Documentation**: Update API docs

### Frontend Integration
1. **API Client**: Use generated types from backend
2. **Authentication**: Implement JWT token management
3. **Error Handling**: Handle API error responses
4. **State Management**: Sync with backend data

### Blockchain Integration
1. **Contract Deployment**: Deploy smart contracts
2. **Address Configuration**: Update environment variables
3. **Transaction Handling**: Monitor and update status
4. **Error Recovery**: Handle blockchain failures

## 📋 Acceptance Criteria Verification

✅ **API endpoints respond correctly**
- All endpoints return proper HTTP status codes
- Consistent error response format
- Comprehensive input validation
- Proper authentication handling

✅ **Database operations work reliably**
- CRUD operations for all models
- Data integrity with referential constraints
- Optimized queries with proper indexing
- Transaction support for critical operations

✅ **Authentication system functional**
- JWT token generation and validation
- Stacks signature verification
- Role-based access control
- Secure session management

✅ **Blockchain integration connects to contracts**
- Smart contract interaction utilities
- Transaction monitoring and status
- Address validation and balance queries
- NFT minting and metadata management

## 🎯 Next Steps

The backend is complete and ready for:

1. **Frontend Integration**: Connect React app to API endpoints
2. **Smart Contract Deployment**: Deploy contracts and update addresses
3. **Production Deployment**: Deploy to cloud infrastructure
4. **Performance Testing**: Load testing and optimization
5. **Security Audit**: Comprehensive security review

---

**Status**: ✅ COMPLETE - All Issue #2 requirements implemented
**Ready for**: Frontend integration and production deployment