// Water Lily Handicrafts - Mock Product Data
// Using royalty-free images from Unsplash and Pexels

export const categories = [
  { id: 1, name: 'Bags', slug: 'bags' },
  { id: 2, name: 'Baskets', slug: 'baskets' },
  { id: 3, name: 'Home Decor', slug: 'home-decor' },
  { id: 4, name: 'Coasters', slug: 'coasters' },
  { id: 5, name: 'Placemats', slug: 'placemats' }
]

export const products = [
  // Bags Category
  {
    id: 1,
    name: "Water Lily Bag",
    price: 120,
    category: "bags",
    shortDesc: "Eco-friendly tote bag made from sustainable water lily fiber",
    description: "Handwoven tote bag crafted from water lily stems, featuring a spacious interior and sturdy handles. Perfect for everyday use, this bag combines style with sustainability.",
    rating: 0,
    reviewsCount: 0,
    materials: ["Water lily fiber", "Organic cotton lining", "Natural dyes"],
    tags: ["eco-friendly", "handmade", "best-seller"],
    images: [
     "https://coopbiz.ph/wp-content/uploads/2023/10/370250153_628766599335130_8121335544811866514_n-removebg-preview-300x300.png"
    ],
    variants: [
      { size: 'Medium', color: 'Natural', stock: 15 },
      { size: 'Large', color: 'Natural', stock: 8 },
      { size: 'Medium', color: 'Earth Brown', stock: 12 }
    ],
    stock: 35
  },
  {
    id: 3,
    name: "Water Lily Slippers",
    price: 90,
    category: "bags",
    shortDesc: "Stylish and practical crossbody bag handwoven from water lily stems",
    description: "Lightweight crossbody bag made from water lily fiber, featuring a secure flap closure and adjustable strap. Ideal for carrying essentials while keeping your hands free.",
    rating: 0,
    reviewsCount: 0,
    materials: ["Water lily fiber", "Brass hardware", "Cotton canvas lining"],
    tags: ["handmade", "eco-friendly", "best-seller"],
    images: [
   "https://sc01.alicdn.com/kf/A9fe0e12bea9c400b8606aa5a469afe1af.jpg"
    ],
    variants: [
      { size: 'One Size', color: 'Natural', stock: 22 },
      { size: 'One Size', color: 'Sage Green', stock: 18 }
    ],
    stock: 40
  },

  // Baskets Category  

  {
    id: 6,
    name: "Water Lily Hats", 
    price: 110,
    category: "hats",
    shortDesc: "Hats handwoven from water lily fiber with a comfortable fit",
    description: "Lightweight and breathable hats made from water lily fiber, perfect for sunny days. Each hat is handwoven, ensuring a unique texture and design.",
    rating: 0,
    reviewsCount: 0,
    materials: ["Water lily fiber", "Hemp lid binding"],
    tags: ["handmade", "eco-friendly", "best-seller"],
    images: [
    "https://s.alicdn.com/@sc04/kf/A29f70bac61b34abb884988c09a7364a9w.jpg"
    ],
    variants: [
      { size: 'Large', color: 'Natural', stock: 15 }
    ],
    stock: 15
  },

  // Home Decor Category
  {
    id: 7,
    name: "Water Lily Lampshades",
    price: 150,
    category: "home-decor", 
    shortDesc: "Handwoven lampshades made from water lily fiber, adding a warm glow to any space",
    description: "Illuminate your home with these artisanal lampshades crafted from water lily fiber. Each piece is handwoven, creating a unique texture that diffuses light beautifully, perfect for creating a cozy ambiance.",
    rating: 4.6,
    reviewsCount: 78,
    materials: ["Water lily fiber", "Bamboo frame", "Natural dyes"],
  tags: ["handmade", "eco-friendly", "best-seller"],
    images: [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcQRvnSlRsCp2MIpmyfpkg06N0JadG1Jka9ArR7fHkDJ9ChLN9raVOS5U&s=10"
    ],
    variants: [
      { size: 'Medium', color: 'Natural', stock: 18 },
      { size: 'Large', color: 'Natural', stock: 12 },
      { size: 'Medium', color: 'Sage', stock: 10 }
    ],
    stock: 40
  },
 
 

  // Placemats Category
  
]

// Utility functions
export function getProductById(id) {
  return products.find(product => product.id === parseInt(id))
}

export function getProductsByCategory(category) {
  if (!category) return products
  return products.filter(product => product.category === category)
}

export function searchProducts(query) {
  if (!query) return products
  const searchTerm = query.toLowerCase()
  return products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm) ||
    product.materials.some(material => material.toLowerCase().includes(searchTerm)) ||
    product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  )
}

export function getFeaturedProducts() {
  return products.filter(product => product.tags.includes('best-seller')).slice(0, 8)
}

export function getRelatedProducts(productId, limit = 4) {
  const product = getProductById(productId)
  if (!product) return []
  
  const related = products
    .filter(p => p.id !== productId && p.category === product.category)
    .slice(0, limit)
  
  // Fill with random products if not enough in same category
  if (related.length < limit) {
    const remaining = products
      .filter(p => p.id !== productId && !related.includes(p))
      .slice(0, limit - related.length)
    related.push(...remaining)
  }
  
  return related
}