import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

export const API_VERSION = '1.0.0';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PassportX API',
      version: API_VERSION,
      description:
        'PassportX backend API (v1) for managing digital identity passports, badges, communities, and blockchain-based verifications on the Stacks network.\n\n' +
        '**Authentication**: Most write endpoints require a session cookie obtained via `POST /api/auth/login`.\n\n' +
        '**Versioning**: The current API version is `v1`. The version is reflected in the `info.version` field of this spec.',
      contact: {
        name: 'PassportX Team',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server (v1)',
      },
      {
        url: 'https://api.passportx.io',
        description: 'Production server (v1)',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
          description: 'Session cookie obtained after login',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from the Authorization header',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'An error occurred' },
            code: { type: 'string', example: 'ERROR_CODE' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
            stacksAddress: {
              type: 'string',
              example: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
            },
            name: { type: 'string', example: 'Alice Smith' },
            bio: { type: 'string', example: 'Blockchain enthusiast' },
            avatar: { type: 'string', example: '/uploads/avatars/avatar.jpg' },
            customUrl: { type: 'string', example: 'alice-smith' },
            isPublic: { type: 'boolean', example: true },
            joinDate: { type: 'string', format: 'date-time' },
            socialLinks: {
              type: 'object',
              properties: {
                twitter: { type: 'string' },
                github: { type: 'string' },
                linkedin: { type: 'string' },
                discord: { type: 'string' },
                website: { type: 'string' },
              },
            },
          },
        },
        Badge: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'Early Contributor' },
            description: {
              type: 'string',
              example: 'Awarded to early contributors',
            },
            community: { type: 'string', example: 'PassportX Community' },
            owner: {
              type: 'string',
              example: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
            },
            issuer: {
              type: 'string',
              example: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
            },
            level: { type: 'integer', example: 1 },
            category: { type: 'string', example: 'contribution' },
            icon: { type: 'string', example: '🏆' },
            issuedAt: { type: 'string', format: 'date-time' },
            tokenId: { type: 'string', example: 'token-001' },
            transactionId: { type: 'string', example: '0xabc123' },
          },
        },
        BadgeTemplate: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'Early Contributor' },
            description: {
              type: 'string',
              example: 'Awarded to early contributors',
            },
            category: { type: 'string', example: 'contribution' },
            level: { type: 'integer', example: 1 },
            icon: { type: 'string', example: '🏆' },
            requirements: { type: 'string', example: 'Must contribute 5+ PRs' },
            creator: {
              type: 'string',
              example: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Community: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'PassportX DAO' },
            description: {
              type: 'string',
              example: 'The official PassportX community',
            },
            creator: {
              type: 'string',
              example: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
            },
            admins: { type: 'array', items: { type: 'string' } },
            memberCount: { type: 'integer', example: 42 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
            type: { type: 'string', example: 'badge_issued' },
            title: { type: 'string', example: 'New Badge Received' },
            message: { type: 'string', example: 'You received a new badge!' },
            read: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication and session management' },
      { name: 'Users', description: 'User profiles and passport management' },
      {
        name: 'Badges',
        description: 'Badge templates, issuance, and management',
      },
      { name: 'Communities', description: 'Community creation and membership' },
      { name: 'Verification', description: 'Badge and ownership verification' },
      { name: 'Notifications', description: 'User notification management' },
      { name: 'Analytics', description: 'Platform analytics and metrics' },
      { name: 'Activity', description: 'User activity feed' },
      { name: 'Health', description: 'Server and database health checks' },
      { name: 'Webhooks', description: 'Outbound webhook management' },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../routes/*.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
