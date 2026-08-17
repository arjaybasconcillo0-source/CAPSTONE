import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  getAllUsers 
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);

// Admin routes
router.get('/users', protect, admin, getAllUsers);

export default router;
