import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Order from './models/Order.js';

dotenv.config();

// Categories data
const categories = [
  { name: 'Bags', slug: 'bags', description: 'Handwoven bags from water lily fiber' },
  { name: 'Shoulder Bags', slug: 'shoulder-bags', description: 'Handwoven shoulder bags made with natural water lily fiber' },
  { name: 'Home Decor', slug: 'home-decor', description: 'Eco-friendly home decoration items' },
  { name: 'Wallets', slug: 'wallets', description: 'Handwoven wallets made from natural water lily fiber' },
  { name: 'Hats', slug: 'hats', description: 'Handwoven hats crafted from natural water lily fiber' }
];

// Products data
const products = [
  {
    name: "Artisan Water Lily Tote",
    price: 2450,
    category: "bags",
    description: "Expertly crafted from sustainable water lily fiber, this spacious tote combines functionality with eco-luxury. Features cotton lining and reinforced handles for durability. Each bag supports local artisan communities with fair trade practices.",
    rating: 4.8,
    reviewsCount: 127,
    materials: ["Water lily fiber", "Organic cotton lining", "Natural dyes"],
    tags: ["eco-friendly", "handmade", "best-seller"],
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
      "https://i.pinimg.com/1200x/99/fa/bb/99fabb2673ef5f4324bf5f49b0fd4ed3.jpg"
    ],
    variants: [
      { size: 'Medium', color: 'Natural', stock: 15 },
      { size: 'Large', color: 'Natural', stock: 8 },
      { size: 'Medium', color: 'Earth Brown', stock: 12 }
    ],
    stock: 35
  },
  {
    name: "Eco Crossbody Purse",
    price: 1850,
    category: "bags",
    description: "Stylish and practical crossbody bag handwoven from water lily stems. Features an adjustable strap and secure zip closure. The natural texture and earthy tones complement any casual outfit.",
    rating: 4.6,
    reviewsCount: 89,
    materials: ["Water lily fiber", "Brass hardware", "Cotton canvas lining"],
    tags: ["eco-friendly", "handmade"],
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80"
    ],
    variants: [
      { size: 'One Size', color: 'Natural', stock: 22 },
      { size: 'One Size', color: 'Sage Green', stock: 18 }
    ],
    stock: 40
  },
  {
    name: "Market Shopping Bag",
    price: 1650,
    category: "bags",
    description: "Strong and sustainable alternative to plastic bags. Handwoven with reinforced bottom and comfortable handles. Perfect for farmers markets, grocery shopping, or beach days.",
    rating: 4.9,
    reviewsCount: 203,
    materials: ["Water lily fiber", "Natural hemp reinforcement"],
    tags: ["eco-friendly", "handmade", "best-seller"],
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80",
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80"
    ],
    variants: [
      { size: 'Standard', color: 'Natural', stock: 30 }
    ],
    stock: 30
  },
  {
    name: "Traditional Storage Basket",
    price: 3200,
    category: "baskets",
    description: "Beautifully crafted storage basket perfect for organizing your home. Features a tight weave pattern that's both decorative and functional. Ideal for blankets, toys, or laundry.",
    rating: 4.7,
    reviewsCount: 156,
    materials: ["Water lily fiber", "Natural lacquer finish"],
    tags: ["handmade", "eco-friendly"],
    images: [
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=80",
      "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80"
    ],
    variants: [
      { size: 'Medium', color: 'Natural', stock: 12 },
      { size: 'Large', color: 'Natural', stock: 8 }
    ],
    stock: 20
  },
  {
    name: "Fruit Bowl Basket",
    price: 1450,
    category: "baskets",
    description: "Display your fresh fruits in style with this handwoven basket. The open weave allows air circulation to keep produce fresh longer. A beautiful centerpiece for any kitchen or dining table.",
    rating: 4.5,
    reviewsCount: 78,
    materials: ["Water lily fiber"],
    tags: ["handmade", "eco-friendly", "kitchen"],
    images: [
      "https://images.unsplash.com/photo-1595034327777-05f8e76e36b4?w=600&q=80"
    ],
    variants: [
      { size: 'Standard', color: 'Natural', stock: 25 }
    ],
    stock: 25
  },
  {
    name: "Decorative Wall Art",
    price: 2800,
    category: "home-decor",
    description: "Transform your walls with this intricate water lily wall art. Each piece is uniquely handcrafted by skilled artisans. The natural fibers create beautiful shadows and textures that change throughout the day.",
    rating: 4.9,
    reviewsCount: 92,
    materials: ["Water lily fiber", "Bamboo frame"],
    tags: ["handmade", "eco-friendly", "art"],
    images: [
      "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=600&q=80"
    ],
    variants: [
      { size: 'Small (30cm)', color: 'Natural', stock: 10 },
      { size: 'Medium (50cm)', color: 'Natural', stock: 8 },
      { size: 'Large (70cm)', color: 'Natural', stock: 5 }
    ],
    stock: 23
  },
  {
    name: "Handwoven Water Lily Wallet",
    price: 650,
    category: "wallets",
    description: "Carry your everyday essentials in this compact wallet, handwoven from sustainable water lily fiber by local artisans.",
    rating: 4.7,
    reviewsCount: 245,
    materials: ["Water lily fiber", "Natural binding"],
    tags: ["eco-friendly", "handmade", "best-seller"],
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"
    ],
    variants: [
      { size: 'One Size', color: 'Natural', stock: 50 },
      { size: 'One Size', color: 'Earth Tones', stock: 35 }
    ],
    stock: 85
  },
  {
    name: "Handwoven Water Lily Hat",
    price: 1200,
    category: "hats",
    description: "A lightweight handwoven hat made from natural water lily fiber, crafted by local artisans for a timeless look.",
    rating: 4.6,
    reviewsCount: 134,
    materials: ["Water lily fiber"],
    tags: ["eco-friendly", "handmade", "accessories"],
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80"
    ],
    variants: [
      { size: 'One Size', color: 'Natural', stock: 40 },
      { size: 'One Size', color: 'Earth Tones', stock: 25 }
    ],
    stock: 65
  }
];

