import Review from "../models/reviewModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/Product.js";

// ✅ CREATE REVIEW (Verified Only)
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // 1. Check if user already reviewed this product
    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product" });
    }

    // 2. VERIFIED PURCHASE CHECK
    // Check if user has a 'delivered' order containing this product
    const deliveredOrder = await Order.findOne({
      user: userId,
      orderStatus: "delivered",
      "items.product": productId
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: "Only verified purchasers (with delivered orders) can review this product."
      });
    }

    // 3. Create the review
    const review = await Review.create({
      product: productId,
      user: userId,
      rating: Number(rating),
      comment
    });

    res.status(201).json({ success: true, message: "Review submitted successfully! ⭐", review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET PRODUCT REVIEWS (Public)
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const averageRating = count > 0 
      ? reviews.reduce((acc, item) => item.rating + acc, 0) / count 
      : 0;

    res.json({ success: true, count, averageRating: Math.round(averageRating * 10) / 10, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CHECK ELIGIBILITY (User)
export const checkReviewEligibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) return res.json({ eligible: false, message: "Already reviewed" });

    const deliveredOrder = await Order.findOne({
      user: userId,
      orderStatus: "delivered",
      "items.product": productId
    });

    res.json({ eligible: !!deliveredOrder });
  } catch (error) {
    res.status(500).json({ eligible: false, message: error.message });
  }
};
