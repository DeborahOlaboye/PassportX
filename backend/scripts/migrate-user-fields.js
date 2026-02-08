#!/usr/bin/env node

/**
 * Migration script to add passportId and settings fields to existing users
 * Run this script after deploying the type safety improvements
 */

const mongoose = require('mongoose');

async function migrateUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/passportx';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully');

    const User = mongoose.model('User');
    
    // Find users without settings field
    const usersWithoutSettings = await User.find({ settings: { $exists: false } });
    console.log(`Found ${usersWithoutSettings.length} users without settings`);

    // Update users with default settings
    for (const user of usersWithoutSettings) {
      user.settings = {
        showEmail: false,
        showBadges: true,
        showCommunities: true
      };
      await user.save();
    }

    console.log(`Updated ${usersWithoutSettings.length} users with default settings`);

    // Log users with passportId
    const usersWithPassport = await User.countDocuments({ passportId: { $exists: true } });
    console.log(`${usersWithPassport} users have passportId`);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateUsers();
