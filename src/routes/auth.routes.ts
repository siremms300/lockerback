// src/routes/auth.routes.ts
import express from 'express';
import { register, login, logout, logoutAll } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll); // Optional

export default router;





















































// // src/routes/auth.routes.ts
// import express from 'express';
// import { register, login } from '../controllers/auth.controller';

// const router = express.Router();

// // Register new merchant
// router.post('/register', register);

// // Login merchant
// router.post('/login', login);

// export default router;