// src/socket/socket.ts
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Merchant from '../models/Merchant';

interface MerchantSocket extends Socket {
  merchantId?: string;
}

// Declare io variable at module level
let io: Server;

export const setupSocket = (socketIo: Server) => {
  io = socketIo;

  // Authentication middleware
  io.use(async (socket: MerchantSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
      const merchant = await Merchant.findById(decoded.id);
      
      if (!merchant) {
        return next(new Error('Merchant not found'));
      }
      
      socket.merchantId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: MerchantSocket) => {
    console.log(`Merchant connected: ${socket.merchantId}`);
    
    // Join merchant's private room
    if (socket.merchantId) {
      socket.join(`merchant:${socket.merchantId}`);
    }

    // Subscribe to parcel updates
    socket.on('subscribe-parcel', (parcelId: string) => {
      socket.join(`parcel:${parcelId}`);
    });

    // Request real-time locker availability
    socket.on('request-locker-availability', (locationId: string) => {
      // Emit current locker status
      // This would connect to your locker service
      socket.emit('locker-availability', {
        locationId,
        available: 12,
        total: 24,
        sizes: { small: 5, medium: 6, large: 1 }
      });
    });

    // Handle bulk shipment creation
    socket.on('create-bulk-shipments', async (data: any, callback: Function) => {
      try {
        // Process in background
        callback({ success: true, jobId: 'job_123' });
        
        // Emit progress updates
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          socket.emit('bulk-job-progress', {
            jobId: 'job_123',
            progress,
            status: 'processing'
          });
          
          if (progress >= 100) {
            clearInterval(interval);
            socket.emit('bulk-job-complete', {
              jobId: 'job_123',
              result: { success: 50, failed: 2 }
            });
          }
        }, 500);
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Merchant disconnected: ${socket.merchantId}`);
    });
  });
};

// Helper function to emit events to specific merchant
export const emitToMerchant = (merchantId: string, event: string, data: any) => {
  if (io) {
    io.to(`merchant:${merchantId}`).emit(event, data);
  }
};

// Helper function to emit parcel updates
export const emitParcelUpdate = (parcelId: string, update: any) => {
  if (io) {
    io.to(`parcel:${parcelId}`).emit('parcel-updated', update);
  }
};
































































// // backend/src/socket/socket.ts
// import { Server, Socket } from 'socket.io';
// import jwt from 'jsonwebtoken';
// import Merchant from '../models/Merchant';

// interface MerchantSocket extends Socket {
//   merchantId?: string;
// }

// export const setupSocket = (io: Server) => {
//   // Authentication middleware
//   io.use(async (socket: MerchantSocket, next) => {
//     try {
//       const token = socket.handshake.auth.token;
      
//       if (!token) {
//         return next(new Error('Authentication error'));
//       }
      
//       const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
//       const merchant = await Merchant.findById(decoded.id);
      
//       if (!merchant) {
//         return next(new Error('Merchant not found'));
//       }
      
//       socket.merchantId = decoded.id;
//       next();
//     } catch (error) {
//       next(new Error('Authentication error'));
//     }
//   });

//   io.on('connection', (socket: MerchantSocket) => {
//     console.log(`Merchant connected: ${socket.merchantId}`);
    
//     // Join merchant's private room
//     if (socket.merchantId) {
//       socket.join(`merchant:${socket.merchantId}`);
//     }

//     // Subscribe to parcel updates
//     socket.on('subscribe-parcel', (parcelId: string) => {
//       socket.join(`parcel:${parcelId}`);
//     });

//     // Request real-time locker availability
//     socket.on('request-locker-availability', (locationId: string) => {
//       // Emit current locker status
//       // This would connect to your locker service
//       socket.emit('locker-availability', {
//         locationId,
//         available: 12,
//         total: 24,
//         sizes: { small: 5, medium: 6, large: 1 }
//       });
//     });

//     // Handle bulk shipment creation
//     socket.on('create-bulk-shipments', async (data, callback) => {
//       try {
//         // Process in background
//         callback({ success: true, jobId: 'job_123' });
        
//         // Emit progress updates
//         let progress = 0;
//         const interval = setInterval(() => {
//           progress += 10;
//           socket.emit('bulk-job-progress', {
//             jobId: 'job_123',
//             progress,
//             status: 'processing'
//           });
          
//           if (progress >= 100) {
//             clearInterval(interval);
//             socket.emit('bulk-job-complete', {
//               jobId: 'job_123',
//               result: { success: 50, failed: 2 }
//             });
//           }
//         }, 500);
//       } catch (error) {
//         callback({ success: false, error: error.message });
//       }
//     });

//     socket.on('disconnect', () => {
//       console.log(`Merchant disconnected: ${socket.merchantId}`);
//     });
//   });
// };

// // Helper function to emit events to specific merchant
// export const emitToMerchant = (merchantId: string, event: string, data: any) => {
//   io.to(`merchant:${merchantId}`).emit(event, data);
// };

// // Helper function to emit parcel updates
// export const emitParcelUpdate = (parcelId: string, update: any) => {
//   io.to(`parcel:${parcelId}`).emit('parcel-updated', update);
// };







// // src/socket/socket.ts
// import { Server, Socket } from 'socket.io';
// import jwt from 'jsonwebtoken';
// import Merchant from '../models/Merchant';

// interface MerchantSocket extends Socket {
//   merchantId?: string;
// }

// let io: Server;

// export const setupSocket = (socketIo: Server) => {
//   io = socketIo;

//   io.use(async (socket: MerchantSocket, next) => {
//     try {
//       const token = socket.handshake.auth.token;
      
//       if (!token) {
//         return next(new Error('Authentication error'));
//       }
      
//       const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
//       const merchant = await Merchant.findById(decoded.id);
      
//       if (!merchant) {
//         return next(new Error('Merchant not found'));
//       }
      
//       socket.merchantId = decoded.id;
//       next();
//     } catch (error) {
//       next(new Error('Authentication error'));
//     }
//   });

//   io.on('connection', (socket: MerchantSocket) => {
//     console.log(`Merchant connected: ${socket.merchantId}`);
    
//     if (socket.merchantId) {
//       socket.join(`merchant:${socket.merchantId}`);
//     }

//     socket.on('subscribe-parcel', (parcelId: string) => {
//       socket.join(`parcel:${parcelId}`);
//     });

//     socket.on('disconnect', () => {
//       console.log(`Merchant disconnected: ${socket.merchantId}`);
//     });
//   });
// };

// export const emitToMerchant = (merchantId: string, event: string, data: any) => {
//   if (io) {
//     io.to(`merchant:${merchantId}`).emit(event, data);
//   }
// };

// export const emitParcelUpdate = (parcelId: string, update: any) => {
//   if (io) {
//     io.to(`parcel:${parcelId}`).emit('parcel-updated', update);
//   }
// };