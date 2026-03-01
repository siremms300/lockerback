import mongoose, { Schema, Document } from 'mongoose'

export interface IDriver extends Document {
  name: string
  phone: string
  pin: string
  email?: string
  vehicle: {
    type: string
    plateNumber: string
  }
  location?: {
    lat: number
    lng: number
    lastUpdated: Date
  }
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

const driverSchema = new Schema<IDriver>({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true 
  },
  phone: { 
    type: String, 
    required: [true, 'Phone is required'],
    unique: true,
    trim: true
  },
  pin: { 
    type: String, 
    required: [true, 'PIN is required'],
    minlength: [4, 'PIN must be at least 4 characters']
  },
  email: { 
    type: String, 
    trim: true,
    lowercase: true 
  },
  vehicle: {
    type: { 
      type: String, 
      enum: ['motorcycle', 'car', 'van', 'truck'],
      default: 'motorcycle' 
    },
    plateNumber: { 
      type: String, 
      trim: true,
      uppercase: true 
    }
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    lastUpdated: { type: Date }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  }
}, {
  timestamps: true
})

// Index for efficient queries
driverSchema.index({ phone: 1 })
driverSchema.index({ isActive: 1 })
driverSchema.index({ 'location.lat': 1, 'location.lng': 1 })

// Don't send PIN in responses
driverSchema.methods.toJSON = function() {
  const driver = this.toObject()
  delete driver.pin 
  return driver
}

// Check if model exists to avoid OverwriteModelError
const DriverModel = mongoose.models.Driver || mongoose.model<IDriver>('Driver', driverSchema)

export default DriverModel






