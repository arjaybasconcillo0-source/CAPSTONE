import express from 'express';
import {
  getDashboardAnalytics,
  getInventoryAnalytics,
  getSalesAnalytics
} from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes are admin only
router.get('/dashboard', protect, admin, getDashboardAnalytics);
router.get('/inventory', protect, admin, getInventoryAnalytics);
router.get('/sales', protect, admin, getSalesAnalytics);

export default router;
