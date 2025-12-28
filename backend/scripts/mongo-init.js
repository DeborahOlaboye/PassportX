// MongoDB Initialization Script for PassportX
// This script runs when the MongoDB container is first created

db = db.getSiblingDB('passportx');

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['stacksAddress', 'joinDate'],
      properties: {
        stacksAddress: {
          bsonType: 'string',
          description: 'Stacks blockchain address - required'
        },
        email: {
          bsonType: 'string',
          description: 'User email address'
        },
        name: {
          bsonType: 'string',
          maxLength: 100
        },
        bio: {
          bsonType: 'string',
          maxLength: 500
        },
        isPublic: {
          bsonType: 'bool',
          description: 'Whether the profile is public'
        },
        joinDate: {
          bsonType: 'date',
          description: 'Date when user joined'
        }
      }
    }
  }
});

db.createCollection('communities', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'slug', 'description', 'admins'],
      properties: {
        name: {
          bsonType: 'string',
          maxLength: 100
        },
        slug: {
          bsonType: 'string',
          pattern: '^[a-z0-9-]+$'
        },
        description: {
          bsonType: 'string',
          maxLength: 2000
        },
        admins: {
          bsonType: 'array',
          minItems: 1,
          items: {
            bsonType: 'string'
          }
        }
      }
    }
  }
});

db.createCollection('badgetemplates');
db.createCollection('badges');

// Create indexes
print('Creating indexes for users collection...');
db.users.createIndex({ stacksAddress: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { sparse: true });
db.users.createIndex({ isPublic: 1 });

print('Creating indexes for communities collection...');
db.communities.createIndex({ slug: 1 }, { unique: true });
db.communities.createIndex({ admins: 1 });
db.communities.createIndex({ isActive: 1 });
db.communities.createIndex({ name: 'text', description: 'text' });

print('Creating indexes for badge templates collection...');
db.badgetemplates.createIndex({ community: 1, isActive: 1 });
db.badgetemplates.createIndex({ creator: 1 });
db.badgetemplates.createIndex({ category: 1, level: 1 });

print('Creating indexes for badges collection...');
db.badges.createIndex({ owner: 1, issuedAt: -1 });
db.badges.createIndex({ community: 1, issuedAt: -1 });
db.badges.createIndex({ templateId: 1 });
db.badges.createIndex({ tokenId: 1 }, { sparse: true });

// Create initial admin user (for development)
print('Creating development admin user...');
db.users.insertOne({
  stacksAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  name: 'Dev Admin',
  email: 'admin@passportx.dev',
  bio: 'Development administrator account',
  isPublic: true,
  joinDate: new Date(),
  lastActive: new Date(),
  communities: [],
  adminCommunities: []
});

// Create sample community (for development)
print('Creating sample community...');
const sampleCommunity = db.communities.insertOne({
  name: 'PassportX Community',
  slug: 'passportx-community',
  description: 'Official PassportX community for testing and development',
  about: 'This is a sample community created for development purposes.',
  admins: ['ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'],
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderRadius: '0.5rem'
  },
  socialLinks: {},
  memberCount: 0,
  badgeTemplates: [],
  isPublic: true,
  isActive: true,
  settings: {
    allowMemberInvites: true,
    requireApproval: false,
    allowBadgeIssuance: true,
    allowCustomBadges: false
  },
  tags: ['sample', 'development'],
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create sample badge template
print('Creating sample badge template...');
db.badgetemplates.insertOne({
  name: 'Welcome Badge',
  description: 'Awarded to new community members',
  category: 'participation',
  level: 1,
  icon: '🎉',
  requirements: 'Join the community',
  community: sampleCommunity.insertedId,
  creator: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  isActive: true,
  createdAt: new Date()
});

print('MongoDB initialization complete!');
print('Database: passportx');
print('Collections created: users, communities, badgetemplates, badges');
print('Sample data inserted for development');
