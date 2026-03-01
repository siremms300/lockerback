// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Merchant from '../models/Merchant';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
    
//     if (!token) {
//       throw new Error();
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
//     const merchant = await Merchant.findById(decoded.id).select('-password');
    
//     if (!merchant) {
//       throw new Error();
//     }

//     req.user = merchant;
//     next();
//   } catch (error) {
//     res.status(401).json({ error: 'Please authenticate' });
//   }
// };



// src/middleware/auth.middleware.ts - Update to include role




export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string, role: string };
    const merchant = await Merchant.findById(decoded.id).select('-password');
    
    if (!merchant) {
      throw new Error();
    }

    req.user = merchant;
    req.user.role = decoded.role;  // Attach role to request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};





export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      throw new Error();
    }

    const merchant = await Merchant.findOne({ apiKey });
    
    if (!merchant) {
      throw new Error();
    }

    req.user = merchant;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid API key' });
  }
};