// Admin user
const adminUser = {
  name: 'Admin',
  email: 'admin@waterlily.com',
  password: 'admin123',
  role: 'admin'
};

// Regular user
const regularUser = {
  name: 'User',
  email: 'user@waterlily.com',
  password: 'user123',
  role: 'user'
};

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Order.deleteMany({});

    // Create users
    console.log('Creating users...');
    const admin = await User.create(adminUser);
    const user = await User.create(regularUser);
    console.log('Users created successfully');

    // Create categories
    console.log('Creating categories...');
    await Category.insertMany(categories);
    console.log('Categories created successfully');

    // Create products with admin as creator
    console.log('Creating products...');
    const productsWithCreator = products.map(p => ({ ...p, createdBy: admin._id }));
    const createdProducts = await Product.insertMany(productsWithCreator);
    console.log('Products created successfully');

    // Create sample orders for analytics
    console.log('Creating sample orders...');
    const sampleOrders = [];
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const paymentStatuses = ['pending', 'paid', 'paid', 'paid', 'paid']; // More paid for realistic data
    const paymentMethods = ['cod'];

    // Generate orders for the last 6 months
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 180);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        items.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity,
          variantSize: product.variants[0]?.size || 'Standard',
          variantColor: product.variants[0]?.color || 'Natural'
        });
        subtotal += product.price * quantity;
      }

      const shippingFee = subtotal > 3000 ? 0 : 150;
      const statusIndex = Math.floor(Math.random() * statuses.length);

      sampleOrders.push({
        user: user._id,
        orderNumber: `WL-${Date.now().toString(36).toUpperCase()}-${(i + 1).toString().padStart(4, '0')}`,
        items,
        shippingAddress: {
          fullName: 'Sample Customer',
          address: '123 Sample Street, Barangay Test',
          city: 'Manila',
          province: 'Metro Manila',
          postalCode: '1000',
          phone: '09123456789'
        },
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentStatus: paymentStatuses[statusIndex],
        orderStatus: statuses[statusIndex],
        subtotal,
        shippingFee,
        totalAmount: subtotal + shippingFee,
        createdAt: orderDate,
        updatedAt: orderDate
      });
    }

    await Order.insertMany(sampleOrders);
    console.log('Sample orders created successfully');

    console.log('\n========================================');
    console.log('Database seeded successfully!');
    console.log('========================================');
    console.log('\nAdmin login credentials:');
    console.log('Email: admin@waterlily.com');
    console.log('Password: admin123');
    console.log('\nUser login credentials:');
    console.log('Email: user@waterlily.com');
    console.log('Password: user123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
