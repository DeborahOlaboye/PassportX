# PassportX Backend API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/message
Generate authentication message for signing.
```json
{
  "stacksAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
}
```

#### POST /auth/login
Authenticate with signed message.
```json
{
  "stacksAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "message": "Sign this message...",
  "signature": "0x..."
}
```

### Users

#### GET /users/profile/:address
Get user profile (public if profile is public, or own profile).

#### PUT /users/profile
Update user profile (authenticated).
```json
{
  "name": "John Doe",
  "bio": "Web3 developer",
  "avatar": "https://...",
  "isPublic": true
}
```

#### GET /users/badges/:address
Get user's badges (passport).

#### GET /users/stats/:address
Get user statistics.

### Communities

#### GET /communities
Get all communities with pagination and search.
Query params: `page`, `limit`, `search`

#### GET /communities/:id
Get community by ID.

#### POST /communities
Create new community (authenticated).
```json
{
  "name": "Web3 Developers",
  "description": "Community for Web3 developers",
  "theme": {
    "primaryColor": "#3b82f6",
    "logo": "https://..."
  }
}
```

#### PUT /communities/:id
Update community (admin only).

#### GET /communities/admin/:address
Get communities by admin address.

#### GET /communities/:id/stats
Get community statistics.

### Badges

#### POST /badges/templates
Create badge template (community admin only).
```json
{
  "name": "Python Beginner",
  "description": "Completed basic Python course",
  "category": "skill",
  "level": 1,
  "icon": "🐍",
  "requirements": "Complete Python basics course",
  "communityId": "..."
}
```

#### GET /badges/templates/community/:communityId
Get badge templates for community.

#### POST /badges/issue
Issue badge to user (community admin only).
```json
{
  "templateId": "...",
  "recipientAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "transactionId": "0x...",
  "tokenId": 123
}
```

#### GET /badges/:id
Get badge by ID.

#### PUT /badges/templates/:id
Update badge template (community admin only).

#### DELETE /badges/:id
Revoke badge (community admin only).

### Blockchain

#### GET /blockchain/transaction/:txId
Get transaction status.

#### GET /blockchain/badges/:address
Get user badges from blockchain.

#### GET /blockchain/balance/:address
Get account balance.

#### GET /blockchain/transactions/:address
Get account transactions.

#### GET /blockchain/contract/:address/:name
Get contract information.

#### POST /blockchain/validate-address
Validate Stacks address.
```json
{
  "address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
}
```

#### POST /blockchain/read-function
Read contract function.
```json
{
  "contractAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "contractName": "passport-core",
  "functionName": "get-user-badges",
  "functionArgs": []
}
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "stack": "..." // Only in development
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Data Models

### User
```json
{
  "id": "...",
  "stacksAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "name": "John Doe",
  "bio": "Web3 developer",
  "avatar": "https://...",
  "isPublic": true,
  "joinDate": "2024-01-01T00:00:00.000Z"
}
```

### Community
```json
{
  "id": "...",
  "name": "Web3 Developers",
  "description": "Community for Web3 developers",
  "admin": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "memberCount": 150,
  "badgeCount": 10,
  "theme": {
    "primaryColor": "#3b82f6",
    "logo": "https://..."
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Badge Template
```json
{
  "id": "...",
  "name": "Python Beginner",
  "description": "Completed basic Python course",
  "category": "skill",
  "level": 1,
  "icon": "🐍",
  "requirements": "Complete Python basics course",
  "creator": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Badge
```json
{
  "id": "...",
  "name": "Python Beginner",
  "description": "Completed basic Python course",
  "community": "Web3 Developers",
  "owner": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "issuer": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "level": 1,
  "category": "skill",
  "icon": "🐍",
  "issuedAt": "2024-01-01T00:00:00.000Z",
  "tokenId": 123,
  "transactionId": "0x..."
}
```

## Rate Limiting
- 100 requests per 15 minutes per IP
- Authentication endpoints may have stricter limits

## Environment Variables
See `.env.example` for required configuration.