// scripts/seed-drivers.ts
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { Driver } from '../models'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thedenafrica_db_user:ewjXh4xn3sPflAKg@cluster0.axusk7q.mongodb.net/?appName=Cluster0'

async function seedDrivers() {
  await mongoose.connect(MONGODB_URI)
  
  const drivers = [
    {
      name: 'John Driver',
      phone: '+2348012345678',
      pin: '123456', // In production, hash this with bcrypt
      email: 'john.driver@lockernetwork.africa',
      vehicle: {
        type: 'motorcycle',
        plateNumber: 'ABC123XY'
      },
      isActive: true
    },
    {
      name: 'Mary Courier',
      phone: '+2348098765432',
      pin: '654321',
      email: 'mary.courier@lockernetwork.africa',
      vehicle: {
        type: 'car',
        plateNumber: 'XYZ789AB'
      },
      isActive: true
    }
  ]
  
  // Clear existing drivers
  await Driver.deleteMany({})
  
  // Insert new drivers
  for (const driverData of drivers) {
    // In production, hash the PIN
    // const salt = await bcrypt.genSalt(10)
    // driverData.pin = await bcrypt.hash(driverData.pin, salt)
    
    const driver = new Driver(driverData)
    await driver.save()
    console.log(`Created driver: ${driver.name} (${driver.phone})`)
  }
  
  console.log('Drivers seeded successfully!')
  mongoose.disconnect()
}

seedDrivers().catch(console.error)





