import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardAnalytics = async (req, res) => {
  try {
    const salesRange = req.query.salesRange === undefined ? '6' : req.query.salesRange;
    const salesBasis = req.query.salesBasis === undefined ? 'orders' : req.query.salesBasis;
    if (!['6', '12', 'all'].includes(salesRange) || !['orders', 'paid'].includes(salesBasis)) {
      return res.status(400).json({ message: 'Invalid sales chart filter' });
    }

    // Get date ranges
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

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
      { $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }, paymentStatus: 'paid' } },
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

    const salesOrderMatch = {
      orderStatus: { $ne: 'cancelled' },
      paymentStatus: { $nin: ['failed', 'refunded'] }
    };

    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: salesOrderMatch },
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

    const productSales = await Order.aggregate([
      { $match: salesOrderMatch },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' }
      }}
    ]);
    const salesByProduct = new Map(
      productSales.map(product => [String(product._id), product.totalSold])
    );
    const lowSoldProducts = (await Product.find().select('_id name').lean())
      .map(product => ({
        _id: product._id,
        name: product.name,
        totalSold: salesByProduct.get(String(product._id)) || 0
      }))
      .sort((a, b) => a.totalSold - b.totalSold || a.name.localeCompare(b.name))
      .slice(0, 5);

    const stockAlerts = await Product.find({ stock: { $lt: 10 } })
      .select('name category stock')
      .sort({ stock: 1, name: 1 });

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

    // Monthly sales for the selected basis and chart range
    const salesMatch = salesBasis === 'paid'
      ? { paymentStatus: 'paid' }
      : {
        orderStatus: { $ne: 'cancelled' },
        paymentStatus: { $nin: ['failed', 'refunded'] }
      };
    if (salesRange !== 'all') {
      salesMatch.createdAt = {
        $gte: new Date(today.getFullYear(), today.getMonth() - Number(salesRange) + 1, 1)
      };
    }

    const monthlySales = await Order.aggregate([
      { $match: salesMatch },
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
      lowSoldProducts,
      stockAlerts,
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
        totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
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
    const period = String(req.query.period || '30');
    if (!['7', '30', '90', '180', '365'].includes(period)) {
      return res.status(400).json({ message: 'Invalid sales period' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));
    startDate.setHours(0, 0, 0, 0);
    const periodMatch = { createdAt: { $gte: startDate } };
    const paidMatch = { ...periodMatch, paymentStatus: 'paid' };

    const [
      totalRevenue,
      totalOrders,
      avgOrderValue,
      dailySales,
      monthlySales,
      paymentMethodCounts,
      categoryRevenue,
      topProducts,
      orderStatusDistribution
    ] = await Promise.all([
      Order.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments(periodMatch),
      Order.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, average: { $avg: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: paidMatch },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' }
        } },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: paidMatch },
        { $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' }
        } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Order.aggregate([
        { $match: periodMatch },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: paidMatch },
        { $unwind: '$items' },
        { $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        } },
        { $unwind: '$productDetails' },
        { $group: {
          _id: { category: '$productDetails.category', order: '$_id' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        } },
        { $group: {
          _id: '$_id.category',
          revenue: { $sum: '$revenue' },
          orders: { $sum: 1 }
        } },
        { $sort: { revenue: -1 } }
      ]),
      Order.aggregate([
        { $match: paidMatch },
        { $unwind: '$items' },
        { $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] }
          }
        } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        { $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        } },
        { $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true
        } },
        { $project: {
          _id: 1,
          name: 1,
          totalSold: 1,
          totalRevenue: 1,
          images: { $ifNull: ['$productDetails.images', []] }
        } }
      ]),
      Order.aggregate([
        { $match: periodMatch },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const paymentMethods = paymentMethodCounts.reduce((result, method) => {
      const key = method._id || 'unknown';
      result[key] = method.count;
      result.total += method.count;
      return result;
    }, { total: 0 });

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders,
      averageOrderValue: avgOrderValue[0]?.average || 0,
      conversionRate: null,
      monthlySales: monthlySales.map(({ _id, revenue }) => ({
        month: new Date(_id.year, _id.month - 1).toLocaleString('en', {
          month: 'short',
          year: '2-digit'
        }),
        revenue
      })),
      categoryRevenue: categoryRevenue.map(({ _id, ...category }) => ({
        category: _id,
        ...category
      })),
      topProducts,
      orderStatusDistribution,
      paymentMethods,
      dailyRevenue: dailySales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
