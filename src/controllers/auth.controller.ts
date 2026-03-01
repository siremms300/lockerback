 
// src/controllers/auth.controller.ts - Add logout function
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
// import Merchant, { IMerchant } from '../models/Merchant';  
import { Merchant } from '../models';

// Optional: If you want to blacklist tokens (more secure)
// You'll need to create a BlacklistedToken model
// import BlacklistedToken from '../models/BlacklistedToken';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessName, email, phone, password, businessType } = req.body;
    
    // Check if merchant exists
    const existingMerchant = await Merchant.findOne({ 
      $or: [{ email }, { businessName }] 
    });
    
    if (existingMerchant) {
      res.status(400).json({ error: 'Merchant already exists' });
      return;
    }
    
    // Create merchant with default role 'merchant'
    const merchant = new Merchant({
      businessName,
      email,
      phone,
      password,
      businessType,
      role: 'merchant',
      isActive: true
    });
    
    await merchant.save();
    
    // Generate token
    const token = jwt.sign(
      { id: merchant._id, role: merchant.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      merchant: {
        id: merchant._id,
        businessName: merchant.businessName,
        email: merchant.email,
        role: merchant.role
      },
      token
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// export const login = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, password } = req.body;
    
//     const merchant = await Merchant.findOne({ email });
    
//     if (!merchant) {
//       res.status(401).json({ error: 'Invalid credentials' });
//       return;
//     }
    
//     const isMatch = await merchant.comparePassword(password);
    
//     if (!isMatch) {
//       res.status(401).json({ error: 'Invalid credentials' });
//       return;
//     }
    
//     const token = jwt.sign(
//       { id: merchant._id, role: merchant.role },
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '7d' }
//     );
    
//     res.json({
//       merchant: {
//         id: merchant._id,
//         businessName: merchant.businessName,
//         email: merchant.email,
//         role: merchant.role
//       },
//       token
//     });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// ADD LOGOUT FUNCTION


export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email); // Debug log
    
    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    // Find merchant
    const merchant = await Merchant.findOne({ email });
    
    if (!merchant) {
      console.log('Merchant not found for email:', email);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    console.log('Merchant found:', merchant.businessName); // Debug log
    console.log('Stored hashed password:', merchant.password); // Debug log
    
    // Check password
    const isMatch = await merchant.comparePassword(password);
    console.log('Password match result:', isMatch); // Debug log
    
    if (!isMatch) {
      console.log('Password does not match');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // Generate token
    const token = jwt.sign(
      { id: merchant._id, role: merchant.role || 'merchant' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('Login successful for:', merchant.email); // Debug log
    
    res.json({
      merchant: {
        id: merchant._id,
        businessName: merchant.businessName,
        email: merchant.email,
        role: merchant.role || 'merchant'
      },
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// export const logout = async (req: Request, res: Response): Promise<void> => {
//   try {
//     // Option 1: Simple logout (client just removes token)
//     // This is the simplest approach - just return success
//     // The frontend will handle removing the token
    
//     res.json({ 
//       success: true, 
//       message: 'Logged out successfully' 
//     });

//     /* 
//     // Option 2: More secure - Blacklist the token
//     // This prevents the token from being used even if not expired
//     // You'll need a BlacklistedToken model for this
    
//     const token = req.header('Authorization')?.replace('Bearer ', '');
    
//     if (token) {
//       // Decode token to get expiration
//       const decoded = jwt.decode(token) as { exp: number };
      
//       if (decoded && decoded.exp) {
//         // Calculate remaining time until token expires
//         const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        
//         // Add to blacklist
//         await BlacklistedToken.create({
//           token,
//           expiresAt: new Date(decoded.exp * 1000)
//         });
//       }
//     }
    
//     res.json({ 
//       success: true, 
//       message: 'Logged out successfully' 
//     });
//     */
    
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// Optional: Logout from all devices



// src/controllers/auth.controller.ts - Update logout function
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Logout attempt for user:', req.user?.email);
    
    // Optional: Blacklist token if you have that model
    // if (token) {
    //   await BlacklistedToken.create({ token });
    // }
    
    // Just return success - frontend will clear local storage
    res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};




export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would require storing tokens or using a different strategy
    // For JWT, you'd typically need to change the user's secret or maintain a token blacklist
    
    // Simple approach: Just return success and let client clear tokens
    res.json({ 
      success: true, 
      message: 'Logged out from all devices' 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};




































































// // src/controllers/auth.controller.ts
// import { Request, Response } from 'express';
// import jwt from 'jsonwebtoken';
// // import Merchant, { IMerchant } from '../models/Merchant';  
// import { Merchant } from '../models';

// // export const register = async (req: Request, res: Response): Promise<void> => {
// //   try {
// //     const { businessName, email, phone, password, businessType } = req.body;
    
// //     // Check if merchant exists
// //     const existingMerchant = await Merchant.findOne({ 
// //       $or: [{ email }, { businessName }] 
// //     });
    
// //     if (existingMerchant) {
// //       res.status(400).json({ error: 'Merchant already exists' });
// //       return;
// //     }
    
// //     // Create merchant
// //     const merchant = new Merchant({
// //       businessName,
// //       email,
// //       phone,
// //       password,
// //       businessType
// //     });
    
// //     await merchant.save();
    
// //     // Generate token
// //     const token = jwt.sign(
// //       { id: merchant._id },
// //       process.env.JWT_SECRET || 'your-secret-key',
// //       { expiresIn: '7d' }
// //     );
    
// //     res.status(201).json({
// //       merchant: {
// //         id: merchant._id,
// //         businessName: merchant.businessName,
// //         email: merchant.email
// //       },
// //       token
// //     });
// //   } catch (error: any) {
// //     res.status(400).json({ error: error.message });
// //   }
// // };


// // src/controllers/auth.controller.ts - Update register function
// export const register = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { businessName, email, phone, password, businessType } = req.body;
    
//     // Check if merchant exists
//     const existingMerchant = await Merchant.findOne({ 
//       $or: [{ email }, { businessName }] 
//     });
    
//     if (existingMerchant) {
//       res.status(400).json({ error: 'Merchant already exists' });
//       return;
//     }
    
//     // Create merchant with default role 'merchant'
//     const merchant = new Merchant({
//       businessName,
//       email,
//       phone,
//       password,
//       businessType,
//       role: 'merchant',  // SET DEFAULT ROLE
//       isActive: true
//     });
    
//     await merchant.save();
    
//     // Generate token
//     const token = jwt.sign(
//       { id: merchant._id, role: merchant.role },  // Include role in token
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '7d' }
//     );
    
//     res.status(201).json({
//       merchant: {
//         id: merchant._id,
//         businessName: merchant.businessName,
//         email: merchant.email,
//         role: merchant.role  // Return role to frontend
//       },
//       token
//     });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// // Update login to include role in response
// export const login = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, password } = req.body;
    
//     const merchant = await Merchant.findOne({ email });
    
//     if (!merchant) {
//       res.status(401).json({ error: 'Invalid credentials' });
//       return;
//     }
    
//     const isMatch = await merchant.comparePassword(password);
    
//     if (!isMatch) {
//       res.status(401).json({ error: 'Invalid credentials' });
//       return;
//     }
    
//     const token = jwt.sign(
//       { id: merchant._id, role: merchant.role },  // Include role in token
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '7d' }
//     );
    
//     res.json({
//       merchant: {
//         id: merchant._id,
//         businessName: merchant.businessName,
//         email: merchant.email,
//         role: merchant.role  // Return role to frontend
//       },
//       token
//     });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };


// // export const login = async (req: Request, res: Response): Promise<void> => {
// //   try {
// //     const { email, password } = req.body;
    
// //     // Find merchant
// //     const merchant = await Merchant.findOne({ email });
    
// //     if (!merchant) {
// //       res.status(401).json({ error: 'Invalid credentials' });
// //       return;
// //     }
    
// //     // Check password
// //     const isMatch = await merchant.comparePassword(password);
    
// //     if (!isMatch) {
// //       res.status(401).json({ error: 'Invalid credentials' });
// //       return;
// //     }
    
// //     // Generate token
// //     const token = jwt.sign(
// //       { id: merchant._id },
// //       process.env.JWT_SECRET || 'your-secret-key',
// //       { expiresIn: '7d' }
// //     );
    
// //     res.json({
// //       merchant: {
// //         id: merchant._id,
// //         businessName: merchant.businessName,
// //         email: merchant.email
// //       },
// //       token
// //     });
// //   } catch (error: any) {
// //     res.status(400).json({ error: error.message });
// //   }
// // };




