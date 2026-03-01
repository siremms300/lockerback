// scripts/migrate-add-role.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import models after env is loaded
import { Merchant } from '../models';

async function migrateAddRole() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Update all merchants without a role to have 'merchant' role
    const result = await Merchant.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'merchant' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} merchants with default 'merchant' role`);

    // Show merchants that were updated
    if (result.modifiedCount > 0) {
      const updatedMerchants = await Merchant.find({ role: 'merchant' }).limit(5);
      console.log('\nSample updated merchants:');
      updatedMerchants.forEach(m => {
        console.log(`- ${m.businessName} (${m.email})`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateAddRole();