import express from "express";
import {
  createReview,
  getProductReviews,
  checkReviewEligibility
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes
router.get("/:productId", getProductReviews);

// Protected Routes
router.post("/", protect, createReview);
router.get("/check/:productId", protect, checkReviewEligibility);

export default router;
