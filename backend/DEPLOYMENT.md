# PassportX Backend Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Update environment variables in `.env`

4. Start development server:
   ```bash
   npm run dev
   ```

## Docker Deployment

### Single Container
```bash
# Build image
docker build -t passportx-backend .

# Run container
docker run -p 3001:3001 --env-file .env passportx-backend
```

### Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Deployment

### Environment Variables
Required environment variables for production:

```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/passportx
JWT_SECRET=your-super-secret-jwt-key
STACKS_NETWORK=mainnet
STACKS_API_URL=https://api.hiro.so
FRONTEND_URL=https://your-frontend-domain.com

# Contract addresses (after deployment)
PASSPORT_CONTRACT_ADDRESS=SP...
BADGE_ISSUER_CONTRACT_ADDRESS=SP...
COMMUNITY_MANAGER_CONTRACT_ADDRESS=SP...
```

### Database Setup
1. Install MongoDB
2. Create database and user
3. Configure connection string
4. Set up indexes (automatic on first run)

### SSL/TLS Configuration
1. Obtain SSL certificates
2. Update nginx.conf with SSL configuration
3. Place certificates in ./ssl directory

### Monitoring
- Health endpoint: `/health`
- Metrics endpoint: `/health/metrics`
- Database status: `/health/db`

### Security Checklist
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable request logging
- [ ] Set up monitoring alerts

## API Endpoints

Base URL: `https://your-domain.com/api`

### Authentication
- `POST /auth/message` - Generate auth message
- `POST /auth/login` - Authenticate user

### Users
- `GET /users/profile/:address` - Get user profile
- `PUT /users/profile` - Update profile
- `GET /users/badges/:address` - Get user badges

### Communities
- `GET /communities` - List communities
- `POST /communities` - Create community
- `GET /communities/:id` - Get community details

### Badges
- `POST /badges/templates` - Create badge template
- `POST /badges/issue` - Issue badge
- `GET /badges/:id` - Get badge details

### Blockchain
- `GET /blockchain/transaction/:txId` - Transaction status
- `POST /blockchain/validate-address` - Validate address

## Performance Optimization

### Database Indexes
Indexes are automatically created for:
- User addresses
- Community admins
- Badge owners
- Template categories

### Caching
Consider implementing Redis for:
- Session storage
- API response caching
- Rate limiting

### Load Balancing
For high traffic, use multiple backend instances:
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB is running
   - Verify connection string
   - Check network connectivity

2. **JWT Token Invalid**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate signature format

3. **Stacks Integration Issues**
   - Verify contract addresses
   - Check network configuration
   - Validate API endpoints

### Logs
```bash
# Docker logs
docker-compose logs backend

# Application logs
tail -f /var/log/passportx/app.log
```

### Health Checks
```bash
# Basic health
curl http://localhost:3001/health

# Detailed status
curl http://localhost:3001/health/status

# Database health
curl http://localhost:3001/health/db
```

## Backup and Recovery

### Database Backup
```bash
mongodump --uri="mongodb://localhost:27017/passportx" --out=/backup/$(date +%Y%m%d)
```

### Restore
```bash
mongorestore --uri="mongodb://localhost:27017/passportx" /backup/20240101/passportx
```

## Scaling Considerations

1. **Horizontal Scaling**: Multiple backend instances
2. **Database Sharding**: For large datasets
3. **CDN**: For static assets
4. **Caching Layer**: Redis for performance
5. **Load Balancer**: Distribute traffic

## Security Best Practices

1. Keep dependencies updated
2. Use HTTPS everywhere
3. Implement proper CORS
4. Rate limit API endpoints
5. Validate all inputs
6. Use secure headers
7. Monitor for suspicious activity
8. Regular security audits