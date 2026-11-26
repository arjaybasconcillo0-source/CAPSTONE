import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  changePassword,
  getAllUsers 
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.patch('/change-password', protect, changePassword);

// Admin routes
router.get('/users', protect, admin, getAllUsers);

export default router;
