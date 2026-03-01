// src/models/Location.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  type: 'locker' | 'staffed_hub';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  contact: {
    phone: string;
    email?: string;
  };
  hours: {
    opens: string;
    closes: string;
    timezone: string;
  };
  status: 'active' | 'inactive' | 'maintenance';
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>({
  name: { type: String, required: true },
  type: { type: String, enum: ['locker', 'staffed_hub'], required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'Nigeria' }
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String }
  },
  hours: {
    opens: { type: String, default: '08:00' },
    closes: { type: String, default: '20:00' },
    timezone: { type: String, default: 'Africa/Lagos' }
  },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  isOnline: { type: Boolean, default: true }
}, { 
  timestamps: true
});

// Check if model already exists before compiling
const LocationModel = mongoose.models.Location || mongoose.model<ILocation>('Location', locationSchema);

export default LocationModel;


























































// // src/models/Location.ts
// import mongoose, { Schema, Document } from 'mongoose';

// export interface ILocation extends Document {
//   name: string;
//   type: 'locker' | 'staffed_hub';
//   address: {
//     street: string;
//     city: string;
//     state: string;
//     country: string;
//   };
//   coordinates: {
//     lat: number;
//     lng: number;
//   };
//   contact: {
//     phone: string;
//     email?: string;
//   };
//   hours: {
//     opens: string;
//     closes: string;
//     timezone: string;
//   };
//   capacity: {
//     small: number;
//     medium: number;
//     large: number;
//   };
//   availability: {
//     small: number;
//     medium: number;
//     large: number;
//   };
//   status: 'active' | 'inactive' | 'maintenance';
//   isOnline: boolean;
//   lastHeartbeat: Date;
// }

// const locationSchema = new Schema<ILocation>({
//   name: { type: String, required: true },
//   type: { type: String, enum: ['locker', 'staffed_hub'], required: true },
//   address: {
//     street: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     country: { type: String, default: 'Nigeria' }
//   },
//   coordinates: {
//     lat: { type: Number, required: true },
//     lng: { type: Number, required: true }
//   },
//   contact: {
//     phone: { type: String, required: true },
//     email: { type: String }
//   },
//   hours: {
//     opens: { type: String, default: '08:00' },
//     closes: { type: String, default: '20:00' },
//     timezone: { type: String, default: 'Africa/Lagos' }
//   },
//   capacity: {
//     small: { type: Number, default: 0 },
//     medium: { type: Number, default: 0 },
//     large: { type: Number, default: 0 }
//   },
//   availability: {
//     small: { type: Number, default: 0 },
//     medium: { type: Number, default: 0 },
//     large: { type: Number, default: 0 }
//   },
//   status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
//   isOnline: { type: Boolean, default: true },
//   lastHeartbeat: { type: Date, default: Date.now }
// });

// export default mongoose.model<ILocation>('Location', locationSchema);