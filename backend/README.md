# PassportX Backend API

## Issue #2 Implementation Complete ✅

This is the backend API for PassportX, providing REST endpoints and database operations for the achievement passport system.

## Features Implemented

### ✅ All Acceptance Criteria Met

1. **✅ API endpoints respond correctly** - Comprehensive REST API with proper error handling
2. **✅ Database operations work reliably** - MongoDB with optimized schemas and indexes
3. **✅ Authentication system functional** - JWT-based auth with Stacks signature verification
4. **✅ Blockchain integration connects to contracts** - Full Stacks blockchain integration

## Architecture

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with security middleware
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Stacks signature verification
- **Blockchain**: Stacks integration with contract calls
- **Testing**: Jest with in-memory MongoDB
- **Deployment**: Docker with Nginx reverse proxy

### Project Structure
```
backend/
├── src/
│   ├── routes/           # API route handlers
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── users.ts      # User profile and passport
│   │   ├── communities.ts # Community management
│   │   ├── badges.ts     # Badge templates and issuance
│   │   ├── blockchain.ts # Stacks blockchain integration
│   │   └── health.ts     # Health monitoring
│   ├── models/           # Database schemas
│   │   ├── User.ts       # User profiles
│   │   ├── Community.ts  # Communities
│   │   ├── BadgeTemplate.ts # Badge templates
│   │   └── Badge.ts      # Issued badges
│   ├── services/         # Business logic
│   │   ├── authService.ts     # Authentication logic
│   │   ├── stacksService.ts   # Blockchain integration
│   │   ├── passportService.ts # Passport operations
│   │   ├── communityService.ts # Community analytics
│   │   └── badgeService.ts    # Badge operations
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── errorHandler.ts # Error handling
│   │   ├── validation.ts # Input validation
│   │   └── monitoring.ts # Request monitoring
│   ├── utils/           # Utility functions
│   │   └── database.ts  # Database connection
│   ├── types/           # TypeScript interfaces
│   │   └── index.ts     # Shared types
│   └── __tests__/       # Test files
├── API_DOCUMENTATION.md # Complete API docs
├── DEPLOYMENT.md       # Deployment guide
├── Dockerfile         # Container configuration
├── docker-compose.yml # Full stack deployment
└── nginx.conf        # Reverse proxy config
```

## Quick Start

### Development Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test
```

### Production Deployment
```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or build and run manually
docker build -t passportx-backend .
docker run -p 3001:3001 --env-file .env passportx-backend
```

## API Endpoints

### Authentication
- `POST /api/auth/message` - Generate authentication message
- `POST /api/auth/login` - Authenticate with signature

### Users & Passports
- `GET /api/users/profile/:address` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/badges/:address` - Get user's badge collection
- `GET /api/users/stats/:address` - Get user statistics

### Communities
- `GET /api/communities` - List all communities
- `POST /api/communities` - Create new community
- `GET /api/communities/:id` - Get community details
- `PUT /api/communities/:id` - Update community
- `GET /api/communities/:id/stats` - Community analytics

### Badges
- `POST /api/badges/templates` - Create badge template
- `GET /api/badges/templates/community/:id` - Get community templates
- `POST /api/badges/issue` - Issue badge to user
- `GET /api/badges/:id` - Get badge details
- `DELETE /api/badges/:id` - Revoke badge

### Blockchain Integration
- `GET /api/blockchain/transaction/:txId` - Transaction status
- `GET /api/blockchain/badges/:address` - Blockchain badge data
- `POST /api/blockchain/validate-address` - Validate Stacks address
- `POST /api/blockchain/read-function` - Read contract function

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/status` - Detailed system status
- `GET /health/metrics` - Request metrics
- `GET /health/db` - Database health

## Database Schema

### Collections
- **users**: User profiles and settings
- **communities**: Community information and branding
- **badgetemplates**: Badge template definitions
- **badges**: Issued badge records

### Key Features
- Optimized indexes for performance
- Referential integrity with population
- Flexible metadata storage
- Audit trails for badge issuance

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Stacks signature verification
- Role-based access control (community admins)
- Request rate limiting

### Data Protection
- Input validation and sanitization
- CORS configuration
- Security headers (helmet)
- Environment variable protection

### Monitoring & Logging
- Request/response logging
- Performance metrics
- Health monitoring
- Error tracking

## Blockchain Integration

### Stacks Network Support
- Testnet and mainnet configuration
- Contract interaction utilities
- Transaction monitoring
- Address validation

### Smart Contract Integration
- Badge minting operations
- Community creation
- NFT metadata management
- Transaction status tracking

## Testing

### Test Coverage
- Unit tests for services
- Integration tests for routes
- In-memory database for testing
- Mocked blockchain interactions

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Performance & Scalability

### Optimizations
- Database indexing strategy
- Connection pooling
- Request caching headers
- Efficient query patterns

### Monitoring
- Response time tracking
- Error rate monitoring
- Database performance metrics
- Memory usage tracking

## Environment Configuration

### Required Variables
```bash
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/passportx
JWT_SECRET=your-secret-key
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so
FRONTEND_URL=http://localhost:3000
```

### Contract Addresses (after deployment)
```bash
PASSPORT_CONTRACT_ADDRESS=SP...
BADGE_ISSUER_CONTRACT_ADDRESS=SP...
COMMUNITY_MANAGER_CONTRACT_ADDRESS=SP...
```

## Development Workflow

### Code Quality
- TypeScript for type safety
- ESLint for code standards
- Prettier for formatting
- Git hooks for validation

### API Development
- RESTful design principles
- Consistent error responses
- Comprehensive validation
- Detailed documentation

## Deployment Options

### Docker (Recommended)
- Multi-stage builds
- Security best practices
- Health checks
- Resource limits

### Traditional Hosting
- PM2 process management
- Nginx reverse proxy
- SSL/TLS termination
- Log rotation

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update API documentation
4. Validate with ESLint
5. Test with different environments

## License

MIT License - see LICENSE file for details

---

**Status**: ✅ COMPLETE - All Issue #2 acceptance criteria implemented
**Ready for**: Frontend integration and production deployment