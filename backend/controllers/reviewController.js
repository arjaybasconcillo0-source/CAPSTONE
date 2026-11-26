import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

const validateProductId = (id) => mongoose.isObjectIdOrHexString(id);

const validateReviewInput = (body = {}) => {
  const { rating, comment } = body || {};
  const numericRating = Number(rating);
  const normalizedComment = typeof comment === 'string' ? comment.trim() : '';

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return { error: 'Rating must be a whole number from 1 to 5.' };
  }

  if (!normalizedComment || normalizedComment.length > 2000) {
    return { error: 'Review text is required and must be 2,000 characters or fewer.' };
  }

  return { rating: numericRating, comment: normalizedComment };
};

const hasDeliveredPurchase = async (userId, productId) => Order.exists({
  user: userId,
  orderStatus: 'delivered',
  'items.product': productId
});

const updateProductRating = async (productId) => {
  const [summary] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: {
      _id: null,
      average: { $avg: '$rating' },
      count: { $sum: 1 }
    } }
  ]);

  return Product.findByIdAndUpdate(productId, {
    rating: summary ? Number(summary.average.toFixed(2)) : 0,
    reviewsCount: summary?.count || 0
  }, { new: true }).select('rating reviewsCount').lean();
};

export const getProductReviews = async (req, res) => {
  try {
    if (!validateProductId(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productExists = await Product.exists({ _id: req.params.id });
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ reviews });
  } catch (error) {
    console.error('Unable to fetch product reviews:', error);
    return res.status(500).json({ message: 'Unable to load product reviews.' });
  }
};

export const createProductReview = async (req, res) => {
  try {
    if (!validateProductId(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const input = validateReviewInput(req.body);
    if (input.error) {
      return res.status(400).json({ message: input.error });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!await hasDeliveredPurchase(req.user._id, product._id)) {
      return res.status(403).json({
        message: 'Only customers with a delivered order for this product can leave a review.'
      });
    }

    const existingReview = await Review.exists({
      product: product._id,
      user: req.user._id
    });
    if (existingReview) {
      return res.status(409).json({
        message: 'You have already submitted a review for this product. Submitted reviews cannot be changed.'
      });
    }

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      rating: input.rating,
      comment: input.comment
    });

    const updatedProduct = await updateProductRating(product._id);
    await review.populate('user', 'name');

    return res.status(existingReview ? 200 : 201).json({
      review,
      product: {
        rating: updatedProduct.rating,
        reviewsCount: updatedProduct.reviewsCount
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'You have already submitted a review for this product. Submitted reviews cannot be changed.'
      });
    }

    console.error('Unable to submit product review:', error);
    return res.status(500).json({ message: 'Unable to submit your review.' });
  }
};
