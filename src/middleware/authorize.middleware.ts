// src/middleware/authorize.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Permissions } from '../constants/permissions';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Check if user has a specific role
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      return next();
    } catch (error) {
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

// Check if user has a specific permission
export const hasPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Admins have all permissions
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        return next();
      }
      
      // Check granular permissions
      if (!req.user.permissions || !req.user.permissions.includes(permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      return next();
    } catch (error) {
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

// Check if user is the owner of a resource or admin
export const isOwnerOrAdmin = (getOwnerId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Admins can access any resource
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        return next();
      }
      
      // Check if user owns the resource
      const ownerId = getOwnerId(req);
      if (ownerId && ownerId === req.user._id.toString()) {
        return next();
      }
      
      return res.status(403).json({ error: 'You do not own this resource' });
    } catch (error) {
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};























































// // src/middleware/authorize.middleware.ts
// import { Request, Response, NextFunction } from 'express';
// import { Permissions } from '../constants/permissions';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: any;
//     }
//   }
// }

// // Check if user has a specific role
// export const hasRole = (roles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       return res.status(401).json({ error: 'Authentication required' });
//     }
    
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ error: 'Insufficient permissions' });
//     }
    
//     next();
//   };
// };

// // Check if user has a specific permission
// export const hasPermission = (permission: string) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       return res.status(401).json({ error: 'Authentication required' });
//     }
    
//     // Admins have all permissions
//     if (req.user.role === 'admin' || req.user.role === 'super_admin') {
//       return next();
//     }
    
//     // Check granular permissions
//     if (!req.user.hasPermission || !req.user.hasPermission(permission)) {
//       return res.status(403).json({ error: 'Insufficient permissions' });
//     }
    
//     next();
//   };
// };

// // Check if user is the owner of a resource or admin
// export const isOwnerOrAdmin = (getOwnerId: (req: Request) => string) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       return res.status(401).json({ error: 'Authentication required' });
//     }
    
//     // Admins can access any resource
//     if (req.user.role === 'admin' || req.user.role === 'super_admin') {
//       return next();
//     }
    
//     // Check if user owns the resource
//     const ownerId = getOwnerId(req);
//     if (ownerId && ownerId === req.user._id.toString()) {
//       return next();
//     }
    
//     return res.status(403).json({ error: 'You do not own this resource' });
//   };
// };