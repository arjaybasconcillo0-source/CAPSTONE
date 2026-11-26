import Order from '../models/Order.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get orders belonging to the signed-in customer
// @route   GET /api/orders/mine
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select(
        'orderNumber items shippingAddress paymentMethod paymentStatus orderStatus subtotal shippingFee totalAmount createdAt updatedAt'
      );

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private/Admin
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Track an order using its order number and shipping phone
// @route   POST /api/orders/track
// @access  Public
export const trackOrder = async (req, res) => {
  try {
    const { orderNumber, phone } = req.body;
    if (typeof orderNumber !== 'string' || typeof phone !== 'string' || !orderNumber.trim() || !phone.trim()) {
      return res.status(400).json({ message: 'Order number and phone number are required' });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.trim().toUpperCase(),
      user: req.user._id
    });
    const normalizePhone = (value) => value.replace(/\D/g, '');
    const submittedPhone = normalizePhone(phone);
    if (!order || !submittedPhone || normalizePhone(order.shippingAddress.phone) !== submittedPhone) {
      return res.status(404).json({ message: 'No order found with those details' });
    }

    res.json({
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customerName: order.shippingAddress.fullName,
      items: order.items.map(({ name, quantity, price, image, variantSize, variantColor }) => ({
        name,
        quantity,
        price,
        image,
        variantSize,
        variantColor
      })),
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      totalAmount: order.totalAmount,
      shippingAddress: {
        city: order.shippingAddress.city,
        province: order.shippingAddress.province
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new order (for customers)
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }
    if (!shippingAddress || ['fullName', 'address', 'city', 'province', 'postalCode', 'phone']
      .some((field) => typeof shippingAddress[field] !== 'string' || !shippingAddress[field].trim())) {
      return res.status(400).json({ message: 'Complete shipping information is required' });
    }
    if (paymentMethod && paymentMethod !== 'cod') {
      return res.status(400).json({ message: 'Only cash on delivery is available' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ message: 'Order item quantities must be positive whole numbers' });
      }

      if (!mongoose.isObjectIdOrHexString(item.productId)) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const orderItem = {
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images?.[0] || '',
        variantSize: item.variantSize,
        variantColor: item.variantColor
      };
      orderItem.product = product._id;
      orderItems.push(orderItem);

      subtotal += product.price * item.quantity;

      product.stock -= item.quantity;
      await product.save();
    }

    const shippingFee = subtotal > 3000 ? 0 : 150;
    const totalAmount = subtotal + shippingFee;

    const order = await Order.create({
      user: req.user?._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: 'cod',
      subtotal,
      shippingFee,
      totalAmount,
      notes
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
