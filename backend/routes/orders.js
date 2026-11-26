import express from 'express';
import {
  getOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  trackOrder,
  updateOrderStatus,
  deleteOrder
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Authenticated customer route
router.post('/', protect, createOrder);
router.post('/track', protect, trackOrder);
router.get('/mine', protect, getMyOrders);

// Admin routes
router.get('/', protect, admin, getOrders);
router.get('/:id', protect, admin, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.delete('/:id', protect, admin, deleteOrder);

export default router;
