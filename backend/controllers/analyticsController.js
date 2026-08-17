import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardAnalytics = async (req, res) => {
  try {
    // Get date ranges
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Total products
    const totalProducts = await Product.countDocuments();
    
    // Low stock products (less than 10)
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10, $gt: 0 } });
    
    // Out of stock products
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Total orders
    const totalOrders = await Order.countDocuments();
    
    // Orders today
    const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfToday } });
    
    // Orders this month
    const ordersThisMonth = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });

    // Revenue calculations
    const revenueThisMonth = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const revenueLastMonth = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Total customers
    const totalCustomers = await User.countDocuments({ role: 'user' });

    // Pending orders
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    // Top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { 
        _id: '$items.product', 
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        name: { $first: '$items.name' }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // Sales by category
    const salesByCategory = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDetails'
      }},
      { $unwind: '$productDetails' },
      { $group: {
        _id: '$productDetails.category',
        totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        count: { $sum: '$items.quantity' }
      }},
      { $sort: { totalSales: -1 } }
    ]);

    // Monthly sales for chart (last 6 months)
    const monthlySales = await Order.aggregate([
      { $match: { 
        createdAt: { $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) },
        paymentStatus: 'paid'
      }},
      { $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        sales: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Order status distribution
    const orderStatusDistribution = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    res.json({
      summary: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalOrders,
        ordersToday,
        ordersThisMonth,
        totalRevenue: totalRevenue[0]?.total || 0,
        revenueThisMonth: revenueThisMonth[0]?.total || 0,
        revenueLastMonth: revenueLastMonth[0]?.total || 0,
        totalCustomers,
        pendingOrders
      },
      recentOrders,
      topProducts,
      salesByCategory,
      monthlySales,
      orderStatusDistribution
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get inventory overview
// @route   GET /api/analytics/inventory
// @access  Private/Admin
export const getInventoryAnalytics = async (req, res) => {
  try {
    // Products by category with stock info
    const inventoryByCategory = await Product.aggregate([
      { $group: {
        _id: '$category',
        totalProducts: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        avgPrice: { $avg: '$price' },
        lowStock: { $sum: { $cond: [{ $and: [{ $lt: ['$stock', 10] }, { $gt: ['$stock', 0] }] }, 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }
      }},
      { $sort: { totalProducts: -1 } }
    ]);

    // All products with stock status
    const products = await Product.find()
      .select('name category price stock images')
      .sort({ stock: 1 });

    // Stock alerts (low and out of stock)
    const stockAlerts = await Product.find({ stock: { $lt: 10 } })
      .select('name category price stock images')
      .sort({ stock: 1 });

    res.json({
      inventoryByCategory,
      products,
      stockAlerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get sales analytics
// @route   GET /api/analytics/sales
// @access  Private/Admin
export const getSalesAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Daily sales for the period
    const dailySales = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sales: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }},
      { $sort: { '_id': 1 } }
    ]);

    // Payment method distribution
    const paymentMethods = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
    ]);

    // Average order value
    const avgOrderValue = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
      { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
    ]);

    res.json({
      dailySales,
      paymentMethods,
      avgOrderValue: avgOrderValue[0]?.avg || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
