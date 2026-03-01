// scripts/create-admin.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import models after env is loaded
import { Merchant } from '../models';

async function createAdminUser() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if any admin already exists
    const existingAdmin = await Merchant.findOne({ 
      role: { $in: ['admin', 'super_admin'] } 
    });
    
    if (existingAdmin) {
      console.log('❌ Admin user already exists:');
      console.log(`- Name: ${existingAdmin.businessName}`);
      console.log(`- Email: ${existingAdmin.email}`);
      console.log(`- Role: ${existingAdmin.role}`);
      
      const overwrite = await askQuestion('Do you want to create another admin? (y/n): ');
      if (overwrite.toLowerCase() !== 'y') {
        await mongoose.disconnect();
        return;
      }
    }

    const adminData = {
      businessName: 'System Administrator',
      email: 'siremms300@gmail.com',
      phone: '+2349065219811',
      password: 'Scoversedu1@', // Will be hashed by pre-save hook
      businessType: 'Administration',
      role: 'super_admin',
      isActive: true,
      settings: {
        defaultLockerSize: 'medium',
        smsNotifications: true,
        emailNotifications: true,
        autoApproveReturns: false
      },
      billing: {
        walletBalance: 0,
        creditLimit: 1000000,
        paymentMethod: 'wallet',
        autoTopUp: false,
        topUpThreshold: 1000000
      }
    };

    // Check if user with this email already exists
    const existingUser = await Merchant.findOne({ email: adminData.email });
    
    if (existingUser) {
      // Update existing user to admin
      existingUser.role = 'super_admin';
      existingUser.businessType = adminData.businessType;
      await existingUser.save();
      
      console.log('✅ Existing user promoted to super_admin:');
      console.log(`- Name: ${existingUser.businessName}`);
      console.log(`- Email: ${existingUser.email}`);
      console.log(`- New Role: ${existingUser.role}`);
    } else {
      // Create new admin
      const admin = new Merchant(adminData);
      await admin.save();
      
      console.log('✅ Super admin created successfully!');
      console.log('\n📋 Admin Credentials:');
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: Scoversedu1@`);
      console.log('\n⚠️  IMPORTANT: Please change this password after first login!');
    }

    // List all admins
    const admins = await Merchant.find({ 
      role: { $in: ['admin', 'super_admin'] } 
    }).select('businessName email role');
    
    console.log('\n👥 Current Administrators:');
    admins.forEach(admin => {
      console.log(`- ${admin.businessName} (${admin.email}) - ${admin.role}`);
    });

  } catch (error) {
    console.error('❌ Failed to create admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Helper function to ask questions in terminal
function askQuestion(query: string): Promise<string> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(query, (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run the script
createAdminUser();