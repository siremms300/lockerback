// src/app.ts
import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes';
import merchantRoutes from './routes/merchant.routes';
import parcelRoutes from './routes/parcel.routes';
import analyticsRoutes from './routes/analytics.routes';
import webhookRoutes from './routes/webhook.routes';
import driverRoutes from './routes/driver.routes'; 
import customerRoutes from './routes/customer.routes';
import driverAdminRoutes from './routes/driver-admin.routes';
import adminRoutes from './routes/admin.routes';
// Import socket setup
import { setupSocket } from './socket/socket';
import billingRoutes from './routes/billing.routes';
 
import locationRoutes from './routes/location.routes';
  

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lockernetwork';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io setup
setupSocket(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/drivers', driverAdminRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes); // ADD THIS LINE

// Health check
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'OK',  
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Locker Network API is working!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}); 

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});






























// // src/app.ts
// import express from 'express';
// import mongoose from 'mongoose';
// import http from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import helmet from 'helmet';
// import compression from 'compression';
// import dotenv from 'dotenv';

// // Routes
// import authRoutes from './routes/auth.routes';
// import merchantRoutes from './routes/merchant.routes';
// import parcelRoutes from './routes/parcel.routes';
// import analyticsRoutes from './routes/analytics.routes';
// import webhookRoutes from './routes/webhook.routes';

// // Services
// import { setupSocket } from './socket/socket';
// import { connectRedis } from './config/redis';

// dotenv.config();

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true
//   }
// });

// // Middleware
// app.use(helmet());
// app.use(compression());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // MongoDB connection
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lockernetwork';

// mongoose.connect(MONGODB_URI)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Redis connection
// connectRedis();

// // Socket.io setup
// setupSocket(io);

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/merchant', merchantRoutes);
// app.use('/api/parcels', parcelRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/webhooks', webhookRoutes);

// // Health check
// app.get('/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime()
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

























































// // backend/src/app.ts
// import express from 'express';
// import mongoose from 'mongoose';
// import http from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import helmet from 'helmet';
// import compression from 'compression';
// import dotenv from 'dotenv';

// // Routes
// import authRoutes from './routes/auth.routes';
// import merchantRoutes from './routes/merchant.routes';
// import parcelRoutes from './routes/parcel.routes';
// import analyticsRoutes from './routes/analytics.routes';
// import webhookRoutes from './routes/webhook.routes';

// // Services
// import { setupSocket } from './socket/socket';
// import { connectRedis } from './config/redis';
// import { startWorker } from './workers/notification.worker';

// dotenv.config();

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true
//   }
// });

// // Middleware
// app.use(helmet());
// app.use(compression());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // MongoDB connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lockernetwork')
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Redis connection
// connectRedis();

// // Socket.io setup
// setupSocket(io);

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/merchant', merchantRoutes);
// app.use('/api/parcels', parcelRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/webhooks', webhookRoutes);

// // Health check
// app.get('/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime()
//   });
// });

// // Start notification worker
// startWorker();

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